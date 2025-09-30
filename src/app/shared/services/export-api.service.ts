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
   * Endpoint: POST /api/export/rendicioncsv
   */
  exportToCSV(request: ExportRequest): Observable<Blob> {
    const url = `${baseUrl}/export/rendicioncsv`;
    const body = this.buildRequestBody(request);

    return this.http.post(url, body, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  /**
   * Exportar rendiciones a formato Excel
   * Endpoint: POST /api/export/rendicionexcel
   */
  exportToExcel(request: ExportRequest): Observable<Blob> {
    const url = `${baseUrl}/export/rendicionexcel`;
    const body = this.buildRequestBody(request);

    return this.http.post(url, body, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  /**
   * Construir el body de la petición según la estructura del backend
   */
  private buildRequestBody(request: ExportRequest): any {
    const body: any = {
      tipoReporte: request.tipoReporte
    };

    // Agregar ID según el tipo de reporte
    if (request.tipoReporte === 'departamento') {
      body.idDepartamento = request.idDepartamento;
    } else if (request.tipoReporte === 'propietario') {
      body.idPropietario = request.idPropietario;
    }

    // Agregar fechas según el tipo
    if (request.fecha) {
      // Reporte diario
      body.fecha = request.fecha;
    } else if (request.fechaDesde && request.fechaHasta) {
      // Reporte mensual
      body.fechaDesde = request.fechaDesde;
      body.fechaHasta = request.fechaHasta;
    }

    return body;
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
