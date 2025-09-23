// NOMBRE: export-request.interface.ts
// UBICACIÓN: src/app/interfaces/export-request.interface.ts

export interface ExportRequest {
  month: number;
  year: number;
  departments: string[];
  owners: string[];
  fileFormat: 'csv' | 'excel';
  fileName: string;
}
