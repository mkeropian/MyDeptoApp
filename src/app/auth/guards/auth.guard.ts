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

  // Si está autenticado, permitir acceso
  if (authStatus === 'authenticated') {
    return true;
  }

  // Si aún está verificando, esperar (esto debería ser rápido)
  if (authStatus === 'checking') {
    // En producción podrías manejar esto de forma más elegante
    return true;
  }

  // No autenticado, redirigir al login
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

/**
 * Guard inverso - solo permite acceso si NO está autenticado
 * Útil para la página de login
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  // Si NO está autenticado, permitir acceso
  if (authStatus === 'not-authenticated') {
    return true;
  }

  // Si ya está autenticado, redirigir al dashboard
  if (authStatus === 'authenticated') {
    router.navigate(['/dashboard']);
    return false;
  }

  // Mientras verifica, permitir
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

  // Verificar autenticación primero
  if (authStatus !== 'authenticated') {
    router.navigate(['/auth/login']);
    return false;
  }

  // Si no se especificaron roles, solo requiere autenticación
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Verificar si tiene alguno de los roles requeridos
  const hasRequiredRole = authService.hasAnyRole(requiredRoles);

  if (!hasRequiredRole) {
    // Redirigir a página de acceso denegado
    router.navigate(['/access-denied']);
    return false;
  }

  return true;
};
