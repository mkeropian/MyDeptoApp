import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'activoEstado',
  standalone: true
})
export class ActivoEstadoPipe implements PipeTransform {

  transform(value: number | boolean): string {
    return value === 1 || value === true ? 'Sí' : 'No';
  }
}
