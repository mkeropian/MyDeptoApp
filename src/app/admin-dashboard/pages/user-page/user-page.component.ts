import { Component, computed, inject, signal } from '@angular/core';
import { FormComponent } from './form/form.component';
import { UsuariosService } from '../../../users/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';

import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';
import { ActivoEstadoPipe } from '../../../shared/pipes/activo-estado.pipe';

import { User } from '../../../users/interfaces/user.interface';

@Component({
  selector: 'users-admin-page',
  imports: [FormComponent, SmartGridComponent, ActivoEstadoPipe],
  templateUrl: './user-page.component.html',
})
export class UserAdminPageComponent {

  usersService = inject(UsuariosService);

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedUsuarios = signal<User[]>([]);

  usersResource = rxResource({
    request: () => ({}),
    loader: () => this.usersService.getUsuarios()
  });

  users = computed(() => {
    const data = this.usersResource.value() || [];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    // Transforma los datos para incluir activoTexto
    const transformedData = data.map(user => ({
      ...user,
      activoTexto: user.activo === 1 ? 'Sí' : 'No'
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
      label: 'Activar/Desactivar',
      icon: 'fas fa-edit',
      class: 'btn-primary btn-xs',
      action: (usuario) => this.toggleActivo(usuario)
    }
  ];

  toggleActivo(usuario: any) {
    usuario.activo = !usuario.activo;
    usuario.activoTexto = usuario.activo ? 'Sí' : 'No';

    this.usersService.updateUsuarioActivo(usuario.id, { activo: usuario.activo }).subscribe(
      response => {
        this.showSuccessToast(`Usuario ${usuario.usuario} actualizado correctamente.`);
      },
      error => {
        // Revertir el cambio en caso de error
        usuario.activo = !usuario.activo;
        usuario.activoTexto = usuario.activo ? 'Sí' : 'No';
        console.error('Error al actualizar el usuario:', error);
        this.showErrorToast(`Error al actualizar el usuario ${usuario.usuario}.`);
      }
    );
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
    // El computed se recalcula automáticamente
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  // Resto de métodos...
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

