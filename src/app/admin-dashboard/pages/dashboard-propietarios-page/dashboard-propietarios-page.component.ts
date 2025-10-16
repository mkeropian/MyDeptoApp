// dashboard-propietarios-page.component.ts

import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';

@Component({
  selector: 'app-propietarios-dashboard-page',
  imports: [],
  templateUrl: './dashboard-propietarios-page.component.html',
})
export class DashboardPropietariosPageComponent {
  propietariosService = inject(PropietariosService);

  propietariosResource = rxResource({
    request: () => ({}),
    loader: () => this.propietariosService.getPropietariosActivos()
  });

  propietarios = computed(() => {
    const data: Propietario[] = this.propietariosResource.value() || [];
    return data.map(propietario => ({
      ...propietario,
      avatarUrl: this.propietariosService.getAvatarUrl(propietario.avatarUrl)
    }));
  });

  /**
   * Maneja error al cargar avatar - usa imagen default
   */
  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.propietariosService.getDefaultAvatarUrl();
  }
}
