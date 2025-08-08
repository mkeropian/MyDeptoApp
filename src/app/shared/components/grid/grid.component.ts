import { Component, input } from '@angular/core';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';

@Component({
  selector: 'app-grid',
  imports: [],
  templateUrl: './grid.component.html',
})
export class GridComponent {
  rows = input.required<Propietario[]>();
}
