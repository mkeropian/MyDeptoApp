

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RendicionMovimiento, RendicionFiltros } from '../interfaces/rendicion.interface';
import { Departamento } from '../../departamentos/interfaces/departamento.interface';
import { ExportApiService } from '../../shared/services/export-api.service';
import { ExportRequest } from '../../shared/interfaces/export-request.interface';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class RendicionesService {
  private http = inject(HttpClient);
  private exportApiService = inject(ExportApiService);

  getDepartamentosByPropietario(idPropietario: number): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${baseUrl}/departamentos/by-propietario/${idPropietario}`);
  }

  getPropietarioByUsuario(idUser: number): Observable<{ idPropietario: number }> {
    return this.http.get<{ idPropietario: number }>(`${baseUrl}/usuarios/${idUser}/propietario`);
  }

  getMovimientos(filtros: RendicionFiltros): Observable<RendicionMovimiento[]> {
    const body = this.buildRequestBody(filtros);
    return this.http.post<RendicionMovimiento[]>(`${baseUrl}/export/movimientos`, body);
  }

  exportToExcel(filtros: RendicionFiltros): Observable<Blob> {
    const exportRequest: ExportRequest = {
      tipoReporte: 'propietario',
      idPropietario: filtros.idsPropietario?.[0],
      fileFormat: 'excel'
    };

    // MODIFICADO: Usar el primer departamento si es exportación individual
    // o todos si es exportación general
    if (filtros.idsDepartamentos.length === 1) {
      exportRequest.idDepartamento = filtros.idsDepartamentos[0];
      exportRequest.tipoReporte = 'departamento';
    } else {
      // Para múltiples departamentos, enviar el primer ID por compatibilidad
      // El backend recibirá los datos y los filtrará en el frontend
      exportRequest.idDepartamento = filtros.idsDepartamentos[0];
      exportRequest.tipoReporte = 'departamento';
    }

    if (filtros.tipoPeriodo === 'diario' && filtros.fecha) {
      exportRequest.fecha = filtros.fecha;
    } else if (filtros.tipoPeriodo === 'mensual' && filtros.anio && filtros.mes) {
      const fechaDesde = `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(filtros.anio, filtros.mes, 0).getDate();
      const fechaHasta = `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

      exportRequest.fechaDesde = fechaDesde;
      exportRequest.fechaHasta = fechaHasta;
    }

    return this.exportApiService.exportToExcel(exportRequest);
  }

  downloadExcel(blob: Blob, filtros: RendicionFiltros): void {
    const periodo = filtros.tipoPeriodo === 'diario'
      ? filtros.fecha
      : `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}`;

    const fileName = `rendicion_${periodo}_${Date.now()}`;
    this.exportApiService.downloadFile(blob, fileName, 'xlsx');
  }

  private buildRequestBody(filtros: RendicionFiltros): any {
    const body: any = {
      idsDepartamentos: filtros.idsDepartamentos
    };

    if (filtros.tipoPeriodo === 'diario' && filtros.fecha) {
      body.fecha = filtros.fecha;
    } else if (filtros.tipoPeriodo === 'mensual' && filtros.anio && filtros.mes) {
      const fechaDesde = `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(filtros.anio, filtros.mes, 0).getDate();
      const fechaHasta = `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

      body.fechaDesde = fechaDesde;
      body.fechaHasta = fechaHasta;
    }

    return body;
  }
}
