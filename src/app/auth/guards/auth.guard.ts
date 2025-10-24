// src/app/auth/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, map } from 'rxjs/operators';

/**
 * Guard funcional para Angular 19
 * Protege rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Convertir signal a observable y esperar a que termine de verificar
  return toObservable(authService.authStatus).pipe(
    filter((status) => status !== 'checking'),
    take(1),
    map((status) => {
      if (status === 'authenticated') {
        return true;
      }

      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};

/**
 * Guard inverso - solo permite acceso si NO está autenticado
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.authStatus).pipe(
    filter((status) => status !== 'checking'),
    take(1),
    map((status) => {
      if (status === 'not-authenticated') {
        return true;
      }

      router.navigate(['/home']);
      return false;
    })
  );
};

/**
 * Guard para verificar roles específicos
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;

  return toObservable(authService.authStatus).pipe(
    filter((status) => status !== 'checking'),
    take(1),
    map((status) => {
      if (status !== 'authenticated') {
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
    })
  );
};

/**
 * Guard para verificar permisos específicos
 */
export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermisos = route.data['permisos'] as string[] | undefined;
  const requireAll = route.data['requireAllPermisos'] as boolean | undefined;

  return toObservable(authService.authStatus).pipe(
    filter((status) => status !== 'checking'),
    take(1),
    map((status) => {
      if (status !== 'authenticated') {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      if (!requiredPermisos || requiredPermisos.length === 0) {
        return true;
      }

      let hasPermission = false;

      if (requireAll) {
        hasPermission = authService.tienePermisos(requiredPermisos);
      } else {
        hasPermission = authService.tieneAlgunPermiso(requiredPermisos);
      }

      if (!hasPermission) {
        router.navigate(['/unauthorized']);
        return false;
      }

      return true;
    })
  );
};

/**
 * Guard combinado - verifica roles O permisos
 */
export const roleOrPermissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;
  const requiredPermisos = route.data['permisos'] as string[] | undefined;

  return toObservable(authService.authStatus).pipe(
    filter((status) => status !== 'checking'),
    take(1),
    map((status) => {
      if (status !== 'authenticated') {
        router.navigate(['/auth/login']);
        return false;
      }

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
    })
  );
};
