import { Routes } from "@angular/router";
import { DashboardComponent } from "./layouts/dashboard-layout/dashboard/dashboard.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";
import { DashboardPropietariosPageComponent } from "./pages/dashboard-propietarios-page/dashboard-propietarios-page.component";
import { DashboardDepartamentosPageComponent } from "./pages/dashboard-departamentos-page/dashboard-departamentos-page.component";
import { DashboardEstadisticasPageComponent } from "./pages/dashboard-estadisticas-page/dashboard-estadisticas-page.component";

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
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default DashboardRoutes;
