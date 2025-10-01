export interface Gasto {
  id: number;
  idTipoGasto: number;
  idDep: number;
  monto: number;
  fecha: string;
  observaciones: string;
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
}

export interface TipoGasto {
  descripcion: string;
  activo: number;
  id: number;
}
