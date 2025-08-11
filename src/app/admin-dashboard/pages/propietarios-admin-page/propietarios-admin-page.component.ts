import { Component, effect, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { JsonPipe } from '@angular/common';
import { FormComponent } from "./form/form.component";
import { GridPropietariosComponent } from "../../../shared/components/grid-propietarios/grid-propietarios.component";

@Component({
  selector: 'propietarios-admin-page',
  imports: [FormComponent, GridPropietariosComponent],
  templateUrl: './propietarios-admin-page.component.html',
})
export class PropietariosAdminPageComponent {

  propietariosService = inject(PropietariosService);
  propietariosResource = rxResource({
    request: () => ({}),
    loader: () => this.propietariosService.getPropietarios()
  });

}
