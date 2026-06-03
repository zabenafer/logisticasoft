import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { ClerkAuthService } from './clerk-auth.service';
import { AuthSessionService } from './auth-session.service';
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
      redirectUrl
    }
  });
}

function buildAccessDeniedRedirect(router: Router): UrlTree {
  return router.createUrlTree(['/home'], {
    queryParams: {
      reason: 'access-denied'
    }
  });
}

function loadUserAndValidatePortal(
  session: AuthSessionService,
  router: Router,
  portal: PortalType
): Observable<boolean | UrlTree> {
  return session.loadCurrentUser().pipe(
    map(me => {
      if (session.canAccessPortal(me, portal)) {
        return true;
      }

      return buildAccessDeniedRedirect(router);
    }),
    catchError(err => {
      console.error('Error cargando /api/me desde guard:', err);
      session.clear();
      return of(buildAccessDeniedRedirect(router));
    })
  );
}

function checkPortalAccess(portal: PortalType, redirectUrl: string): GuardResult {
  const auth = inject(AuthService);
  const clerkAuth = inject(ClerkAuthService);
  const session = inject(AuthSessionService);
  const router = inject(Router);

  const localToken = auth.getAccessToken();
  const toLogin = buildLoginRedirect(router, portal, redirectUrl);

  /**
   * 1) Login local actual
   */
  if (localToken) {
    if (!auth.isTokenExpiredSoon()) {
      return loadUserAndValidatePortal(session, router, portal);
    }

    return auth.refresh().pipe(
      switchMap(res => {
        auth.setAccessToken(res.accessToken);
        return loadUserAndValidatePortal(session, router, portal);
      }),
      catchError(err => {
        console.error('Error refrescando token desde guard:', err);
        session.clear();
        return of(toLogin);
      })
    );
  }

  /**
   * 2) Login Clerk
   */
  return from(clerkAuth.isSignedIn()).pipe(
    switchMap(isSignedIn => {
      if (!isSignedIn) {
        return of(toLogin);
      }

      return loadUserAndValidatePortal(session, router, portal);
    }),
    catchError(err => {
      console.error('Error validando sesión Clerk desde guard:', err);
      session.clear();
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

/**
 * Compatibilidad por si todavía tenés alguna ruta usando canMatchAuth/canActivateAuth.
 * Por defecto protege como portal transportista.
 */
export const canMatchAuth: CanMatchFn = (route, segments) => {
  const redirectUrl = buildUrlFromSegments(segments);

  return checkPortalAccess('transportista', redirectUrl);
};

export const canActivateAuth: CanActivateFn = (route, state) => {
  return checkPortalAccess('transportista', state.url);
};