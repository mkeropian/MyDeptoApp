import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Pago, PagoGrid, TipoPago } from "../interfaces/incomes.interface";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class PagosService {
  private http = inject(HttpClient);

  getTipoPago(){
    return this.http.get<TipoPago[]>(`${baseUrl}/pagos/tipos`);
  }

  getPagos() {
    return this.http.get<PagoGrid[]>(`${baseUrl}/pagos/all`);
  }

  createPago(pagoLike: Partial<Pago>): Observable<Pago> {
    return this.http.put<Pago>(`${baseUrl}/pagos`, pagoLike);
  }
}
