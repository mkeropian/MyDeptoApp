// src/app/auth/interfaces/auth-response.interface.ts

import { UserLogin } from "./user.interface";

// Respuesta del backend para login
export interface AuthResponse {
  ok: boolean;
  uid?: number;
  name?: string;
  usuario?: string;
  email?: string;
  tema?: string;
  avatarUrl?: string;
  token?: string;
  msg?: string;
  errors?: any;
}

// Credenciales de login - ACTUALIZADO para soportar usuario o email
export interface LoginCredentials {
  usuario: string; // Puede ser username o email
  password: string;
}

// Respuesta de perfil completo
export interface ProfileResponse {
  ok: boolean;
  usuario?: UserLogin;
  msg?: string;
}

// Request para cambiar contraseña
export interface ChangePasswordRequest {
  passwordActual: string;
  passwordNuevo: string;
}

// Respuesta genérica de la API
export interface ApiResponse {
  ok: boolean;
  msg: string;
}

// Para renovar token
export interface RenewTokenResponse extends AuthResponse {}

// Para validar token
export interface ValidateTokenResponse {
  ok: boolean;
  uid: number;
  name: string;
  msg?: string;
}
