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

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class AuthService {

  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<UserLogin | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));

  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    // Constructor vacío, las inyecciones ya están arriba
  }

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
  isAdmin = computed(() => this._user()?.roles?.includes('admin') ?? false);
  isAuthenticated = computed(() => this.authStatus() === 'authenticated');

  /**
   * Login con usuario o email
   * @param usuarioOrEmail - Puede ser el username o el email
   * @param password - Contraseña del usuario
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
   * Obtiene el perfil completo del usuario con roles
   */
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${baseUrl}/auth/profile`)
      .pipe(
        tap((resp) => {
          if (resp.ok && resp.usuario) {
            this._user.set(resp.usuario);
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
    localStorage.removeItem('token');

    // Navegar a la página de login
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
      roles: [] // Se llenará al obtener el perfil completo
    };

    this._user.set(userLogin);
    this._authStatus.set('authenticated');

    // Obtener perfil completo en background para tener roles
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

  /**
   * LEGACY - Mantener para compatibilidad con código existente
   * @deprecated Use login() instead
   */
  regUser(email: string, password: string, fullName: string): Observable<boolean> {
    // Este método puede mantenerse si tienes un endpoint de registro
    // O eliminarlo si no lo usas
    return of(false);
  }
}
