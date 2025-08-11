import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { environment } from "../../../environments/environment";
import { Departamento } from "../interfaces/departamento.interface";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class DepartamentosService {
  private http = inject(HttpClient);

  getDepartamentos() {
    return this.http.get<Departamento[]>(`${baseUrl}/departamento/all`);
  }
}
