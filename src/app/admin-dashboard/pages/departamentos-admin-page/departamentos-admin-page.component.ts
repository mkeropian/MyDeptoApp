import { Component, computed, inject, signal } from '@angular/core';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import { v4 as uuid } from 'uuid';
import { MiniMapComponent } from "../../../shared/components/mini-map/mini-map.component";
import { FormComponent } from "./form/form.component";
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';
import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";

@Component({
  selector: 'departamentos-admin-page',
  imports: [MiniMapComponent, FormComponent, SmartGridComponent],
  templateUrl: './departamentos-admin-page.component.html',
  styles: `
	.map-container {
		z-index: 1;
	}
  `
})
export class DepartamentosAdminPageComponent {
  departamentosService = inject(DepartamentosService);
  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentos()
  });

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedDepartamentos = signal<Departamento[]>([]);

  departamentos = computed(() => {
    const data = this.departamentosResource.value() || [];
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
      key: 'idProp',
      label: 'idProp',
      sortable: true,
      width: '130px',
      type: 'text'
    },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      width: '130px',
      type: 'text'
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      sortable: true,
      type: 'text'
    },
    {
      key: 'calle',
      label: 'Calle',
      sortable: true,
      type: 'text'
    },
    {
      key: 'barrio',
      label: 'Barrio',
      sortable: true,
      type: 'text'
    },
    {
      key: 'localidad',
      label: 'Localidad',
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
      key: 'observaciones',
      label: 'Observaciones',
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
      action: (departamentos) => this.editar(departamentos)
    }
  ];

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  editar(departamentos: any) {
    console.log('Editando departamentos:', departamentos);
  }

  agregarDepartamento() {
    console.log('Agregando nuevo departamento');
  }

  onSort(event: {column: string, direction: 'asc' | 'desc'}): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    // El computed se recalcula automáticamente
  }

  // Resto de métodos...
  isLoading = computed(() => this.departamentosResource.isLoading());
  error = computed(() => this.departamentosResource.error());

  onSelectionChange(selectedItems: any[]) {
    console.log('Departamentos seleccionados:', selectedItems.length);
  }

firstDepartmentLngLat = computed(() => {
  const dept = this.departamentos()[0];

  if (!dept?.lngLat) {
    return { lng: -58.3816, lat: -34.6037 };
  }

  return dept.lngLat;
});

}
