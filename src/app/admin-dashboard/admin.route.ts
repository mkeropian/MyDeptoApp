import { Routes } from "@angular/router";
import { AdminComponent } from "./layouts/admin-layout/admin/admin.component";
import { ThemesSettingsPageComponent } from "./pages/settings/themes-settings-page/themes-settings-page.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";
import { UserAdminPageComponent } from "./pages/user-page/user-page.component";
import { DepartamentosAdminPageComponent } from "./pages/departamentos-admin-page/departamentos-admin-page.component";
import { PropietariosAdminPageComponent } from "./pages/propietarios-admin-page/propietarios-admin-page.component";
import { RolesSettingsPageComponent } from "./pages/settings/roles-settings-page/roles-settings-page.component";
import { PermisosRolesSettingsPageComponent } from "./pages/settings/permisos-roles-settings-page/permisos-roles-settings-page.component";

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
        path:'admin-propietarios',
        component: PropietariosAdminPageComponent,
      },
      {
        path:'admin-usuarios',
        component: UserAdminPageComponent,
      },
      {
        path:'themes-settings',
        component: ThemesSettingsPageComponent,
      },
      {
        path:'roles-settings',
        component: RolesSettingsPageComponent,
      },
      {
        path:'settings-permisos-roles',
        component: PermisosRolesSettingsPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default adminRoutes;
