import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SharedImports } from '../../material.module';
import { ClerkAuthService } from '../../auth/clerk-auth.service';
import { AuthSessionService } from '../../auth/auth-session.service';

type EstadoEnvio = 'Pendiente' | 'En camino' | 'Entregado' | 'Cancelado';
type EstadoFiltro = 'Todos' | EstadoEnvio;

interface ClienteEnvio {
  id: number;
  numeroSeguimiento: string;
  estado: EstadoEnvio;
  origen: string;
  destino: string;
  direccionOrigen: string;
  direccionDestino: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  horaEntregaDesde: string;
  horaEntregaHasta: string;
}

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './cliente.html',
  styleUrl: './cliente.scss'
})
export class ClienteComponent {
  logoutLoading = false;

  readonly nombreCliente = 'Fernando';

  readonly estados: EstadoFiltro[] = [
    'Todos',
    'Pendiente',
    'En camino',
    'Entregado',
    'Cancelado'
  ];

  readonly numeroSeguimientoBusqueda = signal('');
  readonly mensajeBusquedaEnvio = signal('');

  readonly filtrosAbiertos = signal(false);
  readonly estadoSeleccionado = signal<EstadoFiltro>('Todos');

  readonly envios = signal<ClienteEnvio[]>([
    {
      id: 1,
      numeroSeguimiento: 'MNZ00000021',
      estado: 'En camino',
      origen: 'Villa María, Córdoba',
      destino: 'Córdoba Capital, Córdoba',
      direccionOrigen: 'Av. Alem 123',
      direccionDestino: 'Bv. San Juan 850',
      fechaCreacion: '09/06/2026',
      ultimaActualizacion: '09/06/2026 14:30',
      horaEntregaDesde: '10:00',
      horaEntregaHasta: '14:00'
    },
    {
      id: 2,
      numeroSeguimiento: 'MNZ00000018',
      estado: 'Entregado',
      origen: 'Villa Nueva, Córdoba',
      destino: 'Rosario, Santa Fe',
      direccionOrigen: 'San Martín 455',
      direccionDestino: 'Mitre 1200',
      fechaCreacion: '08/06/2026',
      ultimaActualizacion: '08/06/2026 18:20',
      horaEntregaDesde: '15:00',
      horaEntregaHasta: '19:00'
    },
    {
      id: 3,
      numeroSeguimiento: 'MNZ00000016',
      estado: 'Pendiente',
      origen: 'Villa María, Córdoba',
      destino: 'Río Cuarto, Córdoba',
      direccionOrigen: 'Entre Ríos 320',
      direccionDestino: 'Belgrano 750',
      fechaCreacion: '07/06/2026',
      ultimaActualizacion: '07/06/2026 11:10',
      horaEntregaDesde: '09:00',
      horaEntregaHasta: '13:00'
    }
  ]);

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
    const cantidad = this.enviosFiltrados().length;
    const texto = cantidad === 1 ? 'envío' : 'envíos';

    if (this.filtrosActivos()) {
      return `${cantidad} ${texto} encontrados`;
    }

    return `${cantidad} ${texto}`;
  });

  constructor(
    private readonly router: Router,
    private clerkAuth: ClerkAuthService,
    private session: AuthSessionService
  ) {}

  onNumeroSeguimientoBusquedaChange(valor: string): void {
    this.numeroSeguimientoBusqueda.set(valor);
    this.mensajeBusquedaEnvio.set('');
  }

  buscarEnvioPorNumero(): void {
    const numeroBuscado = this.normalizar(this.numeroSeguimientoBusqueda());

    if (!numeroBuscado) {
      this.mensajeBusquedaEnvio.set('Ingresá un número de seguimiento.');
      return;
    }

    const envioEncontrado = this.envios().find(envio =>
      this.normalizar(envio.numeroSeguimiento) === numeroBuscado
    );

    if (!envioEncontrado) {
      this.mensajeBusquedaEnvio.set(
        'No encontramos un envío asociado a tu cuenta con ese número.'
      );
      return;
    }

    this.verDetalle(envioEncontrado);
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
    this.router.navigate(['/cliente/envios', envio.id]);
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