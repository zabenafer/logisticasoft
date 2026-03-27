import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard';
import { ClientesComponent } from './clientes/clientes';
import { EnviosComponent } from './envios/envios';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'clientes', component: ClientesComponent },
      { path: 'envios', loadComponent: () => import('./envios/envios').then(m => m.EnviosComponent) },
      { path: '', redirectTo: 'clientes', pathMatch: 'full' },
    ],
  },
];

