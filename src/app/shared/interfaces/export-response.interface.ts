// NOMBRE: export-response.interface.ts
// UBICACIÓN: src/app/interfaces/export-response.interface.ts

export interface ExportResponse {
  success: boolean;
  message?: string;
  data?: {
    totalRecords: number;
    fileName: string;
    fileSize?: string;
    generatedAt: string;
  };
  error?: string;
}
