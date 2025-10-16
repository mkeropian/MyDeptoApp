// src/app/auth/interfaces/user.interface.ts

export interface User {
  id: number;
  usuario: string;
  nombreCompleto: string;
  email: string;
  clave: string;
  activo: number;
  avatarUrl?: string;
  tema?: string;
}

// NUEVA: Interfaz para crear usuario con rol
export interface CreateUserRequest {
  usuario: string;
  nombreCompleto: string;
  email: string;
  clave: string;
  activo: number;
  avatarUrl?: string;
  tema?: string;
  rolId: number; // El campo del rol
}

export interface UserTema {
  id: number;
  tema: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface UserLogin {
  id: number;
  usuario?: string;
  email: string;
  nombreCompleto: string;
  activo: number;
  roles: string[];
  permisos: string[];  // NUEVO: Array de permisos del usuario
  avatarUrl?: string;
  tema?: string;
}
