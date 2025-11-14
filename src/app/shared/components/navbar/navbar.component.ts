// src/app/shared/components/navbar/navbar.component.ts
import { Component, computed, inject, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { UserProfilePageComponent } from "../../../web-front/pages/user-profile-page/user-profile-page.component";
import { AboutPageComponent } from '../../../web-front/pages/about-page/about-page.component';
import { RendicionesAdminPageComponent } from '../../../admin-dashboard/pages/rendiciones-admin-page/rendiciones-admin-page.component';
import { VinculacionesModalComponent } from '../vinculaciones-modal/vinculaciones-modal.component';
import { RendicionAutomaticaListComponent  } from '../rendicion-automatica-list/rendicion-automatica-list.component';
@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    UserProfilePageComponent,
    RendicionesAdminPageComponent,
    AboutPageComponent,
    VinculacionesModalComponent,
    RendicionAutomaticaListComponent
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild(UserProfilePageComponent, { static: false }) profileModal!: UserProfilePageComponent;
  @ViewChild(RendicionesAdminPageComponent, { static: false }) rendicionesModal!: RendicionesAdminPageComponent;
  @ViewChild(AboutPageComponent, { static: false }) aboutModal!: AboutPageComponent;
  @ViewChild(VinculacionesModalComponent, { static: false }) vinculacionesModal!: VinculacionesModalComponent;
  @ViewChild(RendicionAutomaticaListComponent) rendicionAutomaticaModal!: RendicionAutomaticaListComponent;

  isDashboard = false;
  isAdminOpen = false;
  isDepartamentoOpen = false;
  isConfigOpen = false;
  isProfileOpen = false;
  isOperacionOpen = false;

  // Datos del usuario
  currentUser = computed(() => this.authService.user());
  isAdmin = computed(() => this.authService.isAdmin());

  // NUEVO: URL del avatar usando el computed del AuthService
  userAvatarUrl = computed(() => this.authService.userAvatarUrl());

  // NUEVO: Método helper para obtener avatar por defecto (accesible desde template)
  getDefaultAvatarUrl = computed(() =>
    this.authService.getDefaultAvatarUrl(this.currentUser()?.nombreCompleto || 'Usuario')
  );

  // Permisos específicos para el navbar
  tieneDashboardEstadisticas = computed(() => this.authService.tienePermiso('dashboard.estadisticas'));
  tieneDashboardDepartamentos = computed(() => this.authService.tienePermiso('dashboard.departamentos'));
  tieneDashboardPropietarios = computed(() => this.authService.tienePermiso('dashboard.propietarios'));

  tieneCalendario = computed(() => this.authService.tienePermiso('calendario'));

  tieneDepartamentosFullmap = computed(() => this.authService.tienePermiso('departamentos.fullmap'));
  tieneDepartamentosCards = computed(() => this.authService.tienePermiso('departamentos.cards'));

  tieneOperacionGastos = computed(() => this.authService.tienePermiso('operacion.gastos'));
  tieneOperacionIngresos = computed(() => this.authService.tienePermiso('operacion.ingresos'));

  tieneAdministracionDepartamentos = computed(() => this.authService.tienePermiso('administracion.departamentos'));
  tieneAdministracionPropietarios = computed(() => this.authService.tienePermiso('administracion.propietarios'));
  tieneAdministracionRendiciones = computed(() => this.authService.tienePermiso('administracion.rendiciones'));
  tieneAdministracionRendicionesPropietarios = computed(() => this.authService.tienePermiso('administracion.rendiciones-propietarios'));

  tieneConfiguracionSistema = computed(() => this.authService.tienePermiso('configuracion.sistema'));
  tieneConfiguracionRoles = computed(() => this.authService.tienePermiso('configuracion.roles'));
  tieneConfiguracionCalendarios = computed(() => this.authService.tienePermiso('configuracion.calendarios'));
  tieneConfiguracionRendicionesAut = computed(() => this.authService.tienePermiso('configuracion.rendiciones-aut'));
  tieneConfiguracionUsuarios = computed(() => this.authService.tienePermiso('configuracion.usuarios'));

  // Permisos compuestos
  tieneAlgunPermisoDashboard = computed(() =>
    this.authService.tieneAlgunPermiso(['dashboard.estadisticas','dashboard.departamentos','dashboard.propietarios'])
  );

  tieneAlgunPermisoDepartamentos = computed(() =>
    this.authService.tieneAlgunPermiso(['departamentos.fullmap', 'departamentos.cards'])
  );

  tieneAlgunPermisoOperacion = computed(() =>
    this.authService.tieneAlgunPermiso(['operacion.gastos', 'operacion.ingresos'])
  );

  tieneAlgunPermisoAdmin = computed(() =>
    this.authService.tieneAlgunPermiso(
      ['administracion.departamentos',
      'administracion.propietarios',
      'administracion.rendiciones',
      'administracion.rendiciones-propietarios']
    )
  );

  tieneAlgunPermisoConfig = computed(() =>
    this.authService.tieneAlgunPermiso(
      ['configuracion.sistema',
      'configuracion.roles',
      'configuracion.calendarios',
      'configuracion.rendiciones-aut',
      'configuracion.usuarios']
    )
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

  toggleDepartamento() {
    this.isDepartamentoOpen = !this.isDepartamentoOpen;
    this.closeOtherDropdowns('departamentos');
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
    if (except !== 'departamentos') this.isDepartamentoOpen = false;
    if (except !== 'config') this.isConfigOpen = false;
    if (except !== 'operacion') this.isOperacionOpen = false;
    if (except !== 'dashboard') this.isDashboard = false;
  }

  onMenuItemClick() {
    this.isAdminOpen = false;
    this.isDepartamentoOpen = false;
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

  // Método para manejar error al cargar avatar
  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.getDefaultAvatarUrl();
  }

  onVinculacionesClick() {
    this.onMenuItemClick();
    if (this.vinculacionesModal) {
      this.vinculacionesModal.open();
    }
  }

  onRendicionAutomaticaClick() {
    this.onMenuItemClick();

    // Abrir el modal usando el DOM nativo (patrón DaisyUI)
    const modal = document.getElementById('rendicion_automatica_main_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }
}
