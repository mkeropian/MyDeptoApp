export interface User {
  id: string;
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
