import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { SeguimientoComponent } from './pages/seguimiento/seguimiento';
import { canMatchPortal } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./auth/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  { path: 'seguimiento/:trackingNumber', component: SeguimientoComponent },
  { path: 'home', component: HomeComponent },
  {
    path: 'dashboard',
    canMatch: [canMatchPortal],
    data: { portal: 'transportista' },
    loadChildren: () =>
      import('./pages/dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'cliente',
    canMatch: [canMatchPortal],
    data: { portal: 'cliente' },
    loadComponent: () =>
      import('./pages/cliente/cliente').then(m => m.ClienteComponent),
  },
  {
    path: 'deposito',
    canMatch: [canMatchPortal],
    data: { portal: 'deposito' },
    loadComponent: () =>
      import('./pages/deposito/deposito').then(m => m.DepositoComponent),
  },
  { path: '**', redirectTo: 'home' },
];
