import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { FormComponent } from "./form/form.component";
import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { PagosService } from '../../../incomes/services/incomes.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Pago } from '../../../incomes/interfaces/incomes.interface';
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';
import { EditModalComponent } from './edit-modal/edit-modal.component';


@Component({
  selector: 'ingresos-admin-page',
  imports: [FormComponent, SmartGridComponent, EditModalComponent],
  templateUrl: './ingresos-admin-page.component.html',
})
export class IngresosAdminPageComponent {

  pagosService = inject(PagosService);

  @ViewChild(EditModalComponent) editModal!: EditModalComponent;

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedPagos = signal<Pago[]>([]);

  pagosResource = rxResource({
    request: () => ({ refresh: this.refreshTrigger() }),
    loader: () => this.pagosService.getPagos()
  });

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
      action: (pago) => this.editar(pago)
    }
  ];

  editar(pago: any) {
    if (this.editModal) {
      this.editModal.open(pago);
    }
  }

  onSort(event: {column: string, direction: 'asc' | 'desc'}): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onPagoCreado(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  // NUEVO: Método para refrescar cuando se actualiza un pago
  onPagoActualizado(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  isLoading = computed(() => this.pagosResource.isLoading());
  error = computed(() => this.pagosResource.error());

  onSelectionChange(selectedItems: any[]) {
    console.log('Pagos seleccionados:', selectedItems.length);
  }
}
