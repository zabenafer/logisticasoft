// src/app/auth/auth.interceptor.ts
const PUBLIC_PREFIXES = ['/public/', '/api/seguimiento'];
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, throwError, of, EMPTY } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { RefreshResponse } from './auth.models';
import { Router } from '@angular/router';

function isPublicEndpoint(url: string): boolean {
  return PUBLIC_PREFIXES.some(p => url.startsWith(p));
}

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {

  if (isPublicEndpoint(req.url)) {
    // no adjuntes Authorization ni intentes refresh
    return next(req);
  }

  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  if (!isBrowser) {
    // ✅ En SSR no tocamos tokens ni refrescamos
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = req.url.startsWith('/api/auth/');
  const token = auth.getAccessToken();

  let request = req;
  if (token && !isAuthEndpoint) {
    request = addAuthHeader(req, token);
  }

  // Refresh proactivo
  if (!isAuthEndpoint && token && auth.isTokenExpiredSoon()) {
    return handleRefresh(auth, router).pipe(
      switchMap(newToken => next(addAuthHeader(req, newToken))),
      catchError(() => EMPTY) // no propagamos error ni ejecutamos la request
    );
  }

  // Flujo normal + refresh reactivo ante 401
  return next(request).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint) {
        return handleRefresh(auth, router).pipe(
          switchMap(newToken => next(addAuthHeader(req, newToken)))
        );
      }
      return throwError(() => err);
    })
  );
};

function addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handleRefresh(auth: AuthService, router: Router): Observable<string> {
  if (isRefreshing) {
    return refreshSubject.pipe(filter(t => t !== null), take(1)) as Observable<string>;
  }
  isRefreshing = true;
  refreshSubject.next(null);

  return auth.refresh().pipe(
    switchMap((res: RefreshResponse) => {
      const newToken = res.accessToken;
      auth.setAccessToken(newToken);
      refreshSubject.next(newToken);
      isRefreshing = false;
      return of(newToken);
    }),
    catchError(() => {
      isRefreshing = false;
      auth.clearToken();
      router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
      return EMPTY;
    })
  );
}
