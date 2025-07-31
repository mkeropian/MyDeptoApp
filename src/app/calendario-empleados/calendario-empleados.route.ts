import { Routes } from "@angular/router";
import { CalendarioEmpleadosComponent } from "./layouts/calendario-empleados/calendario-empleados.component";
import { CalendarioEmpleadosPageComponent } from "./pages/calendario-empleados-page/calendario-empleados-page.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";


export const calendarioEmpleadosRoutes: Routes = [
  {
    path: '',
    component: CalendarioEmpleadosComponent,
    children: [
      {
        path:'',
        component: CalendarioEmpleadosPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default calendarioEmpleadosRoutes;
