import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { MeDTO, PortalType, TipoPortal } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly currentUserSubject = new BehaviorSubject<MeDTO | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: AuthService) {}

  loadCurrentUser(): Observable<MeDTO> {
    return this.auth.loadMe().pipe(
      tap(me => this.currentUserSubject.next(me))
    );
  }

  getCurrentUser(): MeDTO | null {
    return this.currentUserSubject.value;
  }

  clear(): void {
    this.currentUserSubject.next(null);
  }

  canAccessPortal(me: MeDTO, portal: PortalType): boolean {
    if (me.tipoPortal === 'ADMIN') {
      return true;
    }

    if (portal === 'transportista') {
      return me.tipoPortal === 'TRANSPORTISTA';
    }

    if (portal === 'cliente') {
      return me.tipoPortal === 'CLIENTE';
    }

    if (portal === 'deposito') {
      return me.tipoPortal === 'DEPOSITO';
    }

    return false;
  }

  getDefaultRouteFor(me: MeDTO, portal: PortalType): string[] | null {
    if (!this.canAccessPortal(me, portal)) {
      return null;
    }

    if (me.tipoPortal === 'ADMIN') {
      return ['/dashboard'];
    }

    if (me.tipoPortal === 'TRANSPORTISTA') {
      return ['/dashboard'];
    }

    if (me.tipoPortal === 'CLIENTE') {
      return ['/cliente'];
    }

    if (me.tipoPortal === 'DEPOSITO') {
      return ['/deposito'];
    }

    return null;
  }

  getAccessDeniedMessage(me: MeDTO, portal: PortalType): string {
    const portalNombre = this.getPortalLabel(portal);
    const tipoUsuario = this.getTipoPortalLabel(me.tipoPortal);

    return `Tu cuenta es de ${tipoUsuario} y no tiene permisos para ingresar al ${portalNombre}.`;
  }

  private getPortalLabel(portal: PortalType): string {
    switch (portal) {
      case 'cliente':
        return 'Portal de Clientes';
      case 'transportista':
        return 'Portal de Transportistas';
      case 'deposito':
        return 'Portal de Depósito';
      default:
        return 'portal solicitado';
    }
  }

  private getTipoPortalLabel(tipo: TipoPortal): string {
    switch (tipo) {
      case 'ADMIN':
        return 'Administrador';
      case 'TRANSPORTISTA':
        return 'Transportista';
      case 'CLIENTE':
        return 'Cliente';
      case 'DEPOSITO':
        return 'Depósito';
      default:
        return 'usuario sin rol';
    }
  }
}