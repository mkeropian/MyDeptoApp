import { Component, input } from '@angular/core';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';

@Component({
  selector: 'grid-propietarios',
  imports: [],
  templateUrl: './grid-propietarios.component.html',
})
export class GridPropietariosComponent {
  rows = input.required<Propietario[]>();
}
