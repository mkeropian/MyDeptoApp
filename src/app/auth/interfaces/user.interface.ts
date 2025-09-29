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

export interface UserTema {
  id: number;
  tema: string;
}

export interface Rol{
  id: number;
  nombre: string;
  descripcion: string;
}

export interface UserLogin {
  id: number;
  email: string;
  nombreCompleto: string;
  activo: number;
  roles: string[];
  avatarUrl?: string;
  tema?: string;
}


