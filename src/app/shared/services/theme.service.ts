// src/app/shared/services/theme.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';

type DaisyUITheme =
  | 'light'
  | 'dark'
  | 'cupcake'
  | 'bumblebee'
  | 'emerald'
  | 'corporate'
  | 'synthwave'
  | 'retro'
  | 'cyberpunk'
  | 'valentine'
  | 'halloween'
  | 'garden'
  | 'forest'
  | 'aqua'
  | 'lofi'
  | 'pastel'
  | 'fantasy'
  | 'wireframe'
  | 'black'
  | 'luxury'
  | 'dracula'
  | 'cmyk'
  | 'autumn'
  | 'business'
  | 'acid'
  | 'lemonade'
  | 'night'
  | 'coffee'
  | 'winter'
  | 'dim'
  | 'nord'
  | 'sunset';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Signal para el tema actual
  private _currentTheme = signal<DaisyUITheme>('light');

  // Computed para exponer el tema actual
  currentTheme = computed(() => this._currentTheme());

  constructor() {
    // Effect para aplicar el tema cuando cambie
    effect(() => {
      this.applyTheme(this._currentTheme());
    });

    // Cargar tema guardado en localStorage al iniciar
    this.loadSavedTheme();
  }

  /**
   * Establece un nuevo tema
   */
  setTheme(theme: string): void {
    const validTheme = this.validateTheme(theme);
    this._currentTheme.set(validTheme);
    this.saveTheme(validTheme);
  }

  /**
   * Aplica el tema al documento HTML
   */
  private applyTheme(theme: DaisyUITheme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  /**
   * Guarda el tema en localStorage
   */
  private saveTheme(theme: DaisyUITheme): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app-theme', theme);
    }
  }

  /**
   * Carga el tema guardado en localStorage
   */
  private loadSavedTheme(): void {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        this._currentTheme.set(this.validateTheme(savedTheme));
      }
    }
  }

  /**
   * Valida que el tema sea uno de los temas válidos de DaisyUI
   */
  private validateTheme(theme: string): DaisyUITheme {
    const validThemes: DaisyUITheme[] = [
      'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
      'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
      'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
      'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
      'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'
    ];

    return validThemes.includes(theme as DaisyUITheme)
      ? (theme as DaisyUITheme)
      : 'light';
  }

  /**
   * Resetea el tema al valor por defecto
   */
  resetTheme(): void {
    this.setTheme('light');
  }
}
