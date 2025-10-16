import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../../../../shared/components/navbar/navbar.component";
import { FooterComponent } from "../../../../shared/components/footer/footer.component";

@Component({
  selector: 'app-admin',
  imports: [NavbarComponent, RouterOutlet, FooterComponent],
  templateUrl: './admin.component.html',
styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    section.main-content {
      flex: 1;
      padding-bottom: 90px; /* Espacio para el footer */
      overflow-y: auto;
    }

    #controls {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      z-index: 50;
    }
  `
})
export class AdminComponent { }
