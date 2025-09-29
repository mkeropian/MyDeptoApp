// src/app/shared/services/export-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExportRequest } from '../interfaces/export-request.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ExportApiService {

  constructor(private http: HttpClient) {}

  /**
   * Exportar rendiciones a formato CSV
   */
  exportToCSV(request: ExportRequest): Observable<Blob> {
    const url = `${baseUrl}/reports/export/csv`;

    return this.http.post(url, request, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  /**
   * Exportar rendiciones a formato Excel
   */
  exportToExcel(request: ExportRequest): Observable<Blob> {
    const url = `${baseUrl}/reports/export/excel`;

    return this.http.post(url, request, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  /**
   * Método genérico para exportar (detecta el formato automáticamente)
   */
  export(request: ExportRequest): Observable<Blob> {
    if (request.fileFormat === 'csv') {
      return this.exportToCSV(request);
    } else {
      return this.exportToExcel(request);
    }
  }

  /**
   * Descargar archivo blob con nombre específico
   */
  public downloadFile(blob: Blob, fileName: string, fileExtension: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${fileExtension}`;

    // Simular click para descargar
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
