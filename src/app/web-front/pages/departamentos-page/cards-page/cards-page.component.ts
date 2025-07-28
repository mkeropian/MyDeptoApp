import { Component, signal } from '@angular/core';
import { MiniMapComponent } from '../../../../shared/components/mini-map/mini-map.component';
import { v4 as uuid } from 'uuid';
import { HouseProperty } from '../../../../departamentos/interfaces/departamento.interface';

@Component({
  selector: 'app-cards-page',
  imports: [MiniMapComponent],
  templateUrl: './cards-page.component.html',
})
export class CardsPageComponent {

  houses = signal<HouseProperty[]>([
    {
      id: uuid(),
      name: 'Villa Serenidad',
      description:
        'Un refugio tranquilo con vistas panorámicas al mar y jardines exuberantes.',
      price: 500_000,
      lngLat: { lng: -0.861526, lat: 41.65649 },
      tags: ['Villa', 'Mar', 'Jardines'],
    },
    {
      id: uuid(),
      name: 'Casa del Sol',
      description:
        'Una casa luminosa y acogedora con amplias terrazas y piscina privada.',
      price: 750_000,
      lngLat: { lng: -0.862, lat: 41.657 },
      tags: ['Casa', 'Sol', 'Terrazas'],
    },
    {
      id: uuid(),
      name: 'Residencia Esmeralda',
      description:
        'Elegante propiedad con acabados de lujo y un diseño arquitectónico moderno.',
      price: 1_200_000,
      lngLat: { lng: -0.863, lat: 41.658 },
      tags: ['Casa', 'Esmeralda', 'Acabados'],
    },
    {
      id: uuid(),
      name: 'Hacienda del Lago',
      description:
        'Encantadora hacienda con acceso directo al lago y un entorno natural impresionante.',
      price: 950_000,
      lngLat: { lng: -0.864, lat: 41.659 },
      tags: ['Casa', 'Lago', 'Hacienda'],
    },
  ]);
}
