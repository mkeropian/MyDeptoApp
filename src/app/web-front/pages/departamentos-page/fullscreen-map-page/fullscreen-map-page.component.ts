import { AfterViewInit, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import mapboxgl, { LngLatLike } from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { DecimalPipe, JsonPipe } from '@angular/common';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Departamento, DepartamentoBackend } from '../../../../departamentos/interfaces/departamento.interface';

mapboxgl.accessToken = environment.MAPBOX_KEY;

interface Marker {
  id: number;
  nombre: string;
  mapboxMarker: mapboxgl.Marker;
}

@Component({
  selector: 'app-fullscreen-map-page',
  imports: [ DecimalPipe, JsonPipe ],
  templateUrl: './fullscreen-map-page.component.html',
  styles: `

    :host {
      display: block;
      position: relative;
      margin-left: calc(-50vw + 50%);
      margin-right: calc(-50vw + 50%);
      width: 100vw;
      height: calc(100vh - 64px - 80px);
      margin-bottom: 0;
    }

    .map-container {
      height: calc(100vh - 64px - 80px);
      width: 100vw;
      position: relative;
      z-index: 1;
    }

    .markers-section {
      position: absolute;
      top: 20px;
      left: 20px;
      width: 260px;
      max-height: calc(100vh - 64px - 80px - 120px);
      background: white;
      border-radius: 8px;
      padding: 20px;
      overflow-y: auto;
      z-index: 10;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    #controls {
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 10;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      width: 250px;
    }

    @media (max-width: 640px) {
      :host {
        height: calc(100vh - 56px - 60px);
      }

      .map-container {
        height: calc(100vh - 56px - 60px);
      }

      .markers-section {
        width: calc(100% - 40px);
        max-height: calc(100vh - 56px - 60px - 120px);
      }

      #controls {
        width: calc(100% - 40px);
      }
    }

  `
})
export class FullscreenMapPageComponent implements AfterViewInit{

