import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Propietario } from "../interfaces/propietario.interface";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class PropietariosService {
  private http = inject(HttpClient);

  getPropietarios() {
    return this.http.get<Propietario[]>(`${baseUrl}/propietarios/all`);
  }

  getPropietariosActivos() {
    return this.http.get<Propietario[]>(`${baseUrl}/propietarios/allActives`);
  }

  createPropietario(propietarioLike: Partial<Propietario>): Observable<Propietario> {
    return this.http.put<Propietario>(`${baseUrl}/propietarios`, propietarioLike);
  }
}
