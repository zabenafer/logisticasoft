import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Cliente } from '../../../../models/cliente.model';
import { SharedImports } from '../../../../material.module';
import { Localidad, Provincia, UbicacionService } from '../../../../services/ubicacion.service';
import { debounceTime, distinctUntilChanged, of, startWith, switchMap, tap } from 'rxjs';

interface ClienteDialogData {
  transportistaId: number;
  cliente?: Cliente; // si viene => edición
}

@Component({
  selector: 'app-cliente-dialog',
  standalone: true,
  templateUrl: './cliente-dialog.html',
  styleUrls: ['./cliente-dialog.scss'],
  imports: [ CommonModule, ReactiveFormsModule, SharedImports ],
})
export class ClienteDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClienteDialogComponent, any>);
  private ubicacionSvc = inject(UbicacionService);
  data = inject<ClienteDialogData>(MAT_DIALOG_DATA);

  isEdit = !!this.data?.cliente;

  form = this.fb.group({
    nombre: [this.data?.cliente?.nombre ?? '', [Validators.required, Validators.maxLength(60)]],
    apellido: [this.data?.cliente?.apellido ?? '', [Validators.required, Validators.maxLength(60)]],
    email: [this.data?.cliente?.email ?? '', [Validators.email, Validators.maxLength(120)]],
    telefono: [this.data?.cliente?.telefono ?? '', [Validators.maxLength(30)]],
    direccion: [this.data?.cliente?.direccion ?? '', [Validators.maxLength(120)]],
    provinciaId: [null as number | null],
    localidadId: [this.data?.cliente?.localidadId ?? null, Validators.required],
  });

  // El input puede contener texto (string) o el objeto Localidad seleccionado
  localidadQueryCtrl = new FormControl<Localidad | string>('', { nonNullable: true });

  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  localidadesLoading = signal(false);

  /** Para que el input muestre el nombre cuando su valor es un objeto */
  displayLocalidad = (val?: Localidad | string): string =>
    typeof val === 'string' ? val : (val?.nombre ?? '');

  ngOnInit(): void {
    // 1) Provincias
    this.ubicacionSvc.listarProvincias().subscribe(p => this.provincias = p ?? []);

    // 2) Cambio de provincia: limpia selección de localidad
    this.form.controls.provinciaId.valueChanges.subscribe(() => {
      this.form.controls.localidadId.setValue(null);
      this.localidadQueryCtrl.setValue('');
      this.localidades = [];
    });

    // 3) Autocomplete remoto
    this.localidadQueryCtrl.valueChanges.pipe(
      startWith(this.localidadQueryCtrl.value ?? ''),
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => this.localidadesLoading.set(true)),
      switchMap((v) => {
        // Normalizamos a string (si viene objeto tomamos su nombre)
        const term = (typeof v === 'string' ? v : (v?.nombre ?? '')).trim();
        if (term.length < 2) {
          this.localidadesLoading.set(false);
          return of<Localidad[]>([]);
        }
        return this.ubicacionSvc.buscarLocalidades(term, this.form.value.provinciaId ?? undefined);
      }),
      tap(() => this.localidadesLoading.set(false)),
    ).subscribe(list => this.localidades = list ?? []);

    // 4) Precarga si edito (tengo localidadId)
    const locId = this.data?.cliente?.localidadId;
    if (locId) {
      this.ubicacionSvc.localidadPorId(locId).subscribe({
        next: (loc) => {
          this.form.patchValue({ provinciaId: loc.provinciaId, localidadId: loc.id }, { emitEvent: false });
          // Dejo el OBJETO en el input para que displayWith muestre el nombre
          this.localidadQueryCtrl.setValue(loc, { emitEvent: false });
        },
        error: () => {
          this.form.patchValue({ provinciaId: null, localidadId: null }, { emitEvent: false });
          this.localidadQueryCtrl.setValue('', { emitEvent: false });
        }
      });
    }
  }

  onLocalidadSelected(loc: Localidad) {
    this.form.controls.localidadId.setValue(loc.id);               // guardo el id en el form
    this.localidadQueryCtrl.setValue(loc, { emitEvent: false });   // dejo el objeto para mostrar el nombre
    this.localidades = [];                                         // opcional: limpiar lista
    this.localidadesLoading.set(false);
  }

  get queryLength(): number {
    const v = this.localidadQueryCtrl.value;
    if (typeof v === 'string') return v.trim().length;
    return v?.nombre ? v.nombre.trim().length : 0;
  }

  guardar() {
    if (this.form.invalid) return;
    const payload = {
      nombre: this.form.value.nombre!,
      apellido: this.form.value.apellido!,
      email: this.form.value.email || '',
      telefono: this.form.value.telefono || '',
      direccion: this.form.value.direccion || '',
      localidadId: this.form.value.localidadId!, // requerido
      transportistaId: this.data.transportistaId,
    };
    this.dialogRef.close(payload);
  }

  cancelar() { this.dialogRef.close(null); }
}