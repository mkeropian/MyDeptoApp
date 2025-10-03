// src/app/auth/services/auth.service.ts
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { UserLogin } from "../interfaces/user.interface";
import { HttpClient } from "@angular/common/http";
import { rxResource } from "@angular/core/rxjs-interop";
import { catchError, map, Observable, of, tap } from "rxjs";
import {
  AuthResponse,
  ProfileResponse,
  ChangePasswordRequest,
  ValidateTokenResponse,
  RenewTokenResponse
} from "../interfaces/auth-response.interface";
import { ThemeService } from "../../shared/services/theme.service";

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class AuthService {

  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<UserLogin | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));
  private _permisos = signal<string[]>([]); // NUEVO: Permisos del usuario

  private http = inject(HttpClient);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  constructor() {}

  // Resource para verificar estado al iniciar la app
  checkStatusResource = rxResource({
    loader: () => this.checkStatus()
  });

  // Computeds públicos
  authStatus = computed<AuthStatus>(() => {
    if (this._authStatus() === 'checking') return 'checking';
    if (this._user()) return 'authenticated';
    return 'not-authenticated';
  });

  user = computed(() => this._user());
  token = computed(() => this._token());
  permisos = computed(() => this._permisos()); // NUEVO: Exponer permisos
  isAdmin = computed(() => this._user()?.roles?.includes('admin') ?? false);
  isAuthenticated = computed(() => this.authStatus() === 'authenticated');

  /**
   * Login con usuario o email
   */
  login(usuarioOrEmail: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${baseUrl}/auth/login`, {
      usuario: usuarioOrEmail,
      password
    }).pipe(
      map((resp) => this.handleAuthSuccess(resp)),
      catchError((error: any) => this.handleAuthError(error))
    );
  }

  /**
   * Verifica el estado del token actual
   */
  checkStatus(): Observable<boolean> {
    const token = localStorage.getItem('token') || '';

    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http.get<ValidateTokenResponse>(`${baseUrl}/auth/validate`)
      .pipe(
        map((resp) => {
          if (resp.ok) {
            // Si el token es válido, obtener perfil completo
            this.getProfile().subscribe();
            return true;
          }
          return false;
        }),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  /**
   * Renueva el token actual
   */
  renewToken(): Observable<boolean> {
    return this.http.get<RenewTokenResponse>(`${baseUrl}/auth/renew`)
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        catchError((error: any) => {
          this.logout();
          return of(false);
        })
      );
  }

  /**
   * MODIFICADO: Obtiene el perfil completo del usuario con roles Y permisos
   */
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${baseUrl}/auth/profile`)
      .pipe(
        tap((resp) => {
          if (resp.ok && resp.usuario) {
            this._user.set(resp.usuario);

            // NUEVO: Guardar permisos
            this._permisos.set(resp.usuario.permisos || []);

            // Aplicar el tema del usuario
            if (resp.usuario.tema) {
              this.themeService.setTheme(resp.usuario.tema);
            }
          }
        }),
        catchError((error: any) => {
          console.error('Error obteniendo perfil:', error);
          return of({ ok: false, msg: 'Error obteniendo perfil' });
        })
      );
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<boolean> {
    return this.http.put<AuthResponse>(`${baseUrl}/auth/change-password`, passwordData)
      .pipe(
        map((resp) => resp.ok),
        catchError((error: any) => {
          console.error('Error cambiando contraseña:', error);
          return of(false);
        })
      );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this._authStatus.set('not-authenticated');
    this._user.set(null);
    this._token.set(null);
    this._permisos.set([]); // NUEVO: Limpiar permisos
    localStorage.removeItem('token');

    this.themeService.resetTheme();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this._user()?.roles?.includes(role) ?? false;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this._user()?.roles;
    if (!userRoles) return false;
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * NUEVO: Verifica si el usuario tiene un permiso específico
   * @param permiso Nombre del permiso (ej: 'departamentos', 'departamentos.crear')
   */
  tienePermiso(permiso: string): boolean {
    return this._permisos().includes(permiso);
  }

  /**
   * NUEVO: Verifica si el usuario tiene TODOS los permisos especificados
   * @param permisos Array de permisos requeridos
   */
  tienePermisos(permisos: string[]): boolean {
    const permisosUsuario = this._permisos();
    return permisos.every(p => permisosUsuario.includes(p));
  }

  /**
   * NUEVO: Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   * @param permisos Array de permisos
   */
  tieneAlgunPermiso(permisos: string[]): boolean {
    const permisosUsuario = this._permisos();
    return permisos.some(p => permisosUsuario.includes(p));
  }

  /**
   * Maneja el éxito de la autenticación
   */
  private handleAuthSuccess(resp: AuthResponse): boolean {
    if (!resp.ok || !resp.token) {
      return false;
    }

    // Guardar token
    this._token.set(resp.token);
    localStorage.setItem('token', resp.token);

    // Crear usuario temporal con datos básicos del login
    const userLogin: UserLogin = {
      id: resp.uid!,
      email: resp.email!,
      nombreCompleto: resp.name!,
      activo: 1,
      roles: [],
      permisos: [], // NUEVO: Inicializar permisos vacíos
      tema: resp.tema
    };

    this._user.set(userLogin);
    this._authStatus.set('authenticated');

    if (resp.tema) {
      this.themeService.setTheme(resp.tema);
    }

    // Obtener perfil completo en background para tener roles y permisos
    this.getProfile().subscribe();

    return true;
  }

  /**
   * Maneja errores de autenticación
   */
  private handleAuthError(error: any): Observable<boolean> {
    console.error('Auth error:', error);
    this.logout();
    return of(false);
  }
}
