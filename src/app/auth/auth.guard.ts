import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { ClerkAuthService } from './clerk-auth.service';
import { AuthService } from './auth.service';
import { PortalType } from './auth.models';

type GuardResult = boolean | UrlTree | Observable<boolean | UrlTree>;

function getPortalFromRoute(route: Route): PortalType {
  const portal = route.data?.['portal'];

  if (portal === 'cliente' || portal === 'transportista' || portal === 'deposito') {
    return portal;
  }

  return 'transportista';
}

function buildUrlFromSegments(segments: UrlSegment[]): string {
  const url = '/' + segments.map(s => s.path).join('/');
  return url === '/' ? '/dashboard' : url;
}

function buildLoginRedirect(router: Router, portal: PortalType, redirectUrl: string): UrlTree {
  return router.createUrlTree(['/login'], {
    queryParams: {
      portal,
      redirectUrl,
    },
  });
}

function buildForbiddenRedirect(router: Router, portal: PortalType): UrlTree {
  return router.createUrlTree(['/login'], {
    queryParams: {
      portal,
      reason: 'forbidden',
    },
  });
}

function checkPortalAccess(portal: PortalType, redirectUrl: string): GuardResult {
  const clerkAuth = inject(ClerkAuthService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const toLogin = buildLoginRedirect(router, portal, redirectUrl);

  return from(clerkAuth.isSignedIn()).pipe(
    switchMap(isSignedIn => {
      if (!isSignedIn) {
        return of(toLogin);
      }

      return authService.loadMe().pipe(
        map(me => {
          if (authService.canAccessPortal(me, portal)) {
            return true;
          }

          return buildForbiddenRedirect(router, portal);
        }),
        catchError(err => {
          console.error('Error cargando /me desde guard:', err);

          return of(
            router.createUrlTree(['/login'], {
              queryParams: {
                portal,
                reason: 'session-expired',
                redirectUrl,
              },
            })
          );
        })
      );
    }),
    catchError(err => {
      console.error('Error validando sesion Clerk desde guard:', err);
      return of(toLogin);
    })
  );
}

export const canMatchPortal: CanMatchFn = (route, segments) => {
  const portal = getPortalFromRoute(route);
  const redirectUrl = buildUrlFromSegments(segments);

  return checkPortalAccess(portal, redirectUrl);
};

export const canActivatePortal: CanActivateFn = (route, state) => {
  const portal = route.data?.['portal'];

  if (portal === 'cliente' || portal === 'transportista' || portal === 'deposito') {
    return checkPortalAccess(portal, state.url);
  }

  return checkPortalAccess('transportista', state.url);
};

export const canMatchAuth: CanMatchFn = (route, segments) => {
  const redirectUrl = buildUrlFromSegments(segments);

  return checkPortalAccess('transportista', redirectUrl);
};

export const canActivateAuth: CanActivateFn = (route, state) => {
  return checkPortalAccess('transportista', state.url);
};