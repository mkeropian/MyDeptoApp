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
      avatarUrl: this.getValidAvatarUrl(propietario.avatarUrl)
    }));
  });


  getValidAvatarUrl(url: string | null | undefined): string {
    const defaultAvatar = 'assets/images/default-avatar.png';

    // Si no hay URL, devolver imagen por defecto
    if (!url || url.trim() === '') {
      return defaultAvatar;
    }

    const cleanUrl = url.trim();

    // Si es una URL HTTP/HTTPS válida, devolverla
    if (this.isValidHttpUrl(cleanUrl)) {
      return cleanUrl;
    }

    // Si es una ruta de assets válida, devolverla
    if (cleanUrl.startsWith('assets/') || cleanUrl.startsWith('/assets/')) {
      return cleanUrl;
    }

    // Para cualquier otra URL (incluyendo rutas locales), usar imagen por defecto
    return defaultAvatar;
  }

  private isValidHttpUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
