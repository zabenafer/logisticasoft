import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ViewEncapsulation,
  computed,
  Inject,
  OnInit,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../auth/auth-session.service';
import { ClerkAuthService } from '../../auth/clerk-auth.service';
import { SharedImports } from '../../material.module';
import {
  DepositoEnvio,
  DepositoEnvioService,
  EstadoDepositoEnvio,
  EstadoDepositoFiltro
} from '../../services/deposito-envio.service';
import { DepositoEnvioDetalleDialogComponent } from './deposito-envio-detalle-dialog/deposito-envio-detalle-dialog';

type DepositoSeccion = 'dashboard' | 'paquetes' | 'recepcionar' | 'transportistas';

@Component({
  selector: 'app-deposito',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './deposito.html',
  styleUrl: './deposito.scss',
  encapsulation: ViewEncapsulation.None
})
export class DepositoComponent implements OnInit {
  logoutLoading = false;

  readonly nombreDeposito = 'Depósito Palermo';

  readonly loadingEnvios = signal(false);
  readonly loadingDetalleEnvio = signal(false);
  readonly errorEnvios = signal('');

  readonly seccionActiva = signal<DepositoSeccion>('dashboard');
  readonly filtrosAbiertos = signal(false);
  readonly estadoSeleccionado = signal<EstadoDepositoFiltro>('Todos');
  readonly envios = signal<DepositoEnvio[]>([]);

  readonly estados: EstadoDepositoFiltro[] = [
    'Todos',
    'Recibido en depósito',
    'Pendiente de retiro',
    'Retirado por transportista',
    'En tránsito',
    'Recibido en depósito destino',
    'Listo para retirar',
    'Entregado',
    'Cancelado'
  ];

  private readonly estadosEnDeposito: EstadoDepositoEnvio[] = [
    'Recibido en depósito',
    'Recibido en depósito destino',
    'Listo para retirar'
  ];

  readonly resumen = computed(() => {
    const envios = this.envios();

    return {
      enDeposito: envios.filter(envio => this.estadosEnDeposito.includes(envio.estado)).length,
      pendientesRetiro: envios.filter(envio => envio.estado === 'Pendiente de retiro').length,
      retiradosTransportista: envios.filter(envio => envio.estado === 'Retirado por transportista').length,
      recibidosHoy: envios.filter(envio => envio.recibidoHoy).length
    };
  });

  readonly filtrosActivos = computed(() => this.estadoSeleccionado() !== 'Todos');

  readonly enviosFiltrados = computed(() => {
    const estado = this.estadoSeleccionado();

    return this.envios().filter(envio => estado === 'Todos' || envio.estado === estado);
  });

  readonly textoCantidadPaquetes = computed(() => {
    if (this.loadingEnvios()) {
      return 'Cargando...';
    }

    if (this.errorEnvios()) {
      return 'Sin datos';
    }

    const cantidad = this.enviosFiltrados().length;
    const texto = cantidad === 1 ? 'paquete' : 'paquetes';

    if (this.filtrosActivos()) {
      return `${cantidad} ${texto} encontrados`;
    }

    return `${cantidad} ${texto}`;
  });

  readonly transportistas = computed(() => {
    const resumen = new Map<string, { nombre: string; total: number; pendientes: number }>();

    this.envios()
      .filter(envio => envio.transportista !== 'Sin asignar')
      .forEach(envio => {
        const item = resumen.get(envio.transportista) ?? {
          nombre: envio.transportista,
          total: 0,
          pendientes: 0
        };

        item.total += 1;

        if (envio.estado === 'Pendiente de retiro') {
          item.pendientes += 1;
        }

        resumen.set(envio.transportista, item);
      });

    return Array.from(resumen.values());
  });

  constructor(
    private readonly router: Router,
    private readonly clerkAuth: ClerkAuthService,
    private readonly session: AuthSessionService,
    private readonly depositoEnvioService: DepositoEnvioService,
    private readonly dialog: MatDialog,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarEnvios();
  }

  irASeccion(seccion: DepositoSeccion): void {
    this.seccionActiva.set(seccion);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      document.getElementById(seccion)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  cargarEnvios(): void {
    this.loadingEnvios.set(true);
    this.errorEnvios.set('');

    this.depositoEnvioService.listarEnvios().subscribe({
      next: envios => {
        this.envios.set(envios);
        this.loadingEnvios.set(false);
      },
      error: error => {
        console.error('Error cargando envíos del depósito', error);
        this.envios.set([]);
        this.errorEnvios.set('No pudimos cargar los paquetes del depósito. Volvé a intentarlo.');
        this.loadingEnvios.set(false);
      }
    });
  }

  toggleFiltros(): void {
    this.filtrosAbiertos.update(valor => !valor);
  }

  onEstadoChange(estado: EstadoDepositoFiltro): void {
    this.estadoSeleccionado.set(estado);
  }

  limpiarFiltros(): void {
    this.estadoSeleccionado.set('Todos');
  }

  verDetalle(envio: DepositoEnvio): void {
    if (this.loadingDetalleEnvio()) {
      return;
    }

    this.loadingDetalleEnvio.set(true);

    this.depositoEnvioService.obtenerDetallePorId(envio.id).subscribe({
      next: envioDetalle => {
        this.loadingDetalleEnvio.set(false);
        this.abrirDetalle(envioDetalle);
      },
      error: error => {
        console.error('Error cargando detalle del paquete', error);
        this.loadingDetalleEnvio.set(false);
        this.errorEnvios.set('No pudimos cargar el detalle del paquete.');
      }
    });
  }

  estadoClass(estado: EstadoDepositoEnvio): string {
    switch (estado) {
      case 'Recibido en depósito':
        return 'status-received';
      case 'Pendiente de retiro':
        return 'status-pending';
      case 'Retirado por transportista':
        return 'status-picked-up';
      case 'En tránsito':
        return 'status-transit';
      case 'Recibido en depósito destino':
        return 'status-destination';
      case 'Listo para retirar':
        return 'status-ready';
      case 'Entregado':
        return 'status-delivered';
      case 'Cancelado':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  trackByEnvioId(_: number, envio: DepositoEnvio): number {
    return envio.id;
  }

  trackByTransportista(_: number, transportista: { nombre: string }): string {
    return transportista.nombre;
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

  private abrirDetalle(envio: DepositoEnvio): void {
    this.dialog.open(DepositoEnvioDetalleDialogComponent, {
      data: envio,
      width: '900px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100dvh - 32px)',
      panelClass: 'deposito-envio-dialog-panel',
      autoFocus: false,
      restoreFocus: false
    });
  }
}
