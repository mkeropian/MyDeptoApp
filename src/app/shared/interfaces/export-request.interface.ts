// src/app/shared/interfaces/export-request.interface.ts

export interface ExportRequest {
  filterType: 'owner' | 'department'; // Por propietario o departamento
  reportType: 'daily' | 'monthly'; // Diario o mensual
  fileFormat: 'csv' | 'excel'; // Formato del archivo
  fileName: string; // Nombre del archivo generado

  // Para reporte diario
  selectedDate?: string; // YYYY-MM-DD

  // Para reporte mensual
  month?: number; // 1-12
  year?: number;

  // Selecciones múltiples
  departments?: number[]; // IDs de departamentos
  owners?: number[]; // IDs de propietarios
}
