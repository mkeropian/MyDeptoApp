import { Component, inject, signal } from '@angular/core';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import { v4 as uuid } from 'uuid';
import { MiniMapComponent } from "../../../shared/components/mini-map/mini-map.component";
import { GridComponent } from "../../../shared/components/grid/grid.component";
import { FormComponent } from "./form/form.component";
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'departamentos-admin-page',
  imports: [MiniMapComponent, GridComponent, FormComponent],
  templateUrl: './departamentos-admin-page.component.html',
})
export class DepartamentosAdminPageComponent {
  departamentosService = inject(DepartamentosService);
  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentos()
  });

  houses = signal<Departamento[]>([
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
