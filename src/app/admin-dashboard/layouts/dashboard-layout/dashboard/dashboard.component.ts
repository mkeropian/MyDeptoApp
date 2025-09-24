import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../../../../shared/components/navbar/navbar.component";
import { FooterComponent } from "../../../../shared/components/footer/footer.component";
import { FooterCardComponent } from '../../../../shared/components/footer-card/footer-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, RouterOutlet, FooterComponent, FooterCardComponent],
  templateUrl: './dashboard.component.html',
  styles: `
    #controls {
      position: fixed;
      bottom: 0px;
      width: 100%;
      height: 70px; /* Define la altura del footer */
      z-index: 10;
    }
    #card-controls {
      position: fixed;
      bottom: 70px;
      width: 100%;
      height: auto; /* Altura automática para el card */
      z-index: 10;
    }

    /* Asegurar que el contenido principal tenga margen suficiente */
    .main-content {
      margin-bottom: 200px; /* Espacio para footer + card (ajusta según necesites) */
      min-height: calc(100vh - 200px); /* Altura mínima considerando los elementos fijos */
    }
  `
})
export class DashboardComponent { }
