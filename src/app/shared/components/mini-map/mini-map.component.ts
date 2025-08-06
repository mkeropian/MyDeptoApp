import { AfterViewInit, Component, ElementRef, input, viewChild } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../environments/environment';

mapboxgl.accessToken = environment.MAPBOX_KEY;

@Component({
  selector: 'mini-map',
  imports: [],
  templateUrl: './mini-map.component.html',
  styles: `
    div {
      width: 100%;
      height: 260px;
    }
  `
})
export class MiniMapComponent {
  divElement = viewChild<ElementRef>('map');

  lngLat = input.required<{ lng: number; lat: number }>();
  mapZoom = input<number>(14);

  async ngAfterViewInit(){
    if ( !this.divElement()?.nativeElement ) return;

    await new Promise((resolve) => setTimeout(resolve, 80));

    const element = this.divElement()!.nativeElement;

    const map = new mapboxgl.Map({
      container: element, // container ID
      style: 'mapbox://styles/mapbox/streets-v12',
      center: this.lngLat(),
      zoom: this.mapZoom(),
      interactive: false,
      pitch: 30,
    });

    new mapboxgl.Marker().setLngLat(this.lngLat()).addTo(map);
  }
}
