// src/app/auth/pages/login-page/login-page.component.ts
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Signals para el manejo del estado
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  loginError = signal<string>('');

  // FormGroup para el formulario de login
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]], // Cambiado de 'email' a 'usuario'
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Getter para acceder fácilmente al control 'usuario'
  get usuario() {
    return this.loginForm.get('usuario');
  }

  // Getter para acceder fácilmente al control 'password'
  get password() {
    return this.loginForm.get('password');
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  /**
   * Maneja el evento de submit del formulario
   */
  onSubmit(): void {
    // Limpiar error previo
    this.loginError.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.loginError.set('Por favor completa todos los campos correctamente');
      return;
    }

    const { usuario, password } = this.loginForm.value;

    this.isLoading.set(true);

    this.authService
      .login(usuario, password)
      .subscribe({
        next: (isAuthenticated) => {
          this.isLoading.set(false);

          if (isAuthenticated) {
            // Login exitoso - redirigir al dashboard
            this.router.navigateByUrl('/home');
          } else {
            // Login falló pero sin error HTTP
            this.loginError.set('Credenciales inválidas');
          }
        },
        error: (error) => {
          this.isLoading.set(false);

          // Manejar diferentes tipos de errores
          if (error.status === 400) {
            this.loginError.set('Usuario o contraseña incorrectos');
          } else if (error.status === 0) {
            this.loginError.set('No se puede conectar con el servidor');
          } else {
            this.loginError.set('Error en el inicio de sesión. Intenta nuevamente');
          }

          console.error('Error en login:', error);
        }
      });
  }

  /**
   * Maneja el evento de olvidar contraseña
   */
  onForgotPassword(event: Event): void {
    event.preventDefault();
    // TODO: Implementar lógica de recuperación de contraseña
    console.log('Recuperar contraseña');
    // this.router.navigateByUrl('/auth/forgot-password');
  }
}
