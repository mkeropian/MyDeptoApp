import { Component, computed, inject, signal } from '@angular/core';
import { FormComponent } from './form/form.component';
import { UsuariosService } from '../../../users/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';

import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';

import { User } from '../../../users/interfaces/user.interface';

@Component({
  selector: 'users-admin-page',
  imports: [FormComponent, SmartGridComponent],
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

    if (!column) return data;

    return [...data].sort((a, b) => {
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
      key: 'info',
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
      key: 'activo',
      label: 'Estado',
      sortable: true,
      width: '100px',
      type: 'badge'
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Llamar',
      icon: 'fas fa-phone',
      class: 'btn-success btn-xs',
      action: (usuario) => this.contactar(usuario)
    },
    {
      label: 'Email',
      icon: 'fas fa-envelope',
      class: 'btn-info btn-xs',
      action: (usuario) => this.enviarEmail(usuario)
    },
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      class: 'btn-primary btn-xs',
      action: (usuario) => this.editar(usuario)
    }
  ];

  contactar(usuario: any) {
    window.open(`tel:${usuario.contacto.telefono}`);
  }

  enviarEmail(usuario: any) {
    window.open(`mailto:${usuario.contacto.email}`);
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

}

