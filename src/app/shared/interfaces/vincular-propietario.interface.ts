export interface VinculacionUsuarioPropietario {
  idUser: number;
  idPropietario: number;
  usuario?: string;
  nombreCompleto?: string;
  propietarioNombre?: string;
}

export interface VinculacionResponse {
  ok: boolean;
  msg: string;
  data?: {
    idUser: number;
    idPropietario: number;
    accion: 'creado' | 'actualizado';
  };
}
