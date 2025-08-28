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
      z-index: 50; /* Agregado z-index */
    }

    /* Agregar padding bottom al container principal */
    section.container {
      padding-bottom: 80px;
    }
  `
})
export class AdminComponent { }
