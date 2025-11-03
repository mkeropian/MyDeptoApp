import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { FormComponent } from './form/form.component';
import { UsuariosService } from '../../../auth/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';

import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';

import { User } from '../../../auth/interfaces/user.interface';
import { VincularDesdeUsuarioModalComponent } from './vincular-desde-usuario-modal/vincular-desde-usuario-modal.component';
import Swal from 'sweetalert2';
import { getRoleBadgeColor, formatRoleName } from '../../../shared/utils/role-colors.util';

@Component({
  selector: 'users-page',
  imports: [FormComponent, SmartGridComponent, VincularDesdeUsuarioModalComponent],
  templateUrl: './user-page.component.html',
})
export class UserPageComponent {

  usersService = inject(UsuariosService);

  @ViewChild(VincularDesdeUsuarioModalComponent) vincularModal?: VincularDesdeUsuarioModalComponent;

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedUsuarios = signal<User[]>([]);

  usersResource = rxResource({
    request: () => ({ refresh: this.refreshTrigger() }),
    loader: () => this.usersService.getUsuarios()
  });

  users = computed(() => {
    const data = this.usersResource.value() || [];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    const transformedData = data.map(user => ({
      ...user,
      activoTexto: user.activo === 1 ? 'Sí' : 'No',
      propietarioNombre: user.propietarioNombre || '-',
      // NUEVO: Agregar badge de rol con color dinámico
      rolBadge: user.rolNombre
        ? `<span class="badge ${getRoleBadgeColor(user.rolNombre, user.rolId)} badge-sm">${formatRoleName(user.rolNombre)}</span>`
        : '<span class="badge bg-gray-500 text-white badge-sm">Sin rol</span>'
    }));

    if (!column) return transformedData;

    return [...transformedData].sort((a, b) => {
      const valueA = this.getValue(a, column);
      const valueB = this.getValue(b, column);

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  columns: TableColumn[] = [
    {
      key: 'avatarUrl',
      label: 'Avatar',
      sortable: false,
      type: 'avatar'
    },
    {
      key: 'usuario',
      label: 'Usuario',
      sortable: true,
      type: 'text'
    },
    {
      key: 'nombreCompleto',
      label: 'Nombre Completo',
      sortable: true,
      width: '130px',
      type: 'text'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      type: 'text'
    },
    {
      key: 'rolBadge',
      label: 'Rol',
      sortable: false,
      width: '120px',
      type: 'html'
    },
    {
      key: 'propietarioNombre',
      label: 'Propietario',
      sortable: true,
      width: '150px',
      type: 'badge'
    },
    {
      key: 'activoTexto',
      label: 'Estado',
      sortable: true,
      width: '100px',
      type: 'badge'
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      class: 'btn-primary btn-xs',
      action: (usuario) => this.editar(usuario)
    },
    {
      label: '',
      icon: '',
      class: 'btn-xs',
      action: (usuario) => this.toggleActivo(usuario),
      getIcon: (usuario: any) => usuario.activo === 1 ? 'fas fa-toggle-off' : 'fas fa-toggle-on',
      getClass: (usuario: any) => usuario.activo === 1 ? 'btn-error btn-xs' : 'btn-success btn-xs',
    },
    {
      label: '',
      icon: 'fas fa-link',
      class: 'btn-info btn-xs',
      action: (usuario) => this.vincularPropietario(usuario),
      getIcon: (usuario: any) => usuario.propietarioId ? 'fas fa-unlink' : 'fas fa-link',
      getClass: (usuario: any) => usuario.propietarioId ? 'btn-warning btn-xs' : 'btn-info btn-xs'
    }
  ];

  vincularPropietario(usuario: any) {
    if (this.vincularModal) {
      this.vincularModal.openFromUser(usuario);
    }
  }

  toggleActivo(usuario: any) {
    const nuevoEstado = usuario.activo === 1 ? 0 : 1;

    this.usersService.updateUsuarioActivo(usuario.id, { activo: nuevoEstado }).subscribe({
      next: (response) => {
        this.showSuccessToast(`Usuario ${usuario.usuario} actualizado correctamente.`);
        // NUEVO: Refrescar solo la grilla
        this.refreshTrigger.update(v => v + 1);
      },
      error: (error) => {
        console.error('Error al actualizar el usuario:', error);
        this.showErrorToast(`Error al actualizar el usuario ${usuario.usuario}.`);
      }
    });
  }

  editar(usuario: any) {
    console.log('Editando Usuario:', usuario);
  }

  agregarUsuario() {
    console.log('Agregando nuevo usuario');
  }

  onSort(event: {column: string, direction: 'asc' | 'desc'}): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onUsuarioCreado(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  onVinculacionRealizada(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  isLoading = computed(() => this.usersResource.isLoading());
  error = computed(() => this.usersResource.error());

  onSelectionChange(selectedItems: any[]) {
    console.log('Usuarios seleccionados:', selectedItems.length);
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
    setTimeout(() => toast.parentNode?.removeChild(toast), 4000);
  }

  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 70; max-width: 24rem;';
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
    setTimeout(() => toast.parentNode?.removeChild(toast), 4000);
  }
}
