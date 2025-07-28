import { Component, signal } from '@angular/core';
import { MiniMapComponent } from "../../../../shared/components/mini-map/mini-map.component";
import { v4 as uuid } from 'uuid';
import { GridComponent } from '../../../../shared/components/grid/grid.component';
import { HouseProperty } from '../../../../departamentos/interfaces/departamento.interface';


@Component({
  selector: 'app-departamentos-page',
  imports: [MiniMapComponent, GridComponent],
  templateUrl: './departamentos-page.component.html',
})
export class DepartamentosPageComponent {

  houses = signal<HouseProperty[]>([
    {
      id: uuid(),
      name: 'Villa Serenidad',
      description:
        'Un refugio tranquilo con vistas panorámicas al mar y jardines exuberantes.',
      price: 500_000,
      lngLat: { lng: -0.861526, lat: 41.65649 },
      tags: ['Villa', 'Mar', 'Jardines'],
    }
  ]);
}
