import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
  selector: 'app-calendario-empleados',
  imports: [
    NavbarComponent,
    FooterComponent,
    RouterOutlet,
  ],
  templateUrl: './calendario-empleados.component.html',
  styles: `
    #controls {
      position: fixed;
      bottom: 0px;
      width: 100%;
    }
  `
})
export class CalendarioEmpleadosComponent { }
