import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../../../../shared/components/navbar/navbar.component";
import { FooterComponent } from "../../../../shared/components/footer/footer.component";
import { FooterCardComponent } from '../../../../shared/components/footer-card/footer-card/footer-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, RouterOutlet, FooterComponent, FooterCardComponent],
  templateUrl: './dashboard.component.html',
  styles: `
    #controls {
      position: fixed;
      bottom: 0px;
      width: 100%;
    }
    #card-controls {
      position: fixed;
      bottom: 70px;
      width: 100%;
    }
  `
})
export class DashboardComponent { }
