import { Routes } from "@angular/router";
import { HomePageComponent } from "./pages/home-page/home-page/home-page.component";
import { DepartamentosPageComponent } from "./pages/departamentos-page/departamentos-page/departamentos-page.component";
import { WebFrontComponent } from "./layouts/web-front-layout/web-front/web-front.component";
import { PropietariosPageComponent } from "./pages/propietarios-page/propietarios-page/propietarios-page.component";
import { EmpleadosPageComponent } from "./pages/empleados-page/empleados-page/empleados-page.component";
import { CostosPageComponent } from "./pages/costos-page/costos-page/costos-page.component";
import { IncomesPageComponent } from "./pages/incomes-page/incomes-page/incomes-page.component";
import { NotFoundPageComponent } from "./pages/not-found-page/not-found-page/not-found-page.component";

export const webFrontRoutes: Routes = [
  {
    path: '',
    component: WebFrontComponent,
    children: [
      // Define child routes here
      {
        path:'',
        component: HomePageComponent,
      },
      {
        path: 'departamentos',
        component: DepartamentosPageComponent,
      },
      {
        path: 'propietarios',
        component: PropietariosPageComponent,
      },
      {
        path: 'empleados',
        component: EmpleadosPageComponent,
      },
      {
        path: 'costos',
        component: CostosPageComponent,
      },
      {
        path: 'incomes',
        component: IncomesPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default webFrontRoutes;
