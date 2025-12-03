// src/app/home/pages/themes-settings-page/themes-settings-page.component.ts
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../auth/services/auth.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './themes-settings-page.component.html',
})
export class ThemesSettingsPageComponent {
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);

  // Signals
  selectedTheme = signal<string>('');
  isSaving = signal<boolean>(false);

  // Computed del usuario actual
  currentUser = this.authService.user;
  currentTheme = this.themeService.currentTheme;

  constructor() {
    // Effect para sincronizar el tema actual con el selectedTheme
    effect(() => {
      const theme = this.currentTheme();
      this.selectedTheme.set(theme);
    });
  }

  ngOnInit(): void {
    // Cargar el tema del usuario actual
    const user = this.currentUser();
    if (user?.tema) {
      this.selectedTheme.set(user.tema);
      this.markRadioButton(user.tema);
    } else {
      // Si no hay tema del usuario, usar el tema actual del ThemeService
      const currentTheme = this.themeService.currentTheme();
      this.selectedTheme.set(currentTheme);
      this.markRadioButton(currentTheme);
    }
  }

  /**
   * Marca el radio button correspondiente al tema
   */
  private markRadioButton(theme: string): void {
    setTimeout(() => {
      const radioButton = document.querySelector(
        `input[value="${theme}"]`
      ) as HTMLInputElement;
      if (radioButton) {
        radioButton.checked = true;
      }
    }, 0);
  }

  /**
   * Método para capturar el tema seleccionado
   */
  onThemeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.checked) {
      const newTheme = target.value;
      this.selectedTheme.set(newTheme);

      // Aplicar el tema inmediatamente usando el ThemeService
      this.themeService.setTheme(newTheme);
    }
  }

  /**
   * Método para guardar la configuración
   */
  onSaveSettings(): void {
    const user = this.currentUser();

    if (!user || !user.id) {
      this.notificationService.mostrarNotificacion('No hay usuario autenticado', 'error');
      return;
    }

    const themeToSave = this.selectedTheme();

    if (!themeToSave) {
      this.notificationService.mostrarNotificacion('Por favor selecciona un tema', 'error');
      return;
    }

    this.isSaving.set(true);

    this.usuariosService
      .updateTemaUsuario(user.id, { tema: themeToSave })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.notificationService.mostrarNotificacion(
            `Tema "${themeToSave}" guardado correctamente`,
            'success'
          );
        },
        error: () => {
          this.isSaving.set(false);
          this.notificationService.mostrarNotificacion(
            'Error al guardar la configuración. Inténtalo nuevamente.',
            'error'
          );
        },
      });
  }
}
