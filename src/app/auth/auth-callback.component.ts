import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from './auth-session.service';
import { SharedImports } from '../material.module';
import { AuthService } from './auth.service';
import { ClerkAuthService } from './clerk-auth.service';
import { MeDTO, PortalType } from './auth.models';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedImports],
  template: `
    <div class="callback-page">
      <div class="callback-card">
      <div class="callback-icon" [class.error]="!procesando && !!errorMsg">
        <mat-icon>{{ !procesando && errorMsg ? 'error' : 'verified_user' }}</mat-icon>
      </div>

      <ng-container *ngIf="procesando; else resultadoBox">
        <mat-spinner diameter="42"></mat-spinner>
        <h2>Validando tu cuenta...</h2>
        <p>Estamos verificando tus permisos de acceso.</p>
      </ng-container>

      <ng-template #resultadoBox>
        <h2>No pudimos iniciar sesión</h2>
        <p>{{ errorMsg }}</p>

        <a mat-flat-button routerLink="/home" class="home-button">
          Volver al inicio
        </a>
      </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(circle at top, rgba(77, 166, 255, 0.08), transparent 30%),
        linear-gradient(to bottom, #d1dceb 0%, #fdfdfd 100%);
    }

    .callback-card {
      width: 100%;
      max-width: 430px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      padding: 36px 28px;
      text-align: center;
    }

    .callback-icon {
      width: 76px;
      height: 76px;
      border-radius: 24px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eff6ff;
      color: #2563eb;
    }

    .callback-icon.error {
      background: #fef2f2;
      color: #dc2626;
    }

    .callback-icon mat-icon {
      font-size: 38px;
      width: 38px;
      height: 38px;
    }

    mat-spinner {
      margin: 0 auto 18px;
    }

    h2 {
      margin: 0 0 10px;
      color: #0f172a;
      font-size: 1.5rem;
      font-weight: 800;
    }

    p {
      margin: 0 0 24px;
      color: #64748b;
      line-height: 1.5;
    }

    .home-button {
      background: #2563eb !important;
      color: #ffffff !important;
      border-radius: 12px;
      font-weight: 700;
      padding: 0 22px;
      min-height: 44px;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  procesando = true;
  errorMsg = '';
  portal: PortalType = 'cliente';

  private callbackIniciado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private clerkAuth: ClerkAuthService,
    private session: AuthSessionService
  ) {}

  ngOnInit(): void {
    if (this.callbackIniciado) {
      return;
    }

    this.callbackIniciado = true;
    void this.procesarCallback();
  }

  private async procesarCallback(): Promise<void> {
    const portalParam = this.route.snapshot.queryParamMap.get('portal');

    const source = this.route.snapshot.queryParamMap.get('source');
    const vieneDeClerk = source === 'clerk';
    const vieneDeLocal = source === 'local';

    if (
      portalParam === 'cliente' ||
      portalParam === 'transportista' ||
      portalParam === 'deposito'
    ) {
      this.portal = portalParam;
    } else {
      this.portal = 'cliente';
    }

    this.procesando = true;
    this.errorMsg = '';

    try {
      if (vieneDeClerk) {
        this.auth.clearToken();

        const token = await this.clerkAuth.waitForToken(60, 250);

        if (!token) {
          this.errorMsg = 'No se pudo obtener la sesión de Google. Volvé a intentarlo.';
          this.procesando = false;
          return;
        }
      }

      if (!vieneDeClerk && !vieneDeLocal) {
        this.errorMsg = 'Origen de autenticación inválido.';
        this.procesando = false;
        return;
      }

      const me = await firstValueFrom(this.session.loadCurrentUser());

      const redirigio = await this.resolverIngresoPorPortal(me);

      if (!redirigio) {
        this.procesando = false;
      }

    } catch (err: any) {
      console.error(err);

      if (err?.status === 401) {
        this.errorMsg = 'Tu cuenta todavía no está habilitada en Enviux.';
      } else {
        this.errorMsg = 'No se pudo validar tu usuario. Volvé a intentarlo.';
      }

      this.procesando = false;
    }
  }

  private async resolverIngresoPorPortal(me: MeDTO): Promise<boolean> {
    const route = this.session.getDefaultRouteFor(me, this.portal);

    if (!route) {
      this.errorMsg = this.session.getAccessDeniedMessage(me, this.portal);
      return false;
    }

    if (me.tipoPortal === 'CLIENTE') {
      this.errorMsg = 'Tu cuenta cliente está validada, pero todavía falta habilitar el panel de clientes.';
      return false;
    }

    if (me.tipoPortal === 'DEPOSITO') {
      this.errorMsg = 'Tu cuenta depósito está validada, pero todavía falta habilitar el panel de depósitos.';
      return false;
    }

    await this.router.navigate(route);
    return true;
  }
}