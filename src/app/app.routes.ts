import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { SeguimientoComponent } from './pages/seguimiento/seguimiento';
import { canMatchAuth } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'seguimiento/:trackingNumber', component: SeguimientoComponent },
  { path: 'home', component: HomeComponent },
  {
    path: 'dashboard',
    canMatch: [canMatchAuth],
    loadChildren: () =>
      import('./pages/dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES),
  },
  { path: '**', redirectTo: 'home' },
];
