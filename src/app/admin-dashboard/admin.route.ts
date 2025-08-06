import { Routes } from "@angular/router";
import { AdminComponent } from "./layouts/admin-layout/admin/admin.component";
import { SettingsPageComponent } from "./pages/settings-page/settings-page.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";
import { UserPageComponent } from "./pages/user-page/user-page.component";
import { DepartamentosAdminPageComponent } from "./pages/departamentos-admin-page/departamentos-admin-page.component";

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path:'admin-departamentos',
        component: DepartamentosAdminPageComponent,
      },
      {
        path:'settings',
        component: SettingsPageComponent,
      },
      {
        path:'users',
        component: UserPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default adminRoutes;
