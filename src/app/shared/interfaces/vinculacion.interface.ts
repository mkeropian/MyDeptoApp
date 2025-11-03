export interface Vinculacion {
  // Usuario
  usuarioId: number;
  usuarioCodigo: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioAvatar: string;
  rolId: number;
  rolNombre: string;

  // Propietario
  propietarioId: number;
  propietarioNombre: string;
  propietarioDni: string;
  propietarioAvatar: string;
  propietarioActivo: number;

  // Departamentos (se cargan después)
  departamentos?: DepartamentoSimple[];
}

export interface DepartamentoSimple {
  id: number;
  nombre: string;
  activo: number;
}
