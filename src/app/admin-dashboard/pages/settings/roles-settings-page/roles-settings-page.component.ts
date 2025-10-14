// src/app/pages/roles-settings-page/roles-settings-page.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Permiso } from '../../../../auth/interfaces/roles-permisos.interface';
import { Rol } from '../../../../auth/interfaces/user.interface';
import { RolesPermisosService } from '../../../../auth/services/roles-permisos.service';

type SeccionActiva = 'roles' | 'permisos' | 'asignacion';

@Component({
  selector: 'app-roles-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-settings-page.component.html',
})
export class RolesSettingsPageComponent implements OnInit {
  private rolesPermisosService = inject(RolesPermisosService);

  // Signals para estado reactivo
  seccionActiva = signal<SeccionActiva>('roles');
  roles = signal<Rol[]>([]);
  permisos = signal<Permiso[]>([]);
  permisosDelRol = signal<Permiso[]>([]);
  cargando = signal(false);

  // Estados de modales
  mostrarModalRol = signal(false);
  mostrarModalPermiso = signal(false);

  // Formularios
  rolForm = signal<Partial<Rol>>({ nombre: '', descripcion: '' });
  permisoForm = signal<Partial<Permiso>>({ nombre_vista: '', desc_vista: '' });

  // Asignación de permisos
  rolSeleccionado = signal<Rol | null>(null);
  permisosSeleccionados = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ========== CARGAR DATOS ==========

  cargarDatos(): void {
    this.cargarRoles();
    this.cargarPermisos();
  }

  cargarRoles(): void {
    this.cargando.set(true);
    this.rolesPermisosService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando roles:', error);
        this.cargando.set(false);
      }
    });
  }

  cargarPermisos(): void {
    this.cargando.set(true);
    this.rolesPermisosService.getPermisos().subscribe({
      next: (permisos) => {
        this.permisos.set(permisos);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando permisos:', error);
        this.cargando.set(false);
      }
    });
  }

  cargarPermisosDeRol(rolId: number): void {
    this.cargando.set(true);
    this.rolesPermisosService.getPermisosDeRol(rolId).subscribe({
      next: (permisos) => {
        this.permisosDelRol.set(permisos);
        // Marcar permisos ya asignados
        const ids = new Set(permisos.map(p => p.id));
        this.permisosSeleccionados.set(ids);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando permisos del rol:', error);
        this.cargando.set(false);
      }
    });
  }

  // ========== NAVEGACIÓN ==========

  cambiarSeccion(seccion: SeccionActiva): void {
    this.seccionActiva.set(seccion);
  }

  // ========== ROLES ==========

  abrirModalRol(): void {
    this.rolForm.set({ nombre: '', descripcion: '' });
    this.mostrarModalRol.set(true);
  }

  cerrarModalRol(): void {
    this.mostrarModalRol.set(false);
    this.rolForm.set({ nombre: '', descripcion: '' });
  }

  guardarRol(): void {
    const rol = this.rolForm();

    if (!rol.nombre?.trim()) {
      alert('El nombre del rol es obligatorio');
      return;
    }

    this.cargando.set(true);

    this.rolesPermisosService.createRol(rol).subscribe({
      next: () => {
        this.cargarRoles();
        this.cerrarModalRol();
      },
      error: (error) => {
        console.error('Error guardando rol:', error);
        alert('Error al guardar el rol');
        this.cargando.set(false);
      }
    });
  }

  // ========== PERMISOS ==========

  abrirModalPermiso(): void {
    this.permisoForm.set({ nombre_vista: '', desc_vista: '' });
    this.mostrarModalPermiso.set(true);
  }

  cerrarModalPermiso(): void {
    this.mostrarModalPermiso.set(false);
    this.permisoForm.set({ nombre_vista: '', desc_vista: '' });
  }

  guardarPermiso(): void {
    const permiso = this.permisoForm();

    if (!permiso.nombre_vista?.trim() || !permiso.desc_vista?.trim()) {
      alert('Todos los campos son obligatorios');
      return;
    }

    this.cargando.set(true);

    this.rolesPermisosService.createPermiso(permiso).subscribe({
      next: () => {
        this.cargarPermisos();
        this.cerrarModalPermiso();
      },
      error: (error) => {
        console.error('Error guardando permiso:', error);
        alert('Error al guardar el permiso');
        this.cargando.set(false);
      }
    });
  }

  // ========== ASIGNACIÓN ==========

  seleccionarRolParaAsignar(rol: Rol): void {
    this.rolSeleccionado.set(rol);
    this.cargarPermisosDeRol(rol.id);
  }

  togglePermiso(permisoId: number): void {
    const seleccionados = new Set(this.permisosSeleccionados());

    if (seleccionados.has(permisoId)) {
      seleccionados.delete(permisoId);
    } else {
      seleccionados.add(permisoId);
    }

    this.permisosSeleccionados.set(seleccionados);
  }

  guardarAsignacion(): void {
    const rol = this.rolSeleccionado();
    if (!rol) {
      alert('Seleccione un rol');
      return;
    }

    const permisosIds = Array.from(this.permisosSeleccionados());

    this.cargando.set(true);
    this.rolesPermisosService.asignarPermisosARol(rol.id, permisosIds).subscribe({
      next: () => {
        alert('Permisos asignados correctamente');
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error asignando permisos:', error);
        alert('Error al asignar permisos');
        this.cargando.set(false);
      }
    });
  }
}
