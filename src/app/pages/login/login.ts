import { Component, inject, DestroyRef, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedImports } from '../../material.module';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environment';

const LAST_USER_KEY = 'ls_last_user';

type PortalType = 'cliente' | 'transportista' | 'deposito';

interface PortalConfig {
  tipo: PortalType;
  titulo: string;
  subtitulo: string;
  botonTexto: string;
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
  imports: [SharedImports, CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  usuario = '';
  password = '';
  showPassword = false;
  recordarme = false;
  loading = false;
  errorMsg = '';
  portal: PortalType = 'cliente';

  readonly portalConfigs: Record<PortalType, PortalConfig> = {
    cliente: {
      tipo: 'cliente',
      titulo: 'Acceso de Cliente',
      subtitulo: 'Ingresá para ver tus envíos',
      botonTexto: 'Ingresar como cliente',
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
      subtitulo: 'Ingresá para gestionar tus entregas',
      botonTexto: 'Ingresar como transportista',
      icono: 'local_shipping',
      colorPrincipal: '#16a34a',
      colorSuave: '#f0fdf4',
      colorBorde: '#bbf7d0',
      colorTexto: '#15803d',
      colorLink: '#16a34a'
    },
    deposito: {
      tipo: 'deposito',
      titulo: 'Acceso de Depósito',
      subtitulo: 'Ingresá para administrar el depósito',
      botonTexto: 'Ingresar como depósito',
      icono: 'warehouse',
      colorPrincipal: '#7c3aed',
      colorSuave: '#f5f3ff',
      colorBorde: '#ddd6fe',
      colorTexto: '#6d28d9',
      colorLink: '#7c3aed'
    }
  };

  portalActual: PortalConfig = this.portalConfigs['cliente'];

  private destroyRef = inject(DestroyRef);
  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    private auth: AuthService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (environment.prefillLogin) {
      this.usuario = environment.devLoginUser;
      this.password = environment.devLoginPass;
      this.recordarme = true;
    } else if (this.isBrowser) {
      const last = localStorage.getItem(LAST_USER_KEY);
      if (last) {
        this.usuario = last;
        this.recordarme = true;
      }
    }

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
          this.portal = 'cliente';
        }

        this.portalActual = this.portalConfigs[this.portal];

        this.errorMsg =
          reason === 'session-expired'
            ? 'Tu sesión expiró por inactividad. Iniciá sesión de nuevo.'
            : '';
      });
  }

  onLogin(): void {
    if (!this.usuario || !this.password) {
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.login({ usernameOrEmail: this.usuario, password: this.password })
      .subscribe({
        next: res => {
          this.auth.setAccessToken(res.accessToken, this.recordarme);

          if (this.isBrowser) {
            if (this.recordarme) {
              localStorage.setItem(LAST_USER_KEY, this.usuario);
            } else {
              localStorage.removeItem(LAST_USER_KEY);
            }
          }

          this.router.navigate(['/dashboard']);
        },
        error: err => {
          this.errorMsg = 'Credenciales inválidas';
          console.error(err);
        }
      })
      .add(() => {
        this.loading = false;
      });
  }
}
