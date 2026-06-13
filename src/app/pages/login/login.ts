import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedImports } from '../../material.module';
import { ClerkAuthService } from '../../auth/clerk-auth.service';
import { PortalType } from '../../auth/auth.models';

interface PortalConfig {
  tipo: PortalType;
  titulo: string;
  subtitulo: string;
  icono: string;
  colorPrincipal: string;
  colorSuave: string;
  colorBorde: string;
  colorTexto: string;
  colorLink: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedImports, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('clerkSignIn') clerkSignIn?: ElementRef<HTMLDivElement>;

  loadingClerk = true;
  errorMsg = '';
  portal: PortalType = 'transportista';
  private mountTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly portalConfigs: Record<PortalType, PortalConfig> = {
    cliente: {
      tipo: 'cliente',
      titulo: 'Acceso de Cliente',
      subtitulo: 'Ingresa para ver tus envios',
      icono: 'person',
      colorPrincipal: '#2563eb',
      colorSuave: '#eff6ff',
      colorBorde: '#bfdbfe',
      colorTexto: '#1d4ed8',
      colorLink: '#2563eb'
    },
    transportista: {
      tipo: 'transportista',
      titulo: 'Acceso de Transportista',
      subtitulo: 'Ingresa para gestionar tus entregas',
      icono: 'local_shipping',
      colorPrincipal: '#16a34a',
      colorSuave: '#f0fdf4',
      colorBorde: '#bbf7d0',
      colorTexto: '#15803d',
      colorLink: '#16a34a'
    },
    deposito: {
      tipo: 'deposito',
      titulo: 'Acceso de Deposito',
      subtitulo: 'Ingresa para administrar el deposito',
      icono: 'warehouse',
      colorPrincipal: '#7c3aed',
      colorSuave: '#f5f3ff',
      colorBorde: '#ddd6fe',
      colorTexto: '#6d28d9',
      colorLink: '#7c3aed'
    }
  };

  portalActual: PortalConfig = this.portalConfigs.transportista;

  private viewReady = false;
  private mountedElement: HTMLDivElement | null = null;
  private destroyRef = inject(DestroyRef);
  private readonly isBrowser: boolean;

  constructor(
    private clerkAuth: ClerkAuthService,
    private route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const portalParam = params.get('portal');
        const reason = params.get('reason');

        if (
          portalParam === 'cliente' ||
          portalParam === 'transportista' ||
          portalParam === 'deposito'
        ) {
          this.portal = portalParam;
        } else {
          this.portal = 'transportista';
        }

        this.portalActual = this.portalConfigs[this.portal];
        this.errorMsg = this.getReasonMessage(reason);
        if (this.viewReady) {
          this.scheduleMountClerkSignIn();
        }
      });
  }

  private setLoadingClerk(value: boolean): void {
    this.loadingClerk = value;
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.scheduleMountClerkSignIn();
  }

  ngOnDestroy(): void {
    if (this.mountTimeoutId) {
      clearTimeout(this.mountTimeoutId);
    }

    if (this.mountedElement) {
      void this.clerkAuth.unmountSignIn(this.mountedElement);
    }
  }

  private async mountClerkSignIn(): Promise<void> {
    if (!this.isBrowser || !this.clerkSignIn?.nativeElement) {
      this.setLoadingClerk(false);
      return;
    }

    this.setLoadingClerk(true);
    this.errorMsg = this.errorMsg || '';

    try {
      if (this.mountedElement) {
        await this.clerkAuth.unmountSignIn(this.mountedElement);
      }

      this.mountedElement = this.clerkSignIn.nativeElement;
      await this.clerkAuth.mountSignIn(this.mountedElement, this.portal);
    } catch (err) {
      console.error('[Clerk] Error real al cargar o montar SignIn:', err);
      const detail = err instanceof Error ? err.message : String(err);
      this.errorMsg = `No se pudo cargar Clerk. ${detail}`;
    } finally {
      this.setLoadingClerk(false);
    }
  }

  private scheduleMountClerkSignIn(): void {
    if (!this.isBrowser) {
      setTimeout(() => this.setLoadingClerk(false));
      return;
    }

    if (this.mountTimeoutId) {
      clearTimeout(this.mountTimeoutId);
    }

    this.mountTimeoutId = setTimeout(() => {
      this.mountTimeoutId = null;
      void this.mountClerkSignIn();
    });
  }

  private getReasonMessage(reason: string | null): string {
    if (reason === 'session-expired') {
      return 'Tu sesion expiro o no se pudo validar tu usuario. Inicia sesion de nuevo.';
    }

    if (reason === 'forbidden') {
      return 'Tu usuario no tiene permisos para ingresar a este portal.';
    }

    return '';
  }
}
