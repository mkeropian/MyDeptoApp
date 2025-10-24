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
import { CalendarSettingsPageComponent } from "./pages/settings/calendar-settings-page/calendar-settings-page.component";
import { RendicionesAdminPropPageComponent } from "./pages/rendiciones-admin-prop-page/rendiciones-admin-prop-page.component";
import { roleGuard } from "../auth/guards/auth.guard";
import { RendicionesAutoSettingsPage } from "./pages/settings/rendiciones-auto-settings-page/rendiciones-auto-settings-page.component";


export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path:'admin-departamentos',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: DepartamentosAdminPageComponent,
      },
      {
        path:'admin-propietarios',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: PropietariosAdminPageComponent,
      },
      {
        path:'admin-usuarios',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: UserPageComponent,
      },
      {
        path:'admin-gastos',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: GastosAdminPageComponent,
      },
      {
        path:'admin-ingresos',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: IngresosAdminPageComponent,
      },
      {
        path:'themes-settings',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: ThemesSettingsPageComponent,
      },
      {
        path:'roles-settings',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: RolesSettingsPageComponent,
      },
      {
        path:'settings-permisos-roles',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: PermisosRolesSettingsPageComponent,
      },
      {
        path:'calendar-settings',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: CalendarSettingsPageComponent,
      },
      {
        path:'rend-aut-settings',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora'] }, // Solo admin y gerenciadora
        component: RendicionesAutoSettingsPage,
      },
      {
        path:'rendiciones-propietarios',
        canActivate: [roleGuard],
        data: { roles: ['admin','gerenciadora','prop'] }, // Solo admin, gerenciadora y prop
        component: RendicionesAdminPropPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default adminRoutes;
