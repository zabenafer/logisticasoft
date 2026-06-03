// src/app/auth/auth.interceptor.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, EMPTY, from } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { ClerkAuthService } from './clerk-auth.service';
import { RefreshResponse } from './auth.models';

const PUBLIC_PREFIXES = [
  '/public/',
  '/api/envios/tracking'
];

function isPublicEndpoint(url: string): boolean {
  return PUBLIC_PREFIXES.some(p => url.startsWith(p));
}

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {

  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  if (!isBrowser) {
    return next(req);
  }

  const auth = inject(AuthService);
  const clerkAuth = inject(ClerkAuthService);
  const router = inject(Router);

  const isAuthEndpoint = req.url.startsWith('/api/auth/');
  const localToken = auth.getAccessToken();

  // 1) Si hay token local, usamos el flujo viejo con refresh.
  if (localToken && !isAuthEndpoint) {

    if (auth.isTokenExpiredSoon()) {
      return handleRefresh(auth, router).pipe(
        switchMap(newToken => next(addAuthHeader(req, newToken))),
        catchError(() => EMPTY)
      );
    }

    const request = addAuthHeader(req, localToken);

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
  }

  // 2) Si no hay token local, intentamos usar token de Clerk.
  if (!isAuthEndpoint) {
    return from(clerkAuth.getToken()).pipe(
      switchMap(clerkToken => {
        const request = clerkToken ? addAuthHeader(req, clerkToken) : req;
        return next(request);
      }),
      catchError(err => {
        const isMeEndpoint = req.url.endsWith('/api/me') || req.url.endsWith('/me');

        if (err instanceof HttpErrorResponse && err.status === 401 && !isMeEndpoint) {
          router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
        }

        return throwError(() => err);
      })
    );
  }

  return next(req);
};

function addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
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