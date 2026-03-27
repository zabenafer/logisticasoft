// src/app/auth/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LoginRequest, LoginResponse, RefreshResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;
  private readonly KEY_LOCAL  = 'ls_access_token';
  private readonly KEY_SESSION = 'ls_access_token_session';
  private readonly EXP_SKEW_SEC = 30;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.accessToken =
        localStorage.getItem(this.KEY_LOCAL) ??
        sessionStorage.getItem(this.KEY_SESSION);
    } else {
      this.accessToken = null;
    }
  }

  login(req: LoginRequest) { return this.http.post<LoginResponse>('/api/auth/login', req); }
  logout() { this.clearToken(); return this.http.post<void>('/api/auth/logout', {}); }
  refresh() { return this.http.post<RefreshResponse>('/api/auth/refresh', {}); }

  setAccessToken(token: string, remember = false) {
    this.accessToken = token;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.KEY_LOCAL);
      sessionStorage.removeItem(this.KEY_SESSION);
      if (remember) localStorage.setItem(this.KEY_LOCAL, token);
      else sessionStorage.setItem(this.KEY_SESSION, token);
    }
  }

  clearToken() {
    this.accessToken = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.KEY_LOCAL);
      sessionStorage.removeItem(this.KEY_SESSION);
    }
  }

  getAccessToken(): string | null { return this.accessToken; }

  // ✅ En SSR, no intentes calcular expiración ni refrescar
  isTokenExpiredSoon(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    if (!this.accessToken) return true;
    const exp = this.getTokenExp(this.accessToken);
    if (!exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return exp - nowSec <= this.EXP_SKEW_SEC;
  }

  private getTokenExp(token: string): number | null {
    try {
      const payloadB64 = token.split('.')[1];
      const json = this.safeB64Decode(payloadB64);
      const payload = JSON.parse(json || '{}');
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch { return null; }
  }

  // ✅ atob seguro para browser/SSR
  private safeB64Decode(input: string): string {
    try {
      if (typeof atob === 'function') return atob(input);
      // @ts-ignore SSR/Node
      if (typeof Buffer !== 'undefined') return Buffer.from(input, 'base64').toString('utf-8');
    } catch { /* ignore */ }
    return '';
  }

    // en AuthService
  getTid(): number | null {
    const p = this.getPayload();
    return p && typeof p.tid !== 'undefined'
      ? Number(p.tid)
      : null;
  }

  getUsername(): string | null {
    const p = this.getPayload();
    return p?.username ?? null;
  }

  getRoles(): string[] {
    const p = this.getPayload();
    const r = p?.roles;
    return Array.isArray(r) ? r.map(String) : [];
  }

  // --- privados ---
  private getPayload(): any | null {
    if (!this.accessToken) return null;
    try {
      const b64 = this.accessToken.split('.')[1];
      const json = this.safeB64Decode(b64);
      return json ? JSON.parse(json) : null;
    } catch { return null; }
  }
}
