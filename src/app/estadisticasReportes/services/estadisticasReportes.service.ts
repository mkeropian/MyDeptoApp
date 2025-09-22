import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { PagoGrid } from "../../incomes/interfaces/incomes.interface";
import { GastoGrid } from "../../gastos/interfaces/gasto.interface";
import { rendDepGrid, rendPropGrid } from "../interfaces/estadisticasReportes.interface";


const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class EstadisticasReportesService  {
  private http = inject(HttpClient);

  getPagos() {
    return this.http.get<PagoGrid[]>(`${baseUrl}/estadisticasReportes/getPagos`);
  }

  getGastos() {
    return this.http.get<GastoGrid[]>(`${baseUrl}/estadisticasReportes/getGastos`);
  }

  getRendDiarioDep() {
    return this.http.get<rendDepGrid[]>(`${baseUrl}/estadisticasReportes/rendDep`);
  }

  getRendDiarioProp() {
    return this.http.get<rendPropGrid[]>(`${baseUrl}/estadisticasReportes/rendProp`);
  }

}