  departamentosService = inject(DepartamentosService);
  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosRaw()
  });

  departamentos = computed(() => {
    const backendData: DepartamentoBackend[] = this.departamentosResource.value() || [];

    // Transformar los datos del backend a la interfaz Departamento
    const transformedData: Departamento[] = backendData.map(item => {
      try {
        // Parsear las coordenadas "lng,lat" a objeto
        const [lng, lat] = item.lnglat.split(',').map(coord => parseFloat(coord.trim()));

        // Validar que las coordenadas sean números válidos
        if (isNaN(lng) || isNaN(lat)) {
          throw new Error('Coordenadas inválidas');
        }

        return {
          id: item.id,
          idProp: item.idProp.toString(),
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
        };
      } catch (error) {
        console.error(`Error parseando coordenadas para ${item.nombre}:`, error);
        console.error('Coordenadas recibidas:', item.lnglat);

        // Coordenadas por defecto (Buenos Aires) si hay error
        return {
          id: item.id,
          idProp: item.idProp.toString(),
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
        };
      }
    });

    console.log('Datos del backend:', backendData);
    console.log('Departamentos transformados:', transformedData);
    return transformedData;
  });

  divElement = viewChild<ElementRef>('map');
  map = signal<mapboxgl.Map | null>(null);
  markers = signal<Marker[]>([]);
  zoom = signal (11.5);

  coordinates = signal({
    lng: -58.45448220687902,
    lat: -34.61952696041838,
  });

  zoomEffect = effect(() => {
    if ( !this.map() ) return;
    this.map()?.setZoom(this.zoom());
    // this.map()?.zoomTo(this.zoom());
  });

  async ngAfterViewInit(){
    if ( !this.divElement()?.nativeElement ) return;

    await new Promise((resolve) => setTimeout(resolve, 80));

    const element = this.divElement()!.nativeElement;
    console.log(element);

    const { lat, lng } = this.coordinates();

    const map = new mapboxgl.Map({
      container: element, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [ lng, lat ], // starting position [lng, lat]
      zoom: this.zoom(), // starting zoom
    });

    this.mapListeners(map);
  }

  mapListeners( map: mapboxgl.Map ) {

    map.on('zoomend', (event) => {
      const newZoom = event.target.getZoom();
      this.zoom.set(newZoom);
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      this.coordinates.set(center);
    });

    map.on('load', ()=> {
      console.log('Map loaded');

    });

    // Crear markers cuando el mapa esté listo
    setTimeout(() => {
      this.createMarkersFromDepartamentos();
    }, 100);

    map.addControl(new mapboxgl.FullscreenControl());
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.ScaleControl());

    this.map.set(map);
  }

  flyToMarker ( lngLat: LngLatLike ){
    if ( !this.map() ) return;

    this.map()!.flyTo({
      center: lngLat,
      zoom: 16,
      speed: 0.5
    });
  }

  clearMarkers() {
    const currentMarkers = this.markers();

    currentMarkers.forEach(marker => {
      marker.mapboxMarker.remove();
    });

    this.markers.set([]);
  }

  createMarkersFromDepartamentos() {
    const map = this.map();
    if (!map) {
      console.warn('El mapa no está inicializado aún');
      return;
    }

    const departamentos = this.departamentos();
    if (!departamentos || departamentos.length === 0) {
      console.warn('No hay departamentos para mostrar');
      // Retry después de un tiempo si los datos aún no están listos
      setTimeout(() => {
        if (this.departamentos().length > 0) {
          this.createMarkersFromDepartamentos();
        }
      }, 500);
      return;
    }

    // Limpiar markers existentes sin actualizar el signal aún
    const currentMarkers = this.markers();
    currentMarkers.forEach(marker => {
      marker.mapboxMarker.remove();
    });

    const newMarkers: Marker[] = [];

    departamentos.forEach(departamento => {
      try {
        const { lng, lat } = departamento.lngLat;

        // Crear el marker de Mapbox
        const mapboxMarker = new mapboxgl.Marker({
          color: departamento.activo ? this.getMarkerColor() : '#000000',
          draggable: false,
          scale: 0.8
        })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="font-family: Arial, sans-serif;">
                  <h4 style="margin: 0 0 8px 0; color: #2563eb;">${departamento.nombre}</h4>
                  <p style="margin: 4px 0; font-size: 14px;"><strong>ID:</strong> ${departamento.idProp}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><strong>Descripción:</strong> ${departamento.descripcion}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><strong>Dirección:</strong> ${departamento.calle}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><strong>Barrio:</strong> ${departamento.barrio}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><strong>Localidad:</strong> ${departamento.localidad}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><strong>Provincia:</strong> ${departamento.provincia}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><strong>CP:</strong> ${departamento.codigoPostal}</p>
                  ${departamento.observaciones ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Observaciones:</strong> ${departamento.observaciones}</p>` : ''}
                  <p style="margin: 4px 0; font-size: 12px; color: ${departamento.activo ? '#16a34a' : '#dc2626'};">
                    <strong>Estado:</strong> ${departamento.activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              `)
          )
          .addTo(map);

        // Agregar event listener para el click
        mapboxMarker.getElement().addEventListener('click', () => {
          console.log('Clicked departamento:', departamento);
        });

        const marker: Marker = {
          id: departamento.id,
          nombre: departamento.nombre,
          mapboxMarker: mapboxMarker
        };

        newMarkers.push(marker);

      } catch (error) {
        console.error(`Error creando marker para departamento ${departamento.nombre}:`, error);
      }
    });

    // Actualizar el signal solo al final
    this.markers.set(newMarkers);

    console.log(`Se crearon ${newMarkers.length} markers en el mapa`);
  }

  // Método para refrescar markers manualmente si es necesario
  refreshMarkers() {
    this.createMarkersFromDepartamentos();
  }

  getMarkerColor(){
    const color = '#xxxxxx'.replace(/x/g, (y) =>
      ((Math.random() * 16) | 0).toString(16)
    );
    return color;
  }


}
