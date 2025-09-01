import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Interfaz para las credenciales de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Interfaz para la respuesta del login
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    nombre: string;
    avatar?: string;
  };
  message?: string;
}

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Signals para el manejo del estado
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  loginError = signal<string>('');

  // FormGroup para el formulario de login
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  /**
   * Maneja el submit del formulario de login
   */
  async onLogin(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.loginError.set('');

      try {
        const credentials: LoginCredentials = this.loginForm.value;
        
        // Simular llamada al servicio de autenticación
        const response = await this.authenticateUser(credentials);
        
        if (response.success) {
          // Guardar token y datos del usuario
          this.saveAuthData(response);
          
          // Mostrar mensaje de éxito (opcional)
          console.log('Login exitoso:', response.user);
          
          // Redirigir al dashboard o página principal
          await this.router.navigate(['/admin']);
          
        } else {
          this.loginError.set(response.message || 'Credenciales inválidas');
        }
        
      } catch (error) {
        console.error('Error durante el login:', error);
        this.loginError.set('Error de conexión. Intente nuevamente.');
        
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Simula la autenticación del usuario (reemplazar con servicio real)
   */
  private async authenticateUser(credentials: LoginCredentials): Promise<LoginResponse> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular validación (reemplazar con tu lógica de autenticación)
    const validUsers = [
      { email: 'admin@mydeptoapp.com', password: '123456', nombre: 'Administrador' },
      { email: 'user@mydeptoapp.com', password: 'password', nombre: 'Usuario Test' },
      { email: 'demo@demo.com', password: 'demo123', nombre: 'Usuario Demo' }
    ];
    
    const user = validUsers.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );
    
    if (user) {
      return {
        success: true,
        token: 'jwt-token-example-' + Date.now(),
        user: {
          id: Math.random().toString(36).substr(2, 9),
          email: user.email,
          nombre: user.nombre,
          avatar: ''
        }
      };
    }
    
    return {
      success: false,
      message: 'Email o contraseña incorrectos'
    };
  }

  /**
   * Guarda los datos de autenticación en localStorage
   */
  private saveAuthData(response: LoginResponse): void {
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    if (response.user) {
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
  }

  /**
   * Maneja el click en "Olvidé mi contraseña"
   */
  onForgotPassword(event: Event): void {
    event.preventDefault();
    // Redirigir a página de recuperación de contraseña
    // O mostrar modal de recuperación
    console.log('Recuperar contraseña');
    // this.router.navigate(['/auth/forgot-password']);
  }

  /**
   * Marca todos los campos como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Getters para facilitar el acceso a los controles en el template
   */
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}