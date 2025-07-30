import { Routes } from '@angular/router';

import { NotFoundPageComponent } from './shared/pages/not-found-page/not-found-page.component';

export const routes: Routes = [
  {
    path:'home',
    loadChildren: () => import('./web-front/web-front.route'),
  },
  {
    path:'admin',
    loadChildren: () => import('./admin-dashboard/admin.route'),
  },
  {
    path:'dashboard',
    loadChildren: () => import('./admin-dashboard/dashboard.route'),
  },
  {
    path:'calendar',
    loadChildren: () => import('./calendario-empleados/calendario-empleados.route'),
  },
  {
    path: '**',
    component: NotFoundPageComponent,
  },
];
