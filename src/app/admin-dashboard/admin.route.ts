import { Routes } from "@angular/router";
import { AdminComponent } from "./layouts/admin-layout/admin/admin.component";
import { ThemesSettingsPageComponent } from "./pages/settings/themes-settings-page/themes-settings-page.component";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";
import { DepartamentosAdminPageComponent } from "./pages/departamentos-admin-page/departamentos-admin-page.component";
import { PropietariosAdminPageComponent } from "./pages/propietarios-admin-page/propietarios-admin-page.component";
import { RolesSettingsPageComponent } from "./pages/settings/roles-settings-page/roles-settings-page.component";
import { PermisosRolesSettingsPageComponent } from "./pages/settings/permisos-roles-settings-page/permisos-roles-settings-page.component";
import { UserPageComponent } from "./pages/user-page/user-page.component";
import { GastosAdminPageComponent } from "./pages/gastos-admin-page/gastos-admin-page.component";
import { IngresosAdminPageComponent } from "./pages/ingresos-admin-page/ingresos-admin-page.component";
import { RendicionesAdminPageComponent } from "./pages/rendiciones-admin-page/rendiciones-admin-page.component";
import { CalendarSettingsPageComponent } from "./pages/settings/calendar-settings-page/calendar-settings-page.component";


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
        component: UserPageComponent,
      },
      {
        path:'admin-gastos',
        component: GastosAdminPageComponent,
      },
      {
        path:'admin-ingresos',
        component: IngresosAdminPageComponent,
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
        path:'calendar-settings',
        component: CalendarSettingsPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default adminRoutes;
