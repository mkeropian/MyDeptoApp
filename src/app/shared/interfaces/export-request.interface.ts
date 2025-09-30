// src/app/shared/interfaces/export-request.interface.ts

export interface ExportRequest {
  // Tipo de reporte según backend
  tipoReporte: 'departamento' | 'propietario';

  // Formato del archivo (para uso interno del frontend)
  fileFormat?: 'csv' | 'excel';

  // Para reporte por departamento
  idDepartamento?: number;

  // Para reporte por propietario
  idPropietario?: number;

  // Para reporte diario
  fecha?: string; // Formato: YYYY-MM-DD

  // Para reporte mensual
  fechaDesde?: string; // Formato: YYYY-MM-DD
  fechaHasta?: string;  // Formato: YYYY-MM-DD
}
