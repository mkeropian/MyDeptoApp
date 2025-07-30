import { Routes } from "@angular/router";
import { DashboardComponent } from "./layouts/dashboard-layout/dashboard/dashboard.component";
import { DashboardPageComponent } from "./pages/dashboard-page/dashboard-page.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";

export const DashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      // Define child routes here
      {
        path:'',
        component: DashboardPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default DashboardRoutes;
