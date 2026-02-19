import { Routes } from "@angular/router";
import { DashboardComponent } from "./layouts/dashboard-layout/dashboard/dashboard.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";
import { DashboardPropietariosPageComponent } from "./pages/dashboard-propietarios-page/dashboard-propietarios-page.component";
import { DashboardDepartamentosPageComponent } from "./pages/dashboard-departamentos-page/dashboard-departamentos-page.component";
import { DashboardEstadisticasPageComponent } from "./pages/dashboard-estadisticas-page/dashboard-estadisticas-page.component";
import { GastosDepartamentosPageComponent } from "./pages/dashboard-estadisticas-page/gastosDepartamentos-page/gastosDepartamentos-page.component";
import { RendimientoDepartamentosPageComponent } from "./pages/dashboard-estadisticas-page/rendimientoDepartamentos-page/rendimientoDepartamentos-page.component";
import { IngresosDepartamentosPageComponent } from "./pages/dashboard-estadisticas-page/ingresosDepartamentos-page/ingresosDepartamentos-page.component";
import { RendimientoMensualDepartamentosPageComponent } from "./pages/dashboard-estadisticas-page/rendimientoMensualDepartamentos-page/rendimientoMensualDepartamentos-page.component";
import { RendimientoPropietariosPageComponent } from "./pages/dashboard-estadisticas-page/rendimientoPropietarios-page/rendimientoPropietarios-page.component";
import { RendimientoMensualPropietariosPageComponent } from "./pages/dashboard-estadisticas-page/rendimientoMensualPropietarios-page/rendimientoMensualPropietarios-page.component";
import { IngresosRankingMensualDepartamentosPageComponent } from "./pages/dashboard-estadisticas-page/ingresosRankingMensualDepartamentos-page/ingresosRankingMensualDepartamentos-page.component";
import { RecaudacionMensualPageComponent } from "./pages/dashboard-estadisticas-page/recaudacionMensual-page/recaudacionMensual-page.component";
import { DisgregacionGastosPageComponent } from "./pages/dashboard-estadisticas-page/disgregacionGastos-page/disgregacionGastos-page.component";
import { ReporteEmpleadosPageComponent } from "./pages/dashboard-estadisticas-page/reporteEmpleados-page/reporteEmpleados-page.component";

export const DashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      // Defino rutas hijas
      {
        path:'departamentos',
        component: DashboardDepartamentosPageComponent,
      },
      {
        path:'propietarios',
        component: DashboardPropietariosPageComponent,
      },
      {
        path:'estadisticas',
        component: DashboardEstadisticasPageComponent,
      },
      {
        path:'pagosxdep',
        component: IngresosDepartamentosPageComponent,
      },
      {
        path:'gastosxdep',
        component: GastosDepartamentosPageComponent,
      },
      {
        path:'rendimientodep',
        component: RendimientoDepartamentosPageComponent,
      },
      {
        path:'rendimientoprop',
        component: RendimientoPropietariosPageComponent,
      },
      {
        path:'rendimientomesdep',
        component: RendimientoMensualDepartamentosPageComponent,
      },
      {
        path:'rendimientomesprop',
        component: RendimientoMensualPropietariosPageComponent,
      },
      {
        path:'ingrankingmesdep',
        component: IngresosRankingMensualDepartamentosPageComponent,
      },
      {
        path:'recaudacionmensual',
        component: RecaudacionMensualPageComponent,
      },
      {
        path:'disgregaGastos',
        component: DisgregacionGastosPageComponent,
      },
      {
        path:'reporteEmpleados',
        component: ReporteEmpleadosPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default DashboardRoutes;
