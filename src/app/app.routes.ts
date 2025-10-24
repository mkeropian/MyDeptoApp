// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { NotFoundPageComponent } from './shared/pages/not-found-page/not-found-page.component';
import { authGuard, guestGuard, roleGuard } from './auth/guards/auth.guard';
import { UnauthorizedPageComponent } from './shared/pages/unauthorized-page/unauthorized-page.component';

export const routes: Routes = [
  // Ruta por defecto
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  // Rutas de autenticación (solo para usuarios NO logueados)
  {
    path: 'auth',
    canActivate: [guestGuard], // Solo accesible si NO está logueado
    loadChildren: () => import('./auth/auth.route'),
  },

  // Home (requiere autenticación)
  {
    path: 'home',
    canActivate: [authGuard], // Ahora requiere estar logueado
    loadChildren: () => import('./web-front/web-front.route'),
  },

  // Admin (requiere autenticación Y rol admin)
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./admin-dashboard/admin.route'),
  },

  // Dashboard (requiere autenticación)
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard], // Requiere estar logueado
    data: { roles: ['admin','gerenciadora'] }, // Solo usuarios con rol 'admin' y 'gerenciadora'
    loadChildren: () => import('./admin-dashboard/dashboard.route'),
  },

  // Calendario (requiere autenticación)
  {
    path: 'calendar',
    canActivate: [authGuard, roleGuard], // Requiere estar logueado
    data: { roles: ['admin','gerenciadora','emp'] }, // Solo usuarios con rol 'admin' y 'gerenciadora'
    loadChildren: () => import('./calendario-empleados/calendario-empleados.route'),
  },

  {
    path: 'unauthorized',
    component: UnauthorizedPageComponent
  },

  // Página 404 - debe ir al final
  {
    path: '**',
    component: NotFoundPageComponent,
  },
];
