import { Component, signal } from '@angular/core';
import { MiniMapComponent } from '../../../../shared/components/mini-map/mini-map.component';
import { v4 as uuid } from 'uuid';
import { Departamento } from '../../../../departamentos/interfaces/departamento.interface';

@Component({
  selector: 'app-cards-page',
  imports: [MiniMapComponent],
  templateUrl: './cards-page.component.html',
})
export class CardsPageComponent {

  houses = signal<Departamento[]>([
    {
      idProp: uuid(),
      nombre: 'Villa Serenidad',
      descripcion:
        'Un refugio tranquilo con vistas panorámicas al mar y jardines exuberantes.',
      lngLat: { lng: -0.861526, lat: 41.65649 },
      id : 0,
      calle : '',
      barrio : '',
      localidad : '',
      provincia : '',
      codigoPostal : '',
      observaciones : '',
      activo : 0,
    },
    {
      idProp: uuid(),
      nombre: 'Casa del Sol',
      descripcion:
        'Una casa luminosa y acogedora con amplias terrazas y piscina privada.',
      lngLat: { lng: -0.862, lat: 41.657 },
      id : 0,
      calle : '',
      barrio : '',
      localidad : '',
      provincia : '',
      codigoPostal : '',
      observaciones : '',
      activo : 0,
    },
    {
      idProp: uuid(),
      nombre: 'Residencia Esmeralda',
      descripcion:
        'Elegante propiedad con acabados de lujo y un diseño arquitectónico moderno.',
      lngLat: { lng: -0.863, lat: 41.658 },
      id : 0,
      calle : '',
      barrio : '',
      localidad : '',
      provincia : '',
      codigoPostal : '',
      observaciones : '',
      activo : 0,
    },
    {
      idProp: uuid(),
      nombre: 'Hacienda del Lago',
      descripcion:
        'Encantadora hacienda con acceso directo al lago y un entorno natural impresionante.',
      lngLat: { lng: -0.864, lat: 41.659 },
      id : 0,
      calle : '',
      barrio : '',
      localidad : '',
      provincia : '',
      codigoPostal : '',
      observaciones : '',
      activo : 0,
    },
  ]);
}
