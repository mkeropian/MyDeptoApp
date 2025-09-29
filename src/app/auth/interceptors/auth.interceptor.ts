// src/app/auth/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Interceptor funcional para Angular 19
 * Agrega automáticamente el token a todas las requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Obtener token del localStorage
  const token = localStorage.getItem('token');

  // Clonar la request y agregar el header x-token si existe
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        'x-token': token
      }
    });
  }

  // Continuar con la request y manejar errores 401
  return next(authReq).pipe(
    catchError((error) => {
      // Si es error 401 y no es la ruta de login, redirigir
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    })
  );
};
