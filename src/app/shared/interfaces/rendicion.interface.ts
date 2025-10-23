

export interface RendicionMovimiento {
  fecha: string;
  departamento: string;
  propietario: string;
  tipoOperacion: 'Ingreso' | 'Gasto';
  categoria: string;
  monto: number;
  observaciones: string;
}

export interface RendicionFiltros {
  idsPropietario?: number[];
  idsDepartamentos: number[];
  tipoPeriodo: 'diario' | 'mensual';
  fecha?: string; // YYYY-MM-DD para diario
  anio?: number;  // Para mensual
  mes?: number;   // Para mensual (1-12)
}

export interface RendicionResumen {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  cantidadMovimientos: number;
}
