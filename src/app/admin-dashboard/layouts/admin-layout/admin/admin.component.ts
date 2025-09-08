import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../../../../shared/components/navbar/navbar.component";
import { FooterComponent } from "../../../../shared/components/footer/footer.component";

@Component({
  selector: 'app-admin',
  imports: [NavbarComponent, RouterOutlet, FooterComponent],
  templateUrl: './admin.component.html',
  styles: `
    #controls {
      position: fixed;
      bottom: 0px;
      width: 100%;
      height: 70px; /* Define la altura del footer */
      z-index: 10;
    }

    /* Agregar padding bottom al container principal */
    section.container {
      margin-bottom: 200px; /* Espacio para footer + card (ajusta según necesites) */
      min-height: calc(100vh - 200px); /* Altura mínima considerando los elementos fijos */
    }
  `
})
export class AdminComponent { }
