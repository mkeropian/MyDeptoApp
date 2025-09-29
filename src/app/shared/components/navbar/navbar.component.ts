import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

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
    this.onMenuItemClick(); // Cierra dropdowns
    this.router.navigate(['/admin/rendiciones-admin']); // Navega a la ruta
  }

  onLogout() {
    this.onMenuItemClick();  // Cierra dropdowns
    this.authService.logout(); // Llama al servicio de logout
    console.log('Sesión cerrada correctamente');
  }
}
