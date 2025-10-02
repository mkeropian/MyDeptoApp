// src/app/shared/services/export-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

    console.log('🔍 Exportando CSV');
    console.log('📍 URL:', url);
    console.log('📦 Body:', JSON.stringify(body, null, 2));

    return this.http.post(url, body, {
      responseType: 'blob',
      observe: 'response',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(response => {
        // Verificar si la respuesta es realmente un blob con datos
        const blob = response.body;
        if (!blob || blob.size === 0) {
          throw new Error('No se encontraron datos para exportar');
        }

        // Verificar si el blob contiene JSON (error del servidor)
        return this.checkIfBlobIsJson(blob);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Exportar rendiciones a formato Excel
   * Endpoint: POST /api/export/rendicionexcel
   */
  exportToExcel(request: ExportRequest): Observable<Blob> {
    const url = `${baseUrl}/export/rendicionexcel`;
    const body = this.buildRequestBody(request);

    console.log('🔍 Exportando Excel');
    console.log('📍 URL:', url);
    console.log('📦 Body:', JSON.stringify(body, null, 2));

    return this.http.post(url, body, {
      responseType: 'blob',
      observe: 'response',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(response => {
        // Verificar si la respuesta es realmente un blob con datos
        const blob = response.body;
        if (!blob || blob.size === 0) {
          throw new Error('No se encontraron datos para exportar');
        }

        // Verificar si el blob contiene JSON (error del servidor)
        return this.checkIfBlobIsJson(blob);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Verificar si el blob es realmente JSON (mensaje de error del servidor)
   */
  private checkIfBlobIsJson(blob: Blob): Blob {
    // Si el tipo de contenido es JSON, significa que el servidor devolvió un error
    if (blob.type === 'application/json') {
      // Leer el contenido del blob para mostrar el mensaje de error
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorResponse = JSON.parse(reader.result as string);
          throw new Error(errorResponse.error || 'No se encontraron datos para exportar');
        } catch (e) {
          throw new Error('No se encontraron datos para exportar');
        }
      };
      reader.readAsText(blob);
      throw new Error('No se encontraron datos para exportar');
    }
    return blob;
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
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido al exportar';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error instanceof Blob) {
      // El servidor devolvió un Blob que podría ser JSON con error
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorResponse = JSON.parse(reader.result as string);
          errorMessage = errorResponse.error || errorResponse.message || 'No se encontraron datos para exportar';
        } catch (e) {
          errorMessage = 'No se encontraron datos para exportar';
        }
        console.error('❌ Error del servidor:', errorMessage);
      };
      reader.readAsText(error.error);
      return throwError(() => new Error('No se encontraron datos para exportar'));
    } else {
      // Error del servidor
      errorMessage = error.error?.error || error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }

    console.error('❌ Error completo:', error);
    console.error('📍 Mensaje:', errorMessage);

    return throwError(() => new Error(errorMessage));
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
