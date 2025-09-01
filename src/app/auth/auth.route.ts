import { Routes } from "@angular/router";

import { NotFoundPageComponent } from "../shared/pages/not-found-page/not-found-page.component";
import { AuthComponent } from "./layouts/auth/auth.component";
import { LoginPageComponent } from "./pages/login-page/login-page.component";

export const AuthRoutes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path:'login',
        component: LoginPageComponent,
      },
      {
        path: '**',
        component: NotFoundPageComponent,
      },
    ],
  },
];

export default AuthRoutes;
