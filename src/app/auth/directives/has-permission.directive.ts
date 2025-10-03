// src/app/auth/directives/has-permission.directive.ts
import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect
} from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural para mostrar/ocultar elementos según permisos
 *
 * Uso básico:
 * <button *hasPermission="'departamentos.crear'">Crear</button>
 *
 * Con múltiples permisos (OR - al menos uno):
 * <div *hasPermission="['departamentos', 'propietarios']">Contenido</div>
 *
 * Con múltiples permisos (AND - todos requeridos):
 * <div *hasPermission="{ permisos: ['departamentos.crear', 'departamentos.editar'], requireAll: true }">
 *   Contenido
 * </div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  constructor() {
    // Reaccionar a cambios en los permisos del usuario
    effect(() => {
      // Trigger effect cuando cambien los permisos
      this.authService.permisos();
      this.updateView();
    });
  }

  @Input() set hasPermission(config: string | string[] | PermissionConfig) {
    this.permissionConfig = this.normalizeConfig(config);
    this.updateView();
  }

  private permissionConfig: PermissionConfig = { permisos: [], requireAll: false };

  private normalizeConfig(config: string | string[] | PermissionConfig): PermissionConfig {
    if (typeof config === 'string') {
      return { permisos: [config], requireAll: false };
    }

    if (Array.isArray(config)) {
      return { permisos: config, requireAll: false };
    }

    return config;
  }

  private updateView(): void {
    const tienePermiso = this.checkPermission();

    if (tienePermiso && !this.hasView) {
      // Crear la vista si tiene permiso y aún no existe
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!tienePermiso && this.hasView) {
      // Eliminar la vista si no tiene permiso
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkPermission(): boolean {
    const { permisos, requireAll } = this.permissionConfig;

    if (permisos.length === 0) {
      return false;
    }

    if (requireAll) {
      // Requiere TODOS los permisos (AND)
      return this.authService.tienePermisos(permisos);
    } else {
      // Requiere AL MENOS UNO de los permisos (OR)
      return this.authService.tieneAlgunPermiso(permisos);
    }
  }
}

/**
 * Interface para configuración avanzada de permisos
 */
interface PermissionConfig {
  permisos: string[];
  requireAll: boolean; // true = AND, false = OR
}
