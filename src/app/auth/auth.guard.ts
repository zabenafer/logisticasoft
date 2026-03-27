import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

function checkAuth(redirectUrl: string | undefined): boolean | UrlTree | import("rxjs").Observable<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  const toLogin = router.createUrlTree(['/login'], { queryParams: { redirectUrl: redirectUrl ?? '/' } });

  // 1) no hay token -> a login
  if (!token) return toLogin;

  // 2) token ok y no está por expirar -> pasa
  if (!auth.isTokenExpiredSoon()) return true;

  // 3) token por expirar -> intento refresh
  return auth.refresh().pipe(
    map(res => {
      auth.setAccessToken(res.accessToken);
      return true;
    }),
    catchError(() => of(toLogin))
  );
}

export const canMatchAuth: CanMatchFn = (route, segments) => {
  const url = '/' + segments.map(s => s.path).join('/');
  return checkAuth(url);
};

export const canActivateAuth: CanActivateFn = (route, state) => {
  return checkAuth(state?.url);
};
