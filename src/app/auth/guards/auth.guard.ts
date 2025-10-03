// src/app/auth/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para Angular 19
 * Protege rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus === 'authenticated') {
    return true;
  }

  if (authStatus === 'checking') {
    return true;
  }

  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

/**
 * Guard inverso - solo permite acceso si NO está autenticado
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus === 'not-authenticated') {
    return true;
  }

  if (authStatus === 'authenticated') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};

/**
 * Guard para verificar roles específicos
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();
  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (authStatus !== 'authenticated') {
    router.navigate(['/auth/login']);
    return false;
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const hasRequiredRole = authService.hasAnyRole(requiredRoles);

  if (!hasRequiredRole) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};

/**
 * NUEVO: Guard para verificar permisos específicos
 * Uso en rutas:
 * {
 *   path: 'departamentos',
 *   component: DepartamentosComponent,
 *   canActivate: [authGuard, permissionGuard],
 *   data: { permisos: ['departamentos'] }
 * }
 */
export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  // Verificar autenticación primero
  if (authStatus !== 'authenticated') {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Obtener permisos requeridos de la ruta
  const requiredPermisos = route.data['permisos'] as string[] | undefined;
  const requireAll = route.data['requireAllPermisos'] as boolean | undefined;

  // Si no se especificaron permisos, solo requiere autenticación
  if (!requiredPermisos || requiredPermisos.length === 0) {
    return true;
  }

  // Verificar permisos
  let hasPermission = false;

  if (requireAll) {
    // Requiere TODOS los permisos (AND)
    hasPermission = authService.tienePermisos(requiredPermisos);
  } else {
    // Requiere AL MENOS UNO de los permisos (OR) - comportamiento por defecto
    hasPermission = authService.tieneAlgunPermiso(requiredPermisos);
  }

  if (!hasPermission) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};

/**
 * NUEVO: Guard combinado - verifica roles O permisos
 * Más flexible para casos donde un admin puede ver todo
 * pero otros roles necesitan permisos específicos
 *
 * Uso:
 * {
 *   path: 'configuracion',
 *   component: ConfiguracionComponent,
 *   canActivate: [authGuard, roleOrPermissionGuard],
 *   data: {
 *     roles: ['admin'],  // Admins siempre pueden entrar
 *     permisos: ['configuracion']  // O tener el permiso específico
 *   }
 * }
 */
export const roleOrPermissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus !== 'authenticated') {
    router.navigate(['/auth/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as string[] | undefined;
  const requiredPermisos = route.data['permisos'] as string[] | undefined;

  // Si es admin, permitir acceso
  if (requiredRoles && authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // Si no es admin, verificar permisos
  if (requiredPermisos && authService.tieneAlgunPermiso(requiredPermisos)) {
    return true;
  }

  // No tiene ni rol ni permiso
  router.navigate(['/unauthorized']);
  return false;
};
