// src/app/home/pages/themes-settings-page/themes-settings-page.component.ts
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../auth/services/auth.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { ThemeService } from '../../../../shared/services/theme.service';


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
      this.showErrorToast('No hay usuario autenticado');
      return;
    }

    const themeToSave = this.selectedTheme();

    if (!themeToSave) {
      this.showErrorToast('Por favor selecciona un tema');
      return;
    }

    this.isSaving.set(true);

    this.usuariosService
      .updateTemaUsuario(user.id, { tema: themeToSave })
      .subscribe({
        next: (response) => {
          console.log('Tema guardado en el servidor:', response);
          this.isSaving.set(false);

          // Mostrar mensaje de éxito
          this.showSuccessToast(
            `Tema "${themeToSave}" guardado correctamente`
          );
        },
        error: (error) => {
          console.error('Error al guardar el tema en el servidor:', error);
          this.isSaving.set(false);

          // Mostrar mensaje de error
          this.showErrorToast(
            'Error al guardar la configuración. Inténtalo nuevamente.'
          );
        },
      });
  }

  /**
   * Método para mostrar toast de éxito
   */
  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText =
      'position: fixed; top: 4rem; right: 1rem; z-index: 70; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-success shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">${message}</span>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  /**
   * Método para mostrar toast de error
   */
  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText =
      'position: fixed; top: 4rem; right: 1rem; z-index: 70; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-error shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">${message}</span>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
}
