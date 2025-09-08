import { Component, inject } from '@angular/core';
import { UsuariosService } from '../../../../users/services/users.service';

@Component({
  selector: 'app-settings-page',
  imports: [],
  templateUrl: './themes-settings-page.component.html',
})
export class ThemesSettingsPageComponent {

  UsuariosService = inject(UsuariosService);
  selectedTheme: string = '';

  // Método para cargar el tema guardado (opcional)
  ngOnInit(): void {
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);

      // Marcar el radio button correspondiente
      setTimeout(() => {
        const radioButton = document.querySelector(`input[value="${savedTheme}"]`) as HTMLInputElement;
        if (radioButton) {
          radioButton.checked = true;
        }
      }, 0);
    }
  }

  // Método para capturar el tema seleccionado
  onThemeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.checked) {
      this.selectedTheme = target.value;
      console.log('Tema seleccionado:', this.selectedTheme);

      // Opcional: Aplicar el tema inmediatamente
      this.applyTheme(this.selectedTheme);

    }
  }

  // Método para aplicar el tema al documento
  private applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Método para guardar la configuración
  onSaveSettings(): void {
    if (this.selectedTheme) {

      this.UsuariosService.updateTemaUsuario(3, { tema: this.selectedTheme }).subscribe(
        response => {
          console.log('Tema guardado en el servidor:', response);

          // Mostrar mensaje de éxito
          this.showSuccessToast(`Tema "${this.selectedTheme}" guardado correctamente`);

        },
        error => {
          console.error('Error al guardar el tema en el servidor:', error);

          // Mostrar mensaje de error
          this.showErrorToast('Error al guardar la configuración. Inténtalo nuevamente.');
        }
      );

    }
  }

  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 70; max-width: 24rem;';
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

  // Método para mostrar toast de error
  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 70; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-error shadow-lg">
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

}
