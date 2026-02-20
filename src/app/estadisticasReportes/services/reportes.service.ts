import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { FiltrosReporteEmpleados, ResumenEmpleado } from "../interfaces/reporte-empleado.interface";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class ReportesService {
  private http = inject(HttpClient);

  getReporteEmpleados(filtros: FiltrosReporteEmpleados): Observable<ResumenEmpleado[]> {
    return this.http.post<any>(`${baseUrl}/estadisticasReportes/empleados`, filtros).pipe(
      map(response => response.data || [])
    );
  }

  exportarExcel(filtros: FiltrosReporteEmpleados): Observable<Blob> {
    return this.http.post(`${baseUrl}/estadisticasReportes/empleados/export/excel`, filtros, {
      responseType: 'blob'
    });
  }

  exportarPDF(filtros: FiltrosReporteEmpleados): Observable<Blob> {
    return this.http.post(`${baseUrl}/estadisticasReportes/empleados/export/pdf`, filtros, {
      responseType: 'blob'
    });
  }

  enviarEmail(filtros: FiltrosReporteEmpleados, emails: string[], formato: 'excel' | 'pdf' , mensaje?: string): Observable<any> {
    return this.http.post(`${baseUrl}/estadisticasReportes/empleados/enviar-email`, {
      filtros,
      emails,
      formato,
      mensaje
    });
  }
}
