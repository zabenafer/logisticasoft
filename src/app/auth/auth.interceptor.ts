import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { ClerkAuthService } from './clerk-auth.service';

const PUBLIC_ENDPOINT_PATTERNS = [
  /\/api\/envios\/tracking(\/|$)/,
  /\/api\/envios\/seguimiento(\/|$)/,
  /\/public(\/|$)/,
];

function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINT_PATTERNS.some(pattern => pattern.test(url));
}

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const clerkAuth = inject(ClerkAuthService);
  const router = inject(Router);

  return from(clerkAuth.getToken()).pipe(
    switchMap(token => next(token ? addAuthHeader(req, token) : req)),
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        void router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
      }

      throw err;
    })
  );
};
