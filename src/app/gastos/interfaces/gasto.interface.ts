export interface Gasto {
  id: number;
  idTipoGasto: number;
  idDep: number;
  monto: number;
  fecha: string;
  observaciones: string;
  idEmpleado?: number; // NUEVO: Campo opcional para empleado
}

export interface GastoGrid {
  id: number;
  idTipoGasto: number;
  descripcion: string;
  idDep: number;
  nombre: string;
  monto: number;
  fecha: string;
  observaciones: string;
  idProp?: number;
  nombreApellido?: string;
  idEmpleado?: number; // NUEVO: ID del empleado asignado
  empleadoNombre?: string; // NUEVO: Nombre del empleado
  requiere_empleado?: number; // NUEVO: Flag del tipo de gasto
}

export interface TipoGasto {
  descripcion: string;
  activo: number;
  id: number;
  requiere_empleado?: number; // NUEVO: Flag si requiere empleado
}

// NUEVA: Interface para empleados
export interface Empleado {
  id: number;
  usuario: string;
  nombreCompleto: string;
  email: string;
  avatarUrl?: string;
}
