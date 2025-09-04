import { AfterViewInit, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Departamento, DepartamentoBackend } from '../../../departamentos/interfaces/departamento.interface';
import { v4 as UUIDv4 } from 'uuid';
import { MiniMapComponent } from "../../../shared/components/mini-map/mini-map.component";
import { FormComponent } from "./form/form.component";
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { TableAction, TableColumn } from '../../../shared/components/smart-grid/smart-grid.interface';
import { SmartGridComponent } from "../../../shared/components/smart-grid/smart-grid.component";
import mapboxgl from 'mapbox-gl';
import { last } from 'rxjs';

interface Marker {
  id: number;
  nombre: string;
  mapboxMarker: mapboxgl.Marker;
}

@Component({
  selector: 'departamentos-admin-page',
  imports: [FormComponent, SmartGridComponent],
  templateUrl: './departamentos-admin-page.component.html',
  styles: `
	.map-container {
		z-index: 1;
	}
  `
})
export class DepartamentosAdminPageComponent implements AfterViewInit {
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
  buenosAiresCoords = () => ({ lng: -58.433160, lat: -34.612762 });

  divElement = viewChild<ElementRef>('map');
  formComponent = viewChild<FormComponent>('formComponent');
  map = signal<mapboxgl.Map | null>(null);
  markers = signal<Marker[]>([]);

  // 🔥 NUEVA FUNCIONALIDAD: Marcador para el nuevo departamento (temporal)
  newDepartmentMarker = signal<mapboxgl.Marker | null>(null);

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

  // 🔥 NUEVA FUNCIONALIDAD: Método para validar coordenadas
  private isValidCoordinate(coords: { lng: number; lat: number }): boolean {
    return !isNaN(coords.lng) &&
           !isNaN(coords.lat) &&
           coords.lng >= -180 &&
           coords.lng <= 180 &&
           coords.lat >= -90 &&
           coords.lat <= 90;
  }

  // 🔥 NUEVA FUNCIONALIDAD: Método para actualizar el mapa con nuevas coordenadas
  private updateMapWithNewCoordinates(coordinates: { lng: number; lat: number }): void {
    const map = this.map();
    if (!map) return;

    // Remover marcador anterior si existe
    const existingMarker = this.newDepartmentMarker();
    if (existingMarker) {
      existingMarker.remove();
    }

    // Crear nuevo marcador
    const newMarker = new mapboxgl.Marker({
      color: '#ff6b6b', // Color distintivo para el nuevo departamento
      draggable: false
    })
    .setLngLat([coordinates.lng, coordinates.lat])
    .addTo(map);

    // Guardar referencia al marcador
    this.newDepartmentMarker.set(newMarker);

    // Centrar el mapa en las nuevas coordenadas
    map.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: 15, // Zoom más cercano para ver el detalle
      duration: 1000 // Animación de 1 segundo
    });
  }

  // 🔥 NUEVA FUNCIONALIDAD: Método público para ser llamado desde el FormComponent
  public onCoordinatesChange(coordinatesString: string): void {
    if (!coordinatesString || coordinatesString.trim() === '') {
      // Si no hay coordenadas, remover marcador y volver a Buenos Aires
      const existingMarker = this.newDepartmentMarker();
      if (existingMarker) {
        existingMarker.remove();
        this.newDepartmentMarker.set(null);
      }

      // Volver a centrar en Buenos Aires
      const map = this.map();
      if (map) {
        map.flyTo({
          center: [this.buenosAiresCoords().lng, this.buenosAiresCoords().lat],
          zoom: 10.3,
          duration: 1000
        });
      }
      return;
    }

    try {
      // Usar el parser inteligente
      const coordinates = this.parseCoordinatesIntelligent(coordinatesString);

      if (coordinates && this.isValidCoordinate(coordinates)) {
        this.updateMapWithNewCoordinates(coordinates);
      }
    } catch (error) {
      console.error('Error parseando coordenadas:', error);
    }
  }

  // 🔥 NUEVA FUNCIONALIDAD: Parser inteligente para el componente padre
  private parseCoordinatesIntelligent(coordinatesString: string): { lng: number; lat: number } | null {
    if (!coordinatesString || coordinatesString.trim() === '') {
      return null;
    }

    try {
      const coords = coordinatesString.split(',').map((coord: string) => parseFloat(coord.trim()));

      if (coords.length !== 2 || coords.some(coord => isNaN(coord))) {
        return null;
      }

      const [first, second] = coords;

      // Determinar el formato basado en los rangos típicos
      // Si el primer número es mayor que 90 o menor que -90, probablemente es longitud
      const isFirstLng = Math.abs(first) > 90;
      const isSecondLat = Math.abs(second) <= 90;

      // Si parece lng,lat
      if (isFirstLng && isSecondLat && first >= -180 && first <= 180 && second >= -90 && second <= 90) {
        return { lng: first, lat: second };
      }

      // Si parece lat,lng (caso más común de confusión)
      const isFirstLat = Math.abs(first) <= 90;
      const isSecondLng = Math.abs(second) > 90;

      if (isFirstLat && isSecondLng && first >= -90 && first <= 90 && second >= -180 && second <= 180) {
        console.log(`🔄 Coordenadas convertidas automáticamente de lat,lng a lng,lat: ${first},${second} -> ${second},${first}`);
        return { lng: second, lat: first };
      }

      // Fallback: asumir lng,lat si ambos están en rangos válidos
      if ((first >= -180 && first <= 180) && (second >= -90 && second <= 90)) {
        return { lng: first, lat: second };
      }

      return null;
    } catch (error) {
      return null;
    }
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

  async ngAfterViewInit(){
    if ( !this.divElement()?.nativeElement ) return;

    await new Promise((resolve) => setTimeout(resolve, 80));

    const element = this.divElement()!.nativeElement;
    // console.log(element);

    const map = new mapboxgl.Map({
      container: element, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [this.buenosAiresCoords().lng, this.buenosAiresCoords().lat], // starting position [lng, lat]
      zoom: 10.3, // starting zoom
      dragPan: false,
      dragRotate: false,
      doubleClickZoom: false,
      keyboard: false,
      touchZoomRotate: false,
      touchPitch: false,
      scrollZoom: false
    });

    this.mapListeners(map);
  }

  mapListeners( map: mapboxgl.Map ) {

    map.on('click', (event) => this.mapClick(event));

    this.map.set(map);

  }

  mapClick(event: mapboxgl.MapMouseEvent) {
    if ( !this.map() ) return;

    const map = this.map()!;
    const coords = event.lngLat;
    const color = '#xxxxxx'.replace(/x/g, (y) =>
      ((Math.random() * 16) | 0).toString(16)
    );

    const mapboxMarker = new mapboxgl.Marker({
      color: color,
      draggable: false
    })
    .setLngLat( coords )
    .addTo(map);

    const newMarker: Marker = {
      id: 1,
      nombre: UUIDv4().slice(0,8),
      mapboxMarker: mapboxMarker
    }

    this.markers.set([ newMarker, ...this.markers()]);
    // this.markers.update((markers) => [newMarker, ...markers]);
  }

}
