export interface MovimientoEmpleado {
  id: number;
  tipo: 'gasto' | 'pago';
  fecha: string;
  idEmpleado: number;
  empleadoNombre: string;
  idDep: number;
  departamentoNombre: string;
  idTipo: number;
  tipoDescripcion: string;
  monto: number;
  observaciones?: string;
}

export interface ResumenEmpleado {
  idEmpleado: number;
  nombreEmpleado: string;
  cantidadGastos: number;
  totalGastos: number;
  cantidadPagos: number;
  totalPagos: number;
  balance: number;
  movimientos: MovimientoEmpleado[];
}

export interface FiltrosReporteEmpleados {
  idEmpleado?: number;
  idDepartamento?: number;
  tipoOperacion?: 'todos' | 'gastos' | 'pagos';
  idCategoria?: number;
  fechaDesde: string;
  fechaHasta: string;
}

export interface MetricasReporte {
  totalOperaciones: number;
  totalGastos: number;
  totalPagos: number;
  balance: number;
}
