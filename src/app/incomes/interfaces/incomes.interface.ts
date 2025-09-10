export interface Pago {
  id: number;
  idTipoPago: number;
  idDep: number;
  monto: number;
  fecha: string;
  observaciones: string;
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
}

export interface TipoPago {
  descripcion: string;
  activo: number;
  id: number;
}

