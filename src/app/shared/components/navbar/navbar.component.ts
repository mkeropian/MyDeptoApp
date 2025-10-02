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

  // Referencias a los modales
  @ViewChild(UserProfilePageComponent, { static: false }) profileModal!: UserProfilePageComponent;
  @ViewChild(RendicionesAdminPageComponent, { static: false }) rendicionesModal!: RendicionesAdminPageComponent;
  @ViewChild(AboutPageComponent, { static: false }) aboutModal!: AboutPageComponent;

  isDashboard = false;
  isAdminOpen = false;
  isParent2Open = false;
  isConfigOpen = false;
  isProfileOpen = false;
  isOperacionOpen = false;

  currentUser = computed(() => this.authService.user());
  isAdmin = computed(() => this.authService.isAdmin());

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

  // Cerrar otros dropdowns cuando se abre uno
  closeOtherDropdowns(except: string) {
    if (except !== 'admin') this.isAdminOpen = false;
    if (except !== 'parent2') this.isParent2Open = false;
    if (except !== 'config') this.isConfigOpen = false;
    if (except !== 'operacion') this.isOperacionOpen = false;
    if (except !== 'dashboard') this.isDashboard = false;
  }

  // Cerrar dropdown al hacer clic en una opción
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
    } else {
      console.error('RendicionesModal no está disponible');
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
    } else {
      console.error('AboutModal no está disponible');
    }
  }

  onLogout() {
    this.onMenuItemClick();
    this.authService.logout();
    console.log('Sesión cerrada correctamente');
  }
}
