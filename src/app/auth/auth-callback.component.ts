import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SharedImports } from '../material.module';
import { ClerkAuthService } from './clerk-auth.service';
import { PortalType } from './auth.models';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

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
          <p>Estamos verificando tu sesion de Clerk.</p>
        </ng-container>

        <ng-template #resultadoBox>
          <h2>{{ accessDenied ? 'Acceso no permitido' : 'No pudimos iniciar sesion' }}</h2>
          <p>{{ errorMsg }}</p>

          <div class="callback-actions" *ngIf="accessDenied; else retryLogin">
            <button mat-flat-button class="home-button" type="button" (click)="irPortalCorrecto()">
              Ir a mi portal
            </button>

            <button mat-stroked-button type="button" class="secondary-button" (click)="cerrarSesionReintentar()">
              Ingresar con otra cuenta
            </button>
          </div>

          <ng-template #retryLogin>
            <a mat-flat-button routerLink="/login" class="home-button">
              Volver a intentar
            </a>
          </ng-template>
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

    .callback-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .secondary-button {
      border-radius: 12px !important;
      font-weight: 700;
      min-height: 44px;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  procesando = true;
  errorMsg = '';
  portal: PortalType = 'transportista';

  accessDenied = false;
  portalPermitidoUrl = '/home';

  private callbackIniciado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clerkAuth: ClerkAuthService,
    private authService: AuthService
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
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl');

    if (
      portalParam === 'cliente' ||
      portalParam === 'transportista' ||
      portalParam === 'deposito'
    ) {
      this.portal = portalParam;
    }

    this.procesando = true;
    this.errorMsg = '';

    try {
      const token = await this.clerkAuth.waitForToken(60, 250);

      if (!token) {
        this.errorMsg = 'No se pudo obtener la sesion de Clerk. Volve a intentarlo.';
        this.procesando = false;
        return;
      }

      const me = await firstValueFrom(this.authService.loadMe(true));

      if (!this.authService.canAccessPortal(me, this.portal)) {
        this.accessDenied = true;
        this.portalPermitidoUrl = this.authService.getDefaultRouteForUser(me);
        this.errorMsg = this.authService.getForbiddenMessage(this.portal);
        this.procesando = false;
        return;
      }

      await this.router.navigateByUrl(this.getSafeRedirectUrl(redirectUrl));
    } catch (err) {
      console.error(err);
      this.errorMsg = 'No se pudo validar tu usuario. Volve a intentarlo.';
      this.procesando = false;
    }
  }

  irPortalCorrecto(): void {
    void this.router.navigateByUrl(this.portalPermitidoUrl);
  }

  async cerrarSesionReintentar(): Promise<void> {
    await this.clerkAuth.signOut();
    this.authService.clearSession();

    await this.router.navigate(['/login'], {
      queryParams: {
        portal: this.portal,
      },
    });
  }

  private getSafeRedirectUrl(redirectUrl: string | null): string {
    if (redirectUrl?.startsWith('/') && !redirectUrl.startsWith('//')) {
      return redirectUrl;
    }

    return this.authService.getDefaultRouteForPortal(this.portal);
  }
}
