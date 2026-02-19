export interface Pago {
  id: number;
  idTipoPago: number;
  idDep: number;
  monto: number;
  fecha: string;
  observaciones: string;
  idEmpleado?: number; // NUEVO: Campo opcional para empleado
}

export interface PagoGrid {
  id: number;
  idTipoPago: number;
  descripcion: string;
  idDep: number;
  nombre: string;
  monto: number;
  fecha: string;
  observaciones: string;
  idEmpleado?: number; // NUEVO: ID del empleado asignado
  empleadoNombre?: string; // NUEVO: Nombre del empleado
  requiere_empleado?: number; // NUEVO: Flag del tipo de pago
}

export interface TipoPago {
  descripcion: string;
  activo: number;
  id: number;
  requiere_empleado?: number; // NUEVO: Flag si requiere empleado
}

// Interface para empleados (reutilizamos la misma que en gastos)
export interface Empleado {
  id: number;
  usuario: string;
  nombreCompleto: string;
  email: string;
  avatarUrl?: string;
}
