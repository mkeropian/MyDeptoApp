import { Rol } from "./user.interface";

export interface Permiso {
  id: number;
  nombre_vista: string;
  desc_vista: string;
}

export interface RolConPermisos extends Rol {
  permisos?: Permiso[];
}
