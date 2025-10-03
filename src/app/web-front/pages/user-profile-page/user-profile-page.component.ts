import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { UsuariosService } from '../../../auth/services/users.service';

@Component({
  selector: 'user-profile-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile-page.component.html',
})
export class UserProfilePageComponent {
  private authService = inject(AuthService);
  private usuariosService = inject(UsuariosService);

  // Señal para controlar la visibilidad del modal
  isOpen = signal<boolean>(false);

  // Datos del usuario actual
  currentUser = computed(() => this.authService.user());

  // Estado de carga para el cambio de avatar
  isUploadingAvatar = signal<boolean>(false);
  uploadError = signal<string>('');

  /**
   * Abre el modal y refresca el perfil del usuario
   */
  open(): void {
    this.isOpen.set(true);

    // Debug: ver qué datos tenemos
    // console.log('👤 Usuario actual al abrir modal:', this.currentUser());

    // Refrescar el perfil para asegurar que tenemos todos los datos
    this.authService.getProfile().subscribe({
      next: (response) => {
        // console.log('✅ Perfil actualizado:', response);
        // console.log('👤 Usuario después de refresh:', this.currentUser());
      },
      error: (err) => {
        // console.error('❌ Error al obtener perfil:', err);
      }
    });
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.isOpen.set(false);
    this.uploadError.set('');
  }

  /**
   * Maneja el clic en el backdrop para cerrar
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }

  /**
   * Maneja la selección de archivo para el avatar
   */
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.uploadError.set('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.uploadError.set('El archivo no debe superar los 5MB');
      return;
    }

    this.uploadAvatar(file);
  }

  /**
   * Sube el avatar al servidor
   */
  private uploadAvatar(file: File): void {
    const userId = this.currentUser()?.id;
    if (!userId) {
      this.uploadError.set('No se pudo identificar el usuario');
      return;
    }

    this.isUploadingAvatar.set(true);
    this.uploadError.set('');

    this.usuariosService.uploadAvatarForUser(userId, file).subscribe({
      next: (response: any) => {
        this.isUploadingAvatar.set(false);

        // Actualizar el perfil para reflejar el nuevo avatar
        this.authService.getProfile().subscribe({
          next: () => {
            // console.log('✅ Avatar y perfil actualizados');
          }
        });
      },
      error: (error) => {
        this.isUploadingAvatar.set(false);
        this.uploadError.set('Error al subir el avatar. Intenta nuevamente.');
        // console.error('❌ Error subiendo avatar:', error);
      }
    });
  }

  /**
   * Obtiene las iniciales del nombre para el avatar por defecto
   */
  getInitials(): string {
    const name = this.currentUser()?.nombreCompleto || '';

    if (!name) {
      // Si no hay nombre, usar el email
      const email = this.currentUser()?.email || 'US';
      return email.substring(0, 2).toUpperCase();
    }

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Formatea la fecha de registro (si está disponible)
   */
  formatDate(date?: string | Date): string {
    if (!date) return 'No disponible';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
