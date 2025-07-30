import { Routes } from "@angular/router";
import { AdminComponent } from "./layouts/admin-layout/admin/admin.component";
import { AdminPageComponent } from "./pages/admin-page/admin-page.component";
import { SettingsPageComponent } from "./pages/settings-page/settings-page.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      // Define child routes here
      {
        path:'',
        component: AdminPageComponent,
      },
      {
        path:'settings',
        component: SettingsPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default adminRoutes;
