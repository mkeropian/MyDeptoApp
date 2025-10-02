import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'about-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-page.component.html',
})
export class AboutPageComponent {
  // Señal para controlar la visibilidad del modal
  isOpen = signal<boolean>(false);

  /**
   * Abre el modal
   */
  open(): void {
    this.isOpen.set(true);
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.isOpen.set(false);
  }

  /**
   * Maneja el clic en el backdrop para cerrar
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }
}
