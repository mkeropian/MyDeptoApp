import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { environment } from "../../../environments/environment";
import { Departamento, DepartamentoBackend } from "../interfaces/departamento.interface";
import { Observable } from "rxjs";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class DepartamentosService {
  private http = inject(HttpClient);
  baseUrl: any;

  getDepartamentos() {
    return this.http.get<Departamento[]>(`${baseUrl}/departamentos/all`);
  }

  getDepartamentosRaw(): Observable<DepartamentoBackend[]> {
    return this.http.get<DepartamentoBackend[]>(`${baseUrl}/departamentos/all`);
  }

  getDepartamentosActivos() {
    return this.http.get<Departamento[]>(`${baseUrl}/departamentos/allActives`);
  }

  getDepartamentosRawActivos(): Observable<DepartamentoBackend[]> {
    return this.http.get<DepartamentoBackend[]>(`${baseUrl}/departamentos/allActives`);
  }

  createDepartamento(departamento: Partial<DepartamentoBackend>) {
    return this.http.put<DepartamentoBackend>(`${baseUrl}/departamentos`, departamento);
  }

  updateDepartamento(id: number, departamento: Partial<DepartamentoBackend>): Observable<DepartamentoBackend> {
    return this.http.post<DepartamentoBackend>(`${baseUrl}/departamentos/${id}`, departamento);
  }

  // NUEVO: Toggle activo/inactivo
  toggleActivo(id: number): Observable<{ id: number; activo: number }> {
    return this.http.patch<{ id: number; activo: number }>(`${baseUrl}/departamentos/${id}/toggle-activo`, {});
  }

}
