import { Component, computed, inject, signal } from '@angular/core';
import { FormComponent } from "./form/form.component";
import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { PagosService } from '../../../incomes/services/incomes.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Pago } from '../../../incomes/interfaces/incomes.interface';
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';

@Component({
  selector: 'ingresos-admin-page',
  imports: [FormComponent, SmartGridComponent],
  templateUrl: './ingresos-admin-page.component.html',
})
export class IngresosAdminPageComponent {

  pagosService = inject(PagosService);
  pagosResource = rxResource({
    request: () => ({}),
    loader: () => this.pagosService.getPagos()
  });

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedPagos = signal<Pago[]>([]);

  pagos = computed(() => {
    const data = this.pagosResource.value() || [];
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
      key: 'id',
      label: 'Id',
      sortable: true,
      width: '60px',
      type: 'text'
    },
    {
      key: 'idTipoPago',
      label: 'Cod. Tipo Pago',
      sortable: true,
      width: '60px',
      type: 'text'
    },
    {
      key: 'descripcion',
      label: 'Tipo Pago',
      sortable: true,
      width: '260px',
      type: 'text'
    },
    {
      key: 'idDep',
      label: 'Departamento',
      sortable: true,
      width: '60px',
      type: 'text'
    },
    {
      key: 'nombre',
      label: 'Departamento',
      sortable: true,
      width: '260px',
      type: 'text'
    },
    {
      key: 'monto',
      label: 'Monto',
      sortable: true,
      width: '260px',
      type: 'text'
    },
    {
      key: 'fecha',
      label: 'fecha',
      sortable: true,
      width: '260px',
      type: 'text'
    },
    {
      key: 'observaciones',
      label: 'Observaciones',
      sortable: true,
      width: '380px',
      type: 'text'
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      class: 'btn-primary btn-xs',
      action: (gasto) => this.editar(gasto)
    }
  ];

  editar(propietario: any) {
    console.log('Editando Propietario:', propietario);
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
  isLoading = computed(() => this.pagosResource.isLoading());
  error = computed(() => this.pagosResource.error());

  onSelectionChange(selectedItems: any[]) {
    console.log('Pagos seleccionados:', selectedItems.length);
  }

}
