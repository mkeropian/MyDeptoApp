import { Component, computed, inject, signal } from '@angular/core';
import { Departamento, DepartamentoBackend } from '../../../departamentos/interfaces/departamento.interface';
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
    loader: () => this.departamentosService.getDepartamentosRaw()
  });

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  refreshTrigger = signal(0);
  selectedDepartamentos = signal<Departamento[]>([]);

  // Coordenadas fijas de Buenos Aires (centro de la ciudad)
  buenosAiresCoords = () => ({ lng: -58.3816, lat: -34.6037 });

  departamentos = computed(() => {
    const data = this.departamentosResource.value() || [];
    // console.log('Raw data from service:', data);
    // console.log('Type of first lngLat:', typeof data[0]?.lngLat);

    // Verificar si los datos ya vienen transformados (como Departamento[])
    // o si vienen del backend (como DepartamentoBackend[])
    if (data.length > 0) {
      const firstItem = data[0];

      // Si lngLat ya es un objeto, los datos están transformados
      if (typeof firstItem.lngLat === 'object' && firstItem.lngLat !== null) {
        // console.log('Datos ya transformados, usando directamente');
        return data as unknown as Departamento[];
      }

      // Si lngLat es string, necesitamos transformar
      if (typeof firstItem.lngLat === 'string') {
    // console.log('Transformando datos del backend');
        const backendData = data as DepartamentoBackend[];

        return backendData.map(item => {
          try {
            // Parsear las coordenadas "lng,lat" a objeto
            const [lng, lat] = item.lngLat.split(',').map(coord => parseFloat(coord.trim()));

            // Validar que las coordenadas sean números válidos
            if (isNaN(lng) || isNaN(lat)) {
              throw new Error('Coordenadas inválidas');
            }

            return {
              id: item.id,
              idProp: item.idProp,
              nombre: item.nombre,
              descripcion: item.descripcion,
              calle: item.calle,
              barrio: item.barrio,
              localidad: item.localidad,
              provincia: item.provincia,
              codigoPostal: item.codigoPostal,
              lngLat: { lng, lat }, // Crear el objeto esperado
              observaciones: item.observaciones,
              activo: item.activo
            } as Departamento;
          } catch (error) {
            // console.error(`Error parseando coordenadas para ${item.nombre}:`, error);
            // console.error('Coordenadas recibidas:', item.lngLat);

            // Coordenadas por defecto (Buenos Aires) si hay error
            return {
              id: item.id,
              idProp: item.idProp,
              nombre: item.nombre,
              descripcion: item.descripcion,
              calle: item.calle,
              barrio: item.barrio,
              localidad: item.localidad,
              provincia: item.provincia,
              codigoPostal: item.codigoPostal,
              lngLat: { lng: -58.3816, lat: -34.6037 }, // Buenos Aires por defecto
              observaciones: item.observaciones,
              activo: item.activo
            } as Departamento;
          }
        });
      }
    }

    // console.log('No hay datos o formato desconocido');
    return [] as Departamento[];
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

}
