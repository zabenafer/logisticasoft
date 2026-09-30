import { BreakpointObserver } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ViewEncapsulation,
  computed,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { DepositoRecepcionDialogComponent } from './deposito-recepcion-dialog/deposito-recepcion-dialog';

type DepositoSeccion = 'dashboard' | 'paquetes' | 'recepcionar' | 'transportistas';
type PaginacionItem = { label: string; page: number | null };
type TransportistaResumen = { nombre: string; total: number; pendientes: number };

const PAQUETES_POR_PAGINA = 10;
const TRANSPORTISTAS_POR_PAGINA_DESKTOP = 8;
const TRANSPORTISTAS_POR_PAGINA_COMPACTO = 4;
const BREAKPOINT_TRANSPORTISTAS_COMPACTO = '(max-width: 1040px)';
const BREAKPOINT_TRANSPORTISTAS_MOBILE = '(max-width: 720px)';

@Component({
  selector: 'app-deposito',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './deposito.html',
  styleUrl: './deposito.scss',
  encapsulation: ViewEncapsulation.None
})
export class DepositoComponent implements OnInit, OnDestroy {
  logoutLoading = false;

  readonly nombreDeposito = 'Depósito Palermo';

  readonly loadingEnvios = signal(false);
  readonly loadingDetalleEnvio = signal(false);
  readonly errorEnvios = signal('');

  readonly seccionActiva = signal<DepositoSeccion>('dashboard');
  readonly filtrosAbiertos = signal(false);
  readonly estadoSeleccionado = signal<EstadoDepositoFiltro>('Todos');
  readonly envios = signal<DepositoEnvio[]>([]);
  readonly paginaPaquetes = signal(1);
  readonly paginaTransportistas = signal(1);
  readonly transportistasPorPagina = signal(TRANSPORTISTAS_POR_PAGINA_DESKTOP);

  private breakpointSubscription?: Subscription;

