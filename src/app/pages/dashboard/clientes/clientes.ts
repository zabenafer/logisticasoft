import { inject, Component, OnInit, AfterViewInit, ViewChild, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { SharedImports } from '../../../material.module';
import { Cliente } from '../../../models/cliente.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ClientesService } from '../../../services/cliente.service';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClienteDialogComponent } from './cliente-dialog/cliente-dialog';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    SharedImports        // acá debería estar FormsModule por tu [(ngModel)]
  ],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.scss']
})
export class ClientesComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private clientesSvc = inject(ClientesService);
  
  displayedColumns: string[] = [
    'nombre',
    'apellido',
    'direccion',
    'localidad',
    'provincia',
    'telefono',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Cliente>([]);
  filtro = '';
  isMobile = false;
  isLoading = true;
  errorMsg = '';

  pageIndex = 0;
  onPage(e: PageEvent) { this.pageIndex = e.pageIndex; }
  get totalPages() {
    const size = 25; // igual a tu pageSize
    const len = this.dataSource.data.length || 0;
    return Math.max(1, Math.ceil(len / size));
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // ✅ Solo en browser toco window
    if (this.isBrowser) this.isMobile = window.innerWidth < 768;
        // 🔹 Configuro cómo filtra la tabla
    this.dataSource.filterPredicate = (data: Cliente, filter: string) =>
      (`${data.nombre ?? ''} ${data.apellido ?? ''} ${data.localidad ?? ''}`)
        .toLowerCase()
        .includes(filter);  

    this.cargarClientes();
  }

  private cargarClientes() {
    this.isLoading = true;
    this.errorMsg = '';

    this.clientesSvc.listar()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (clientes) => {
          this.dataSource.data = clientes ?? [];
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
        },
        error: () => this.snack.open('No se pudieron cargar los clientes', 'Cerrar', { duration: 3000 })
      });
  }

  verHistorial(c: Cliente) { console.log('Historial', c); }
  @ViewChild('confirmTpl') confirmTpl!: any;
  eliminarCliente(c: Cliente) {
    const ref = this.dialog.open(this.confirmTpl, {
      width: '420px',
      data: c,
      autoFocus: false
    });

    ref.afterClosed().subscribe(confirm => {
      if (!confirm) return;
      this.isLoading = true;
      this.clientesSvc.eliminar(c.id!)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.snack.open('Cliente eliminado', 'OK', { duration: 2000 });
            this.cargarClientes();
          },
          error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
        });
    });
  }

  agregarCliente(): void {
    const ref = this.dialog.open(ClienteDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: true,           // foco al primer input con cdkFocusInitial
      restoreFocus: true,
      panelClass: 'dlg-cliente', // 👈 clase para estilos globales del contenedor
      data: { },
    });

    ref.afterClosed().subscribe(payload => {
      if (!payload) return;

      this.isLoading = true;
      this.clientesSvc.crear(payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.snack.open('Cliente creado', 'OK', { duration: 2000 });
            this.cargarClientes(); // recarga por transportista
          },
          error: () => this.snack.open('Error al crear el cliente', 'Cerrar', { duration: 3000 }),
        });
    });
  }

  editarCliente(c: Cliente) {
    const ref = this.dialog.open(ClienteDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: true,           // foco al primer input con cdkFocusInitial
      restoreFocus: true,
      panelClass: 'dlg-cliente', // 👈 clase para estilos globales del contenedor
      data: { cliente: c ?? null },
    });

    ref.afterClosed().subscribe(payload => {
      if (!payload) return;

      this.isLoading = true;
      this.clientesSvc.actualizar(c.id!, payload)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.snack.open('Cliente actualizado', 'OK', { duration: 2000 });
            this.cargarClientes();
          },
          error: () => this.snack.open('Error al actualizar el cliente', 'Cerrar', { duration: 3000 }),
        });  
    });
  }

  getInicial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  trackById(index: number, item: Cliente) { return item.id ?? index; }

  getAvatarColor(nombre: string): string {
    const colors = ['#4da6ff', '#6c63ff', '#00bcd4', '#ff8a65', '#81c784', '#ba68c8'];
    const index = nombre ? nombre.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  aplicarFiltro() {
    this.dataSource.filter = this.filtro.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // ordenamiento amigable
    this.dataSource.sortingDataAccessor = (item: Cliente, property: string) => {
      switch (property) {
        case 'localidad': return (item.localidad ?? '').toLowerCase();
        case 'provincia': return (item.provincia ?? '').toLowerCase();
        case 'nombre':    return (item.nombre ?? '').toLowerCase();
        case 'apellido':  return (item.apellido ?? '').toLowerCase();
        default:          return ((item as any)[property] ?? '').toString().toLowerCase();
      }
    };
  }

    // 👇 Este listener solo corre en browser
  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser) return;
    this.isMobile = window.innerWidth < 768;
  }
}
