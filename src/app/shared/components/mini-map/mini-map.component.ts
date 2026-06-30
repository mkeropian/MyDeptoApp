import { AfterViewInit, Component, ElementRef, input, viewChild } from '@angular/core';
import maplibregl from 'maplibre-gl';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'mini-map',
  imports: [],
  templateUrl: './mini-map.component.html',
  styles: `
    :host {
      display: block;
    }

    .map-div {
      width: 100%;
      height: 100%;
      background-color: #f0f0f0;
      position: relative;
    }
  `
})
export class MiniMapComponent implements AfterViewInit {
  divElement = viewChild<ElementRef>('map');

  lngLat = input.required<{ lng: number; lat: number }>();
  mapZoom = input<number>(14);
  showMarker = input<boolean>(true); // Nuevo input para controlar el marcador

  height = input<string>('400px');
  width = input<string>('100%');

  async ngAfterViewInit(){
    // console.log('MiniMapComponent - ngAfterViewInit iniciado');
    // console.log('MiniMapComponent - divElement:', this.divElement());
    // console.log('MiniMapComponent - lngLat input:', this.lngLat());
    // console.log('MiniMapComponent - showMarker:', this.showMarker());

    if (!this.divElement()?.nativeElement) {
      // console.error('MiniMapComponent - No se encontró el elemento div del mapa');
      return;
    }

    // Validar que lngLat tenga valores válidos
    const coordinates = this.lngLat();
    // console.log('MiniMapComponent - Validando coordenadas:', coordinates);

    if (!coordinates ||
        typeof coordinates.lng !== 'number' ||
        typeof coordinates.lat !== 'number' ||
        isNaN(coordinates.lng) ||
        isNaN(coordinates.lat)) {
      // console.error('MiniMapComponent - Coordenadas inválidas:', coordinates);
      return;
    }

    // console.log('MiniMapComponent - Coordenadas válidas, esperando 80ms...');
    await new Promise((resolve) => setTimeout(resolve, 80));

    const element = this.divElement()!.nativeElement;
    // console.log('MiniMapComponent - Elemento del DOM:', element);

    try {
      // console.log('MiniMapComponent - Creando mapa con coordenadas:', [coordinates.lng, coordinates.lat]);

      const map = new maplibregl.Map({
        container: element,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${environment.MAPTILER_KEY}`,
        center: [coordinates.lng, coordinates.lat],
        zoom: this.mapZoom(),
        interactive: false,
        pitch: 30,
      });

      // console.log('MiniMapComponent - Mapa creado');

      // Solo agregar marcador si showMarker es true
      if (this.showMarker()) {
        // console.log('MiniMapComponent - Agregando marker...');
        new maplibregl.Marker()
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(map);
        // console.log('MiniMapComponent - Marker agregado exitosamente');
      } else {
        // console.log('MiniMapComponent - Mapa sin marcador');
      }

      // Agregar evento para saber cuando el mapa se carga
      map.on('load', () => {
        // console.log('MiniMapComponent - Mapa cargado completamente');
      });

      map.on('error', (e) => {
        // console.error('MiniMapComponent - Error en el mapa:', e);
      });

    } catch (error) {
      // console.error('MiniMapComponent - Error inicializando el mapa:', error);
      // console.error('MiniMapComponent - Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    }
  }
}
