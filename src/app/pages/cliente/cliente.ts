import { Component, computed, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import {
  ClienteEnvio,
  ClienteEnvioService,
  EstadoEnvio,
  EstadoFiltro
} from '../../services/cliente-envio.service';
import { ClienteEnvioDetalleDialogComponent } from './cliente-envio-detalle-dialog/cliente-envio-detalle-dialog';
import { Router } from '@angular/router';
import { SharedImports } from '../../material.module';
import { ClerkAuthService } from '../../auth/clerk-auth.service';
import { AuthSessionService } from '../../auth/auth-session.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './cliente.html',
  styleUrl: './cliente.scss'
})
export class ClienteComponent implements OnInit {
  logoutLoading = false;

  readonly nombreCliente = 'Fernando';

  readonly loadingEnvios = signal(false);
  readonly errorEnvios = signal('');

  readonly estados: EstadoFiltro[] = [
    'Todos',
    'Pendiente',
    'En camino',
    'Entregado',
    'Cancelado'
  ];

  readonly seccionActiva = signal<'mis-envios' | 'buscar-envio'>('mis-envios');

  readonly numeroSeguimientoBusqueda = signal('');
  readonly mensajeBusquedaEnvio = signal('');

  readonly filtrosAbiertos = signal(false);
  readonly estadoSeleccionado = signal<EstadoFiltro>('Todos');

  readonly envios = signal<ClienteEnvio[]>([]);
  readonly loadingDetalleEnvio = signal(false);
  
  readonly resumen = computed(() => {
    const envios = this.envios();

    return {
      total: envios.length,
      pendientes: envios.filter(envio => envio.estado === 'Pendiente').length,
      enCamino: envios.filter(envio => envio.estado === 'En camino').length,
      entregados: envios.filter(envio => envio.estado === 'Entregado').length
    };
  });

  readonly filtrosActivos = computed(() => {
    return this.estadoSeleccionado() !== 'Todos';
  });

  readonly enviosFiltrados = computed(() => {
    const estado = this.estadoSeleccionado();

    return this.envios().filter(envio => {
      return estado === 'Todos' || envio.estado === estado;
    });
  });

  readonly textoCantidadEnvios = computed(() => {
    if (this.loadingEnvios()) {
      return 'Cargando...';
    }

    if (this.errorEnvios()) {
      return 'Sin datos';
    }

    const cantidad = this.enviosFiltrados().length;
    const texto = cantidad === 1 ? 'envío' : 'envíos';

    if (this.filtrosActivos()) {
      return `${cantidad} ${texto} encontrados`;
    }

    return `${cantidad} ${texto}`;
  });

  constructor(
    private readonly router: Router,
    private readonly clerkAuth: ClerkAuthService,
    private readonly session: AuthSessionService,
    private readonly clienteEnvioService: ClienteEnvioService,
    private readonly dialog: MatDialog,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarEnvios();
  }

  irASeccion(seccion: 'mis-envios' | 'buscar-envio'): void {
    this.seccionActiva.set(seccion);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      const element = document.getElementById(seccion);

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  cargarEnvios(): void {
    this.loadingEnvios.set(true);
    this.errorEnvios.set('');
    this.mensajeBusquedaEnvio.set('');

    this.clienteEnvioService.listarMisEnvios().subscribe({
      next: envios => {
        this.envios.set(envios);
        this.loadingEnvios.set(false);
      },
      error: error => {
        console.error('Error cargando envíos del cliente', error);
        this.envios.set([]);
        this.errorEnvios.set('No pudimos cargar tus envíos. Volvé a intentarlo.');
        this.loadingEnvios.set(false);
      }
    });
  }

  onNumeroSeguimientoBusquedaChange(valor: string): void {
    this.numeroSeguimientoBusqueda.set(valor);
    this.mensajeBusquedaEnvio.set('');
  }

  buscarEnvioPorNumero(): void {
    const numeroBuscado = this.numeroSeguimientoBusqueda().trim();

    if (!numeroBuscado) {
      this.mensajeBusquedaEnvio.set('Ingresá un número de seguimiento.');
      return;
    }

    if (this.loadingDetalleEnvio()) {
      return;
    }

    this.loadingDetalleEnvio.set(true);
    this.mensajeBusquedaEnvio.set('');

    this.clienteEnvioService.obtenerDetallePorNumero(numeroBuscado).subscribe({
      next: envioDetalle => {
        this.loadingDetalleEnvio.set(false);
        this.abrirDetalle(envioDetalle);
      },
      error: error => {
        console.error('Error buscando envío por número', error);
        this.loadingDetalleEnvio.set(false);
        this.mensajeBusquedaEnvio.set(
          'No encontramos un envío asociado a tu cuenta con ese número.'
        );
      }
    });
  }

  toggleFiltros(): void {
    this.filtrosAbiertos.update(valor => !valor);
  }

  onEstadoChange(estado: EstadoFiltro): void {
    this.estadoSeleccionado.set(estado);
  }

  limpiarFiltros(): void {
    this.estadoSeleccionado.set('Todos');
  }

  verDetalle(envio: ClienteEnvio): void {
    if (this.loadingDetalleEnvio()) {
      return;
    }

    this.loadingDetalleEnvio.set(true);

    this.clienteEnvioService.obtenerDetallePorId(envio.id).subscribe({
      next: envioDetalle => {
        this.loadingDetalleEnvio.set(false);
        this.abrirDetalle(envioDetalle);
      },
      error: error => {
        console.error('Error cargando detalle del envío', error);
        this.loadingDetalleEnvio.set(false);
        this.mensajeBusquedaEnvio.set('No pudimos cargar el detalle del envío.');
      }
    });
  }

  private abrirDetalle(envio: ClienteEnvio): void {
    this.dialog.open(ClienteEnvioDetalleDialogComponent, {
      data: envio,
      width: '860px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100dvh - 32px)',
      panelClass: 'cliente-envio-dialog-panel',
      autoFocus: false,
      restoreFocus: false
    });
  }

  estadoClass(estado: EstadoEnvio): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-pending';
      case 'En camino':
        return 'status-progress';
      case 'Entregado':
        return 'status-delivered';
      case 'Cancelado':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  trackByEnvioId(_: number, envio: ClienteEnvio): number {
    return envio.id;
  }

  private normalizar(valor: string): string {
    return valor
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  async onLogout(ev: Event): Promise<void> {
    ev.preventDefault();

    if (this.logoutLoading) {
      return;
    }

    this.logoutLoading = true;

    try {
      await this.clerkAuth.signOut();
      this.session.clear();
      sessionStorage.removeItem('ls_portal_intent');
      await this.router.navigate(['/home']);
    } finally {
      this.logoutLoading = false;
    }
  }
}