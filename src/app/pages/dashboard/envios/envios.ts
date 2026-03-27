import { Component, Inject, PLATFORM_ID, OnInit, AfterViewInit, ViewChild, HostListener, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedImports } from '../../../material.module';
import { environment } from '../../../../environment';
import { finalize } from 'rxjs';
import { EnvioDTO } from '../../../models/envio.model';
import { EnviosService, EstadoEnvio } from '../../../services/envio.service';
import { EnvioDialogComponent } from './envio-dialog/envio-dialog';

@Component({
  selector: 'app-envios',
  standalone: true,
  templateUrl: './envios.html',
  styleUrls: ['./envios.scss'],
  imports: [CommonModule, SharedImports, MatPaginatorModule, MatSortModule],
})
export class EnviosComponent implements OnInit, AfterViewInit {
  @ViewChild('confirmTpl') confirmTpl!: any;
  private enviosSvc = inject(EnviosService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  displayedColumns = ['nroSeguimiento', 'cliente', 'origen', 'destino', 'estado', 'creado', 'acciones'];
  dataSource = new MatTableDataSource<EnvioDTO>([]);
  isLoading = true;
  filtro = '';  
  estados: EstadoEnvio[] = [];
  idEstadoEliminado?: number;
  loadingMsg = 'Cargando envíos…';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private isBrowser = false;
  constructor(@Inject(PLATFORM_ID) platformId: Object) { this.isBrowser = isPlatformBrowser(platformId); }

  private beginLoading(msg: string) {
    this.loadingMsg = msg;
    this.isLoading = true;
  }
  private endLoading() {
    this.isLoading = false;
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (d, f) => {
      const blob = [
        d.nroSeguimiento,
        d.clienteNombre,
        d.localidadOrigen, d.provinciaOrigen, d.direccionOrigen,
        d.localidadDestino, d.provinciaDestino, d.direccionDestino,
        d.estadoActual
      ].map(v => (v ?? '').toLowerCase()).join(' ');
      return blob.includes(f);
    };
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (row, prop) => {
      switch (prop) {
        case 'cliente': return (row.clienteNombre ?? '').toLowerCase();
        case 'origen':  return ((row.provinciaOrigen ?? '') + (row.localidadOrigen ?? '') + (row.direccionOrigen ?? '')).toLowerCase();
        case 'destino': return ((row.provinciaDestino ?? '') + (row.localidadDestino ?? '') + (row.direccionDestino ?? '')).toLowerCase();
        case 'estado':  return (row.estadoActual ?? '').toLowerCase();
        case 'creado':  return (row.fechaCreacion ?? '');
        default:        return (row as any)[prop] ?? '';
      }
    };
  }
  
  trackById = (_: number, e: EnvioDTO) => e.id ?? e.nroSeguimiento;

  cargar() {
    this.beginLoading('Cargando envíos…');
    this.isLoading = true;
    this.enviosSvc.listarPorTransportista()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: data => this.dataSource.data = data ?? [],
        error: err => {
          if (err?.status === 401) return; // por si en algún caso llega 401
          this.snack.open('Error al crear', 'Cerrar', { duration: 3000 })
        }
      });
  }

  aplicarFiltro() {
    this.dataSource.filter = this.filtro.trim().toLowerCase();
    this.paginator?.firstPage();
  }

  crear() {
    const ref = this.dialog.open(EnvioDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: true,
      restoreFocus: true,
      data: { }
    });
    ref.afterClosed().subscribe(payload => {
      if (!payload) return;
      this.beginLoading('Creando envío…');
      this.isLoading = true;
      this.enviosSvc.crear(payload)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => { this.snack.open('Envío creado', 'OK', { duration: 2000 }); this.cargar(); },
          error: () => this.snack.open('Error al crear', 'Cerrar', { duration: 3000 })
        });
    });
  }

  editar(row: EnvioDTO) {
    const ref = this.dialog.open(EnvioDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: true,
      data: { envio: row ?? null }
    });
    ref.afterClosed().subscribe(payload => {
      if (!payload) return;
      this.beginLoading('Modificando envío…');
      this.isLoading = true;
      this.enviosSvc.actualizar(row.id!, payload)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => { this.snack.open('Envío actualizado', 'OK', { duration: 2000 }); this.cargar(); },
          error: () => this.snack.open('Error al actualizar', 'Cerrar', { duration: 3000 })
        });
    });
  }

  eliminar(e: EnvioDTO) { 
    const ref = this.dialog.open(this.confirmTpl, {
      width: '420px',
      data: e,
      autoFocus: false
    });

    this.enviosSvc.listarEstados().subscribe(list => {
      this.estados = list ?? [];
      this.idEstadoEliminado = this.estados.find(e =>
        (e.nombre ?? '').trim().toLowerCase() === 'eliminado'
      )?.id;
    });

    ref.afterClosed().subscribe(confirm => {
      if (!confirm) return;     
            
      if (!this.idEstadoEliminado) {
        this.snack.open('No se encontró el estado "Eliminado"', 'Cerrar', { duration: 3000 });
        return;
      }
      this.beginLoading('Eliminando envío…');
      this.isLoading = true;
      this.enviosSvc.cambiarEstado(e.id!, this.idEstadoEliminado)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.snack.open('Envio eliminado', 'OK', { duration: 2000 });
            this.cargar();
          },
          error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
        });
    });
   }
}
