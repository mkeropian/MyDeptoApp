import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [],
  templateUrl: './unauthorized-page.component.html',
  styleUrls: ['./unauthorized-page.component.css']
})
export class UnauthorizedPageComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  goBack(): void {
    this.router.navigate(['/home']);
  }

  goToLogin(): void {
    this.authService.logout();
  }

  get userName(): string {
    return this.authService.user()?.nombreCompleto || 'Usuario';
  }

  get userRole(): string {
    const roles = this.authService.user()?.roles || [];
    return roles.length > 0 ? roles.join(', ') : 'Sin rol asignado';
  }
}