  readonly estados: EstadoDepositoFiltro[] = [
    'Todos',
    'Pendiente de recepción en depósito',
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

  readonly totalPaquetesFiltrados = computed(() => this.enviosFiltrados().length);

  readonly totalPaginasPaquetes = computed(() =>
    this.calcularTotalPaginas(this.totalPaquetesFiltrados(), PAQUETES_POR_PAGINA)
  );

  readonly paginaPaquetesActual = computed(() =>
    this.normalizarPagina(this.paginaPaquetes(), this.totalPaginasPaquetes())
  );

  readonly enviosPaginados = computed(() => {
    const inicio = (this.paginaPaquetesActual() - 1) * PAQUETES_POR_PAGINA;

    return this.enviosFiltrados().slice(inicio, inicio + PAQUETES_POR_PAGINA);
  });

  readonly rangoPaquetes = computed(() => {
    const total = this.totalPaquetesFiltrados();

    if (total === 0) {
      return { desde: 0, hasta: 0, total };
    }

    const desde = (this.paginaPaquetesActual() - 1) * PAQUETES_POR_PAGINA + 1;
    const hasta = Math.min(desde + PAQUETES_POR_PAGINA - 1, total);

    return { desde, hasta, total };
  });

  readonly textoPaginacionPaquetes = computed(() => {
    const { desde, hasta, total } = this.rangoPaquetes();
    const texto = total === 1 ? 'paquete' : 'paquetes';

    return `Mostrando ${desde}-${hasta} de ${total} ${texto}`;
  });

  readonly paginasPaquetes = computed(() =>
    this.crearItemsPaginacion(this.paginaPaquetesActual(), this.totalPaginasPaquetes())
  );

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

  readonly transportistas = computed<TransportistaResumen[]>(() => {
    const resumen = new Map<string, TransportistaResumen>();

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

  readonly totalPaginasTransportistas = computed(() =>
    this.calcularTotalPaginas(this.transportistas().length, this.transportistasPorPagina())
  );

  readonly paginaTransportistasActual = computed(() =>
    this.normalizarPagina(this.paginaTransportistas(), this.totalPaginasTransportistas())
  );

  readonly transportistasPaginados = computed(() => {
    const inicio = (this.paginaTransportistasActual() - 1) * this.transportistasPorPagina();

    return this.transportistas().slice(inicio, inicio + this.transportistasPorPagina());
  });

  constructor(
    private readonly router: Router,
    private readonly clerkAuth: ClerkAuthService,
    private readonly session: AuthSessionService,
    private readonly depositoEnvioService: DepositoEnvioService,
    private readonly dialog: MatDialog,
    private readonly breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    this.observarBreakpointsTransportistas();
    this.cargarEnvios();
  }

  ngOnDestroy(): void {
    this.breakpointSubscription?.unsubscribe();
  }

  irASeccion(seccion: DepositoSeccion): void {
    this.seccionActiva.set(seccion);
    this.scrollASeccion(seccion);
  }

  cargarEnvios(): void {
    this.loadingEnvios.set(true);
    this.errorEnvios.set('');

    this.depositoEnvioService.listarEnvios().subscribe({
      next: envios => {
        this.envios.set(envios);
        this.ajustarPaginaPaquetesAlRango();
        this.ajustarPaginaTransportistasAlRango();
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
    this.paginaPaquetes.set(1);
  }

  limpiarFiltros(): void {
    this.estadoSeleccionado.set('Todos');
    this.paginaPaquetes.set(1);
  }

  irAPaginaPaquetes(pagina: number | null): void {
    if (pagina === null) {
      return;
    }

    const paginaNormalizada = this.normalizarPagina(pagina, this.totalPaginasPaquetes());

    if (paginaNormalizada === this.paginaPaquetesActual()) {
      return;
    }

    this.paginaPaquetes.set(paginaNormalizada);
    this.scrollASeccion('paquetes');
  }

  paginaPaquetesAnterior(): void {
    this.irAPaginaPaquetes(this.paginaPaquetesActual() - 1);
  }

  paginaPaquetesSiguiente(): void {
    this.irAPaginaPaquetes(this.paginaPaquetesActual() + 1);
  }

  paginaTransportistasAnterior(): void {
    this.irAPaginaTransportistas(this.paginaTransportistasActual() - 1);
  }

  paginaTransportistasSiguiente(): void {
    this.irAPaginaTransportistas(this.paginaTransportistasActual() + 1);
  }

  irAPaginaTransportistas(pagina: number): void {
    const paginaNormalizada = this.normalizarPagina(pagina, this.totalPaginasTransportistas());

    if (paginaNormalizada === this.paginaTransportistasActual()) {
      return;
    }

    this.paginaTransportistas.set(paginaNormalizada);
  }

  abrirRecepcion(): void {
    const dialogRef = this.dialog.open(DepositoRecepcionDialogComponent, {
      data: { nombreDeposito: this.nombreDeposito },
      width: '760px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100dvh - 32px)',
      panelClass: 'deposito-recepcion-dialog-panel',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(envioActualizado => {
      if (!envioActualizado) {
        return;
      }

      this.envios.update(envios =>
        envios.map(envio => (envio.id === envioActualizado.id ? envioActualizado : envio))
      );
      this.ajustarPaginaPaquetesAlRango();
      this.ajustarPaginaTransportistasAlRango();
    });
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
      case 'Pendiente de recepción en depósito':
        return 'status-awaiting-reception';
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

  trackByTransportista(_: number, transportista: TransportistaResumen): string {
    return transportista.nombre;
  }

  trackByPaginacionItem(_: number, item: PaginacionItem): string {
    return `${item.label}-${item.page ?? 'ellipsis'}`;
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

  private scrollASeccion(seccion: DepositoSeccion): void {
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

  private observarBreakpointsTransportistas(): void {
    this.breakpointSubscription = this.breakpointObserver
      .observe([BREAKPOINT_TRANSPORTISTAS_COMPACTO, BREAKPOINT_TRANSPORTISTAS_MOBILE])
      .subscribe(resultado => {
        const paginaAnterior = this.transportistasPorPagina();
        const paginaNueva = resultado.breakpoints[BREAKPOINT_TRANSPORTISTAS_COMPACTO]
          ? TRANSPORTISTAS_POR_PAGINA_COMPACTO
          : TRANSPORTISTAS_POR_PAGINA_DESKTOP;

        if (paginaAnterior === paginaNueva) {
          return;
        }

        this.transportistasPorPagina.set(paginaNueva);
        this.ajustarPaginaTransportistasAlRango();
      });
  }

  private ajustarPaginaPaquetesAlRango(): void {
    const paginaNormalizada = this.normalizarPagina(
      this.paginaPaquetes(),
      this.totalPaginasPaquetes()
    );

    if (paginaNormalizada !== this.paginaPaquetes()) {
      this.paginaPaquetes.set(paginaNormalizada);
    }
  }

  private ajustarPaginaTransportistasAlRango(): void {
    const paginaNormalizada = this.normalizarPagina(
      this.paginaTransportistas(),
      this.totalPaginasTransportistas()
    );

    if (paginaNormalizada !== this.paginaTransportistas()) {
      this.paginaTransportistas.set(paginaNormalizada);
    }
  }

  private calcularTotalPaginas(totalItems: number, itemsPorPagina: number): number {
    return Math.max(1, Math.ceil(totalItems / itemsPorPagina));
  }

  private normalizarPagina(pagina: number, totalPaginas: number): number {
    return Math.min(Math.max(1, pagina), totalPaginas);
  }

  private crearItemsPaginacion(paginaActual: number, totalPaginas: number): PaginacionItem[] {
    if (totalPaginas <= 6) {
      return this.crearRangoPaginas(1, totalPaginas);
    }

    if (paginaActual <= 4) {
      return [...this.crearRangoPaginas(1, 4), this.crearEllipsis(), this.crearPagina(totalPaginas)];
    }

    if (paginaActual >= totalPaginas - 3) {
      return [
        this.crearPagina(1),
        this.crearEllipsis(),
        ...this.crearRangoPaginas(totalPaginas - 3, totalPaginas)
      ];
    }

    return [
      this.crearPagina(1),
      this.crearEllipsis(),
      ...this.crearRangoPaginas(paginaActual - 1, paginaActual + 1),
      this.crearEllipsis(),
      this.crearPagina(totalPaginas)
    ];
  }

  private crearRangoPaginas(inicio: number, fin: number): PaginacionItem[] {
    return Array.from({ length: fin - inicio + 1 }, (_, index) => this.crearPagina(inicio + index));
  }

  private crearPagina(page: number): PaginacionItem {
    return {
      label: String(page),
      page
    };
  }

  private crearEllipsis(): PaginacionItem {
    return {
      label: '...',
      page: null
    };
  }
}
