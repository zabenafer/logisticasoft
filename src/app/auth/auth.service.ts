import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

import { MeDTO, PortalType, TipoPortal } from './auth.models';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly meUrl = `${environment.apiUrl}/me`;

  private currentUserSubject = new BehaviorSubject<MeDTO | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private meRequest$?: Observable<MeDTO>;

  constructor(private http: HttpClient) {}

  loadMe(force = false): Observable<MeDTO> {
    const currentUser = this.currentUserSubject.value;

    if (!force && currentUser) {
      return of(currentUser);
    }

    if (!force && this.meRequest$) {
      return this.meRequest$;
    }

    this.meRequest$ = this.http.get<MeDTO>(this.meUrl).pipe(
      tap(me => this.currentUserSubject.next(me)),
      finalize(() => {
        this.meRequest$ = undefined;
      }),
      shareReplay(1)
    );

    return this.meRequest$;
  }

  getCurrentUser(): MeDTO | null {
    return this.currentUserSubject.value;
  }

  clearSession(): void {
    this.currentUserSubject.next(null);
    this.meRequest$ = undefined;
  }

  canAccessPortal(me: MeDTO | null, portal: PortalType): boolean {
    if (!me) {
      return false;
    }

    if (this.isAdmin(me)) {
      return true;
    }

    const expectedTipoPortal = this.getTipoPortalForPortal(portal);

    if (me.tipoPortal === expectedTipoPortal) {
      return true;
    }

    const roles = this.normalizeRoles(me.roles);

    if (portal === 'transportista') {
      return roles.includes('TRANSPORTISTA') || roles.includes('ADMIN_TRANSPORTISTA');
    }

    if (portal === 'cliente') {
      return roles.includes('CLIENTE');
    }

    if (portal === 'deposito') {
      return roles.includes('DEPOSITO');
    }

    return false;
  }

  getDefaultRouteForPortal(portal: PortalType): string {
    if (portal === 'cliente') {
      return '/cliente';
    }

    if (portal === 'deposito') {
      return '/deposito';
    }

    return '/dashboard';
  }

  getForbiddenMessage(portal: PortalType): string {
    if (portal === 'cliente') {
      return 'Tu usuario no tiene permisos para ingresar al portal de Cliente.';
    }

    if (portal === 'deposito') {
      return 'Tu usuario no tiene permisos para ingresar al portal de Deposito.';
    }

    return 'Tu usuario no tiene permisos para ingresar al portal de Transportista.';
  }

  clearToken(): void {
    this.clearSession();
  }

  getAccessToken(): string | null {
    return null;
  }

  getTid(): number | null {
    return this.currentUserSubject.value?.transportistaId ?? null;
  }

  getUsername(): string | null {
    return this.currentUserSubject.value?.email ?? null;
  }

  getRoles(): string[] {
    return this.currentUserSubject.value?.roles ?? [];
  }

  private isAdmin(me: MeDTO): boolean {
    const roles = this.normalizeRoles(me.roles);
    return me.tipoPortal === 'ADMIN' || roles.includes('ADMIN');
  }

  private getTipoPortalForPortal(portal: PortalType): TipoPortal {
    if (portal === 'cliente') {
      return 'CLIENTE';
    }

    if (portal === 'deposito') {
      return 'DEPOSITO';
    }

    return 'TRANSPORTISTA';
  }

  private normalizeRoles(roles: string[]): string[] {
    return roles.map(role => role.replace(/^ROLE_/, '').toUpperCase());
  }

  getDefaultRouteForUser(me: MeDTO | null): string {
    if (!me) {
      return '/home';
    }

    if (me.tipoPortal === 'ADMIN') {
      return '/dashboard';
    }

    if (me.tipoPortal === 'TRANSPORTISTA') {
      return '/dashboard';
    }

    if (me.tipoPortal === 'CLIENTE') {
      return '/cliente';
    }

    if (me.tipoPortal === 'DEPOSITO') {
      return '/deposito';
    }

    return '/home';
  }
}