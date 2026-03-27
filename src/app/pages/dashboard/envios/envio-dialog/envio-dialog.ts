import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedImports } from '../../../../material.module';
import { UbicacionService, Localidad, Provincia } from '../../../../services/ubicacion.service';
import { ClientesService } from '../../../../services/cliente.service';
import { debounceTime, distinctUntilChanged, of, startWith, switchMap, tap } from 'rxjs';
import { EnvioCreate, EnvioDTO } from '../../../../models/envio.model';
import { Cliente } from '../../../../models/cliente.model';
import { EnviosService, EstadoEnvio } from '../../../../services/envio.service';

interface EnvioDialogData {
  transportistaId: number;
  envio?: EnvioDTO;
}

@Component({
  selector: 'app-envio-dialog',
  standalone: true,
  templateUrl: './envio-dialog.html',
  styleUrls: ['./envio-dialog.scss'],
  imports: [CommonModule, ReactiveFormsModule, SharedImports],
})
export class EnvioDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EnvioDialogComponent, any>);
  private ubicacionSvc = inject(UbicacionService);
  private clientesSvc = inject(ClientesService);
  private enviosSvc = inject(EnviosService);
  data = inject<EnvioDialogData>(MAT_DIALOG_DATA);

  isEdit = !!this.data?.envio;

  // Form principal
  form = this.fb.group({
    // cabecera
    clienteId: [this.data?.envio?.clienteId ?? null, Validators.required],
    cantidad: [this.data?.envio?.cantidad ?? null],
    precio:   [this.data?.envio?.precio ?? null],
    estadoId: [this.data?.envio?.estadoId ?? null, Validators.required],
    // entrega
    horaEntregaDesde: [this.data?.envio?.horaEntregaDesde ?? ''],
    horaEntregaHasta: [this.data?.envio?.horaEntregaHasta ?? ''],
    // origen
    provinciaOrigenId: [null as number | null],
    localidadOrigenId: [this.data?.envio?.localidadOrigenId ?? null, Validators.required],
    direccionOrigen:   [this.data?.envio?.direccionOrigen ?? '', [Validators.required, Validators.maxLength(120)]],
    // destino
    provinciaDestinoId: [null as number | null],
    localidadDestinoId: [this.data?.envio?.localidadDestinoId ?? null, Validators.required],
    direccionDestino:   [this.data?.envio?.direccionDestino ?? '', [Validators.required, Validators.maxLength(120)]],
  });

  estadosEnvio: EstadoEnvio[] = [];

  // Autocomplete Cliente
  clienteQueryCtrl = new FormControl<string | Cliente>('', { nonNullable: true });
  clientes: Cliente[] = [];
  clientesLoading = signal(false);

  // Origen
  provincias: Provincia[] = [];
  locOrigenQueryCtrl = new FormControl<Localidad | string>('', { nonNullable: true });
  locOrigenList: Localidad[] = [];
  locOrigenLoading = signal(false);

  // Destino
  locDestinoQueryCtrl = new FormControl<Localidad | string>('', { nonNullable: true });
  locDestinoList: Localidad[] = [];
  locDestinoLoading = signal(false);

  displayCliente = (v?: Cliente | string) => typeof v === 'string' ? v : ((v?.nombre ?? '') + ' ' + (v?.apellido ?? '')).trim();
  displayLoc     = (v?: Localidad | string) => typeof v === 'string' ? v : (v?.nombre ?? '');

  ngOnInit(): void {

    // estados
    this.enviosSvc.listarEstados().subscribe(e => this.estadosEnvio = e ?? []);
    // provincias
    this.ubicacionSvc.listarProvincias().subscribe(p => this.provincias = p ?? []);

    // cliente autocomplete
    this.clienteQueryCtrl.valueChanges.pipe(
      startWith(this.clienteQueryCtrl.value),
      debounceTime(200), distinctUntilChanged(),
      tap(() => this.clientesLoading.set(true)),
      switchMap(v => {
        const term = typeof v === 'string' ? v.trim() : ((v?.nombre ?? '') + ' ' + (v?.apellido ?? '')).trim();
        if (term.length < 2) { this.clientesLoading.set(false); return of<Cliente[]>([]); }
        return this.clientesSvc.buscarAutocomplete(term, this.data.transportistaId);
      }),
      tap(() => this.clientesLoading.set(false)),
    ).subscribe(list => this.clientes = list ?? []);

    // localidades ORIGEN
    this.locOrigenQueryCtrl.valueChanges.pipe(
      startWith(this.locOrigenQueryCtrl.value),
      debounceTime(250), distinctUntilChanged(),
      tap(() => this.locOrigenLoading.set(true)),
      switchMap(v => {
        const term = typeof v === 'string' ? v.trim() : (v?.nombre ?? '').trim();
        if (term.length < 2) { this.locOrigenLoading.set(false); return of<Localidad[]>([]); }
        return this.ubicacionSvc.buscarLocalidades(term, this.form.value.provinciaOrigenId ?? undefined);
      }),
      tap(() => this.locOrigenLoading.set(false)),
    ).subscribe(list => this.locOrigenList = list ?? []);

    // localidades DESTINO
    this.locDestinoQueryCtrl.valueChanges.pipe(
      startWith(this.locDestinoQueryCtrl.value),
      debounceTime(250), distinctUntilChanged(),
      tap(() => this.locDestinoLoading.set(true)),
      switchMap(v => {
        const term = typeof v === 'string' ? v.trim() : (v?.nombre ?? '').trim();
        if (term.length < 2) { this.locDestinoLoading.set(false); return of<Localidad[]>([]); }
        return this.ubicacionSvc.buscarLocalidades(term, this.form.value.provinciaDestinoId ?? undefined);
      }),
      tap(() => this.locDestinoLoading.set(false)),
    ).subscribe(list => this.locDestinoList = list ?? []);

    // precarga si edito
    if (this.data?.envio?.localidadOrigenId) {
      this.ubicacionSvc.localidadPorId(this.data.envio.localidadOrigenId).subscribe(loc => {
        this.form.patchValue({ provinciaOrigenId: loc.provinciaId, localidadOrigenId: loc.id }, { emitEvent: false });
        this.locOrigenQueryCtrl.setValue(loc, { emitEvent: false });
      });
    }
    if (this.data?.envio?.localidadDestinoId) {
      this.ubicacionSvc.localidadPorId(this.data.envio.localidadDestinoId).subscribe(loc => {
        this.form.patchValue({ provinciaDestinoId: loc.provinciaId, localidadDestinoId: loc.id }, { emitEvent: false });
        this.locDestinoQueryCtrl.setValue(loc, { emitEvent: false });
      });
    }
    if (this.data?.envio?.clienteId) {
      this.clientesSvc.buscarPorId(this.data.envio.clienteId).subscribe(c => {
        this.form.patchValue({ clienteId: c.id }, { emitEvent: false });
        this.clienteQueryCtrl.setValue(c as any, { emitEvent: false });
      });
    }
  }

  onClienteSelected(c: Cliente) { this.form.controls.clienteId.setValue(c.id!); this.clienteQueryCtrl.setValue(c, { emitEvent: false }); }
  onLocOrigenSelected(l: Localidad) { this.form.controls.localidadOrigenId.setValue(l.id); this.locOrigenQueryCtrl.setValue(l, { emitEvent: false }); }
  onLocDestinoSelected(l: Localidad) { this.form.controls.localidadDestinoId.setValue(l.id); this.locDestinoQueryCtrl.setValue(l, { emitEvent: false }); }

  private hhmmToHHmmss(t?: string | null) { return !t ? '' : (t.length === 5 ? `${t}:00` : t); }

  guardar() {
    if (this.form.invalid) return;

    const payload: EnvioCreate = {
      transportistaId: this.data.transportistaId,
      clienteId: this.form.value.clienteId!,
      cantidad: this.form.value.cantidad,
      precio: this.form.value.precio,
      estadoId: this.form.value.estadoId!,
      horaEntregaDesde: this.hhmmToHHmmss(this.form.value.horaEntregaDesde),
      horaEntregaHasta: this.hhmmToHHmmss(this.form.value.horaEntregaHasta),

      localidadOrigenId: this.form.value.localidadOrigenId!,
      direccionOrigen: this.form.value.direccionOrigen!,
      localidadDestinoId: this.form.value.localidadDestinoId!,
      direccionDestino: this.form.value.direccionDestino!,
    };

    this.dialogRef.close(payload);
  }

  cancelar() { this.dialogRef.close(null); }

  get clienteQueryLength(): number {
    const v = this.clienteQueryCtrl.value;
    if (typeof v === 'string') return v.trim().length;

    // Si v es un Cliente seleccionado:
    const c = v as any;
    const txt = `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim();
    return txt.length;
  }
}
