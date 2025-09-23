// NOMBRE: export-api.service.ts
// UBICACIÓN: src/app/services/export-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ExportRequest } from '../interfaces/export-request.interface';


@Injectable({
  providedIn: 'root'
})
export class ExportApiService {

  // Usar tu baseUrl único (puerto 3050)
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Exportar datos a CSV
   */
  exportToCSV(request: ExportRequest): Observable<any> {
    const url = `${this.baseUrl}/export/csv`;

    console.log('📄 Enviando petición para exportar CSV:', request);

    return this.http.post(url, request, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('📄 Respuesta CSV recibida');
        this.downloadFile(response, request.fileName + '.csv');
      })
    );
  }

  /**
   * Exportar datos a Excel
   */
  exportToExcel(request: ExportRequest): Observable<any> {
    const url = `${this.baseUrl}/export/excel`;

    console.log('📊 Enviando petición para exportar Excel:', request);

    return this.http.post(url, request, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('📊 Respuesta Excel recibida');
        this.downloadFile(response, request.fileName + '.xlsx');
      })
    );
  }

  /**
   * Probar conexión con el backend
   */
  testConnection(): Observable<any> {
    const url = `${this.baseUrl}/test`;
    return this.http.get(url);
  }

  /**
   * Descargar archivo desde la respuesta HTTP
   */
  private downloadFile(response: HttpResponse<Blob>, defaultFileName: string): void {
    const blob = response.body;
    if (!blob) {
      console.error('❌ No se recibió contenido del archivo');
      return;
    }

    // Intentar obtener el nombre del archivo de los headers
    const contentDisposition = response.headers.get('content-disposition');
    let fileName = defaultFileName;

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }

    console.log(`💾 Descargando archivo: ${fileName}`);

    // Crear URL del blob y descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    // Agregar al DOM, hacer click y limpiar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Descarga iniciada exitosamente');
  }
}
