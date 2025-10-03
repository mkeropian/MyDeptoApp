// src/app/shared/components/navbar/navbar.component.ts
import { Component, computed, inject, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { UserProfilePageComponent } from "../../../web-front/pages/user-profile-page/user-profile-page.component";
import { AboutPageComponent } from '../../../web-front/pages/about-page/about-page.component';
import { RendicionesAdminPageComponent } from '../../../admin-dashboard/pages/rendiciones-admin-page/rendiciones-admin-page.component';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    UserProfilePageComponent,
    RendicionesAdminPageComponent,
    AboutPageComponent
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild(UserProfilePageComponent, { static: false }) profileModal!: UserProfilePageComponent;
  @ViewChild(RendicionesAdminPageComponent, { static: false }) rendicionesModal!: RendicionesAdminPageComponent;
  @ViewChild(AboutPageComponent, { static: false }) aboutModal!: AboutPageComponent;

  isDashboard = false;
  isAdminOpen = false;
  isParent2Open = false;
  isConfigOpen = false;
  isProfileOpen = false;
  isOperacionOpen = false;

  // Datos del usuario
  currentUser = computed(() => this.authService.user());
  isAdmin = computed(() => this.authService.isAdmin());

  // NUEVO: Permisos específicos para el navbar
  // Estos se evalúan reactivamente cuando cambien los permisos
  tieneDashboard = computed(() => this.authService.tienePermiso('dashboard'));
  tieneDepartamentos = computed(() => this.authService.tienePermiso('departamentos'));
  tienePropietarios = computed(() => this.authService.tienePermiso('propietarios'));
  tieneCalendario = computed(() => this.authService.tienePermiso('calendario'));
  tieneGastos = computed(() => this.authService.tienePermiso('gastos'));
  tieneIngresos = computed(() => this.authService.tienePermiso('ingresos'));
  tieneReportes = computed(() => this.authService.tienePermiso('reportes'));
  tieneConfiguracion = computed(() => this.authService.tienePermiso('configuracion'));
  tieneUsuarios = computed(() => this.authService.tienePermiso('usuarios'));
  tieneRoles = computed(() => this.authService.tienePermiso('roles'));

  // Permisos compuestos - mostrar dropdown si tiene al menos uno de estos permisos
  tieneAlgunPermisoDashboard = computed(() =>
    this.authService.tieneAlgunPermiso(['dashboard', 'estadisticas', 'departamentos', 'propietarios'])
  );

  tieneAlgunPermisoDepartamentos = computed(() =>
    this.authService.tieneAlgunPermiso(['departamentos', 'departamentos.ver'])
  );

  tieneAlgunPermisoOperacion = computed(() =>
    this.authService.tieneAlgunPermiso(['gastos', 'ingresos'])
  );

  tieneAlgunPermisoAdmin = computed(() =>
    this.authService.tieneAlgunPermiso(['departamentos', 'propietarios', 'reportes'])
  );

  tieneAlgunPermisoConfig = computed(() =>
    this.authService.tieneAlgunPermiso(['configuracion', 'usuarios', 'roles'])
  );

  // Métodos para toggle de cada dropdown
  toggleAdmin() {
    this.isAdminOpen = !this.isAdminOpen;
    this.closeOtherDropdowns('admin');
  }

  toggleDashboard() {
    this.isDashboard = !this.isDashboard;
    this.closeOtherDropdowns('dashboard');
  }

  toggleOperacion() {
    this.isOperacionOpen = !this.isOperacionOpen;
    this.closeOtherDropdowns('operacion');
  }

  toggleParent2() {
    this.isParent2Open = !this.isParent2Open;
    this.closeOtherDropdowns('parent2');
  }

  toggleConfig() {
    this.isConfigOpen = !this.isConfigOpen;
    this.closeOtherDropdowns('config');
  }

  toggleProfile() {
    this.isProfileOpen = !this.isProfileOpen;
  }

  closeOtherDropdowns(except: string) {
    if (except !== 'admin') this.isAdminOpen = false;
    if (except !== 'parent2') this.isParent2Open = false;
    if (except !== 'config') this.isConfigOpen = false;
    if (except !== 'operacion') this.isOperacionOpen = false;
    if (except !== 'dashboard') this.isDashboard = false;
  }

  onMenuItemClick() {
    this.isAdminOpen = false;
    this.isParent2Open = false;
    this.isConfigOpen = false;
    this.isProfileOpen = false;
    this.isOperacionOpen = false;
    this.isDashboard = false;
  }

  onRendicionesClick() {
    this.onMenuItemClick();
    if (this.rendicionesModal) {
      this.rendicionesModal.open();
    }
  }

  onProfileClick() {
    this.onMenuItemClick();
    this.profileModal.open();
  }

  onAboutClick() {
    this.onMenuItemClick();
    if (this.aboutModal) {
      this.aboutModal.open();
    }
  }

  onLogout() {
    this.onMenuItemClick();
    this.authService.logout();
  }
}
