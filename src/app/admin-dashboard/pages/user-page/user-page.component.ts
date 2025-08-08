import { Component } from '@angular/core';
import { GridComponent } from "../../../shared/components/grid/grid.component";
import { FormComponent } from './form/form.component';

@Component({
  selector: 'app-user-page',
  imports: [FormComponent, GridComponent],
  templateUrl: './user-page.component.html',
})
export class UserPageComponent { }
