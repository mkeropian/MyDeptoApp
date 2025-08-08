import { Component, effect, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { JsonPipe } from '@angular/common';
import { FormComponent } from "./form/form.component";
import { GridComponent } from "../../../shared/components/grid/grid.component";
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';

@Component({
  selector: 'propietarios-admin-page',
  imports: [ FormComponent, GridComponent],
  templateUrl: './propietarios-admin-page.component.html',
})
export class PropietariosAdminPageComponent {

  propietariosService = inject(PropietariosService);
  propietariosResource = rxResource({
    request: () => ({}),
    loader: () => this.propietariosService.getPropietarios()
  });

}