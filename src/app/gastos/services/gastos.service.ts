import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Gasto } from "../interfaces/gasto.interface";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class GastosService {
  private http = inject(HttpClient);

  //TODO
  // getTipoGastos

  getGastos() {
    return this.http.get<Gasto[]>(`${baseUrl}/gastos/all`);
  }

  createGasto(gastoLike: Partial<Gasto>): Observable<Gasto> {
    return this.http.put<Gasto>(`${baseUrl}/gasto`, gastoLike);
  }
}
