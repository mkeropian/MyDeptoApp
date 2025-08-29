import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  isDashboard = false;
  isAdminOpen = false;
  isParent2Open = false;
  isConfigOpen = false;
  isProfileOpen = false;
  isOperacionOpen = false;

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

}
