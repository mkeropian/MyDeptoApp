import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { JsonPipe } from '@angular/common';
import { FormComponent } from "./form/form.component";
import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';
import Swal from 'sweetalert2';
import { EditModalComponent } from './edit-modal/edit-modal.component';

@Component({
  selector: 'propietarios-admin-page',
  imports: [FormComponent, SmartGridComponent, EditModalComponent],
  templateUrl: './propietarios-admin-page.component.html',
})
export class PropietariosAdminPageComponent {

  propietariosService = inject(PropietariosService);

  @ViewChild(EditModalComponent) editModal?: EditModalComponent;

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedPropietarios = signal<Propietario[]>([]);

  // MODIFICADO: Ahora el resource depende del refreshTrigger
  propietariosResource = rxResource({
    request: () => ({ refresh: this.refreshTrigger() }),
    loader: () => this.propietariosService.getPropietarios()
  });

  propietarios = computed(() => {
    const data = this.propietariosResource.value() || [];
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
      action: (propietario) => this.editar(propietario)
    },
    {
      label: '',
      icon: '',
      class: 'btn-xs',
      action: (propietario) => this.toggleActivo(propietario),
      getIcon: (propietario: any) => propietario.activo === 1 ? 'fas fa-toggle-off' : 'fas fa-toggle-on',
      getClass: (propietario: any) => propietario.activo === 1 ? 'btn-error btn-xs' : 'btn-success btn-xs',
    }
  ];

  editar(propietario: any) {
    if (this.editModal) {
      this.editModal.open(propietario);
    }
  }

  onPropietarioActualizado(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  // NUEVO: Método para toggle activo/inactivo
  async toggleActivo(propietario: any) {
    const accion = propietario.activo === 1 ? 'desactivar' : 'activar';
    const accionCapitalizada = accion.charAt(0).toUpperCase() + accion.slice(1);

    const result = await Swal.fire({
      title: `¿${accionCapitalizada} propietario?`,
      html: `
        <div class="text-left text-sm">
          <p class="mb-2"><strong>Propietario:</strong> ${propietario.nombreApellido}</p>
          <p class="mb-2"><strong>DNI:</strong> ${propietario.dni}</p>
          <p class="text-warning">Esta acción cambiará el estado del propietario.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: accionCapitalizada,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: propietario.activo === 1 ? '#d33' : '#3085d6',
      cancelButtonColor: '#6c757d',
      customClass: {
        popup: 'swal-compact'
      }
    });

    if (!result.isConfirmed) return;

    this.propietariosService.toggleActivo(propietario.id).subscribe({
      next: (response) => {
        const nuevoEstado = response.activo === 1 ? 'activado' : 'desactivado';
        this.showSuccessToast(`Propietario ${nuevoEstado} exitosamente`);
        this.refreshTrigger.update(v => v + 1);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.showErrorToast('Error al cambiar el estado del propietario');
      }
    });
  }

  agregarPropietario() {
    console.log('Agregando nuevo propietario');
  }

  onSort(event: {column: string, direction: 'asc' | 'desc'}): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  // NUEVO: Método para refrescar la lista de propietarios
  onPropietarioCreado(): void {
    this.refreshTrigger.update(v => v + 1);
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  isLoading = computed(() => this.propietariosResource.isLoading());
  error = computed(() => this.propietariosResource.error());

  onSelectionChange(selectedItems: any[]) {
    console.log('Propietarios seleccionados:', selectedItems.length);
  }

  // Métodos de toast
  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 9999; max-width: 24rem;';
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

  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 9999; max-width: 24rem;';
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

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
}
