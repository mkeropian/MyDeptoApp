import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-web-front',
  imports: [ RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './web-front.component.html',
  styles: `
    #controls {
      position: fixed;
      bottom: 0px;
      width: 100%;
    }
  `  
})
export class WebFrontComponent { }
