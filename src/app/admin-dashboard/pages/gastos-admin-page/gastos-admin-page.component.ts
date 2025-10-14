import { Component, computed, inject, signal } from '@angular/core';
import { FormComponent } from "./form/form.component";
import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { GastosService } from '../../../gastos/services/gastos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Gasto } from '../../../gastos/interfaces/gasto.interface';
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';

@Component({
  selector: 'gastos-admin-page',
  imports: [FormComponent, SmartGridComponent],
  templateUrl: './gastos-admin-page.component.html',
})

export class GastosAdminPageComponent {

  gastosService = inject(GastosService);

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedGastos = signal<Gasto[]>([]);

  // MODIFICADO: Ahora el resource depende del refreshTrigger
  gastosResource = rxResource({
    request: () => ({ refresh: this.refreshTrigger() }),
    loader: () => this.gastosService.getGastos()
  });

  gastos = computed(() => {
    const data = this.gastosResource.value() || [];
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
      key: 'idTipoGasto',
      label: 'Cod. Tipo Gasto',
      sortable: true,
      width: '60px',
      type: 'text'
    },
    {
      key: 'descripcion',
      label: 'Tipo Gasto',
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
      type: 'date'
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

  editar(gasto: any) {
    console.log('Editando Gasto:', gasto);
  }

  onSort(event: {column: string, direction: 'asc' | 'desc'}): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  // NUEVO: Método para refrescar la lista de gastos
  onGastoCreado(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  isLoading = computed(() => this.gastosResource.isLoading());
  error = computed(() => this.gastosResource.error());

  onSelectionChange(selectedItems: any[]) {
    console.log('Gastos seleccionados:', selectedItems.length);
  }
}
