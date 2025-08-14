import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { JsonPipe } from '@angular/common';
import { FormComponent } from "./form/form.component";
import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';

@Component({
  selector: 'propietarios-admin-page',
  imports: [FormComponent, SmartGridComponent],
  templateUrl: './propietarios-admin-page.component.html',
})
export class PropietariosAdminPageComponent {

  propietariosService = inject(PropietariosService);
  propietariosResource = rxResource({
    request: () => ({}),
    loader: () => this.propietariosService.getPropietarios()
  });

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedPropietarios = signal<Propietario[]>([]);

  propietarios = computed(() => {
    const data = this.propietariosResource.value() || [];
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
      key: 'nombreApellido',
      label: 'Nombre',
      sortable: true,
      width: '130px',
      type: 'text'
    },
    {
      key: 'dni',
      label: 'DNI',
      sortable: true,
      type: 'text'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      type: 'text'
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      sortable: true,
      type: 'text'
    },
    {
      key: 'direccion',
      label: 'Dirección',
      sortable: true,
      type: 'text'
    },
    {
      key: 'ciudad',
      label: 'Ciudad',
      sortable: true,
      type: 'text'
    },
    {
      key: 'provincia',
      label: 'Provincia',
      sortable: true,
      type: 'text'
    },
    {
      key: 'codigoPostal',
      label: 'Código Postal',
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
      label: 'Editar',
      icon: 'fas fa-edit',
      class: 'btn-primary btn-xs',
      action: (propietario) => this.editar(propietario)
    }
  ];


  editar(propietario: any) {
    console.log('Editando Propietario:', propietario);
  }

  agregarPropietario() {
    console.log('Agregando nuevo propietario');
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
  isLoading = computed(() => this.propietariosResource.isLoading());
  error = computed(() => this.propietariosResource.error());

  onSelectionChange(selectedItems: any[]) {
    console.log('Propietarios seleccionados:', selectedItems.length);
  }
}
