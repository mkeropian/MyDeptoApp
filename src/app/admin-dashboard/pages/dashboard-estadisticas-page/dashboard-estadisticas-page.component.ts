import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-dashboard-estadisticas-page',
  imports: [RouterLink],
  templateUrl: './dashboard-estadisticas-page.component.html',
  styles: [`
      .compact-card-body {
        padding: 15px 15px 10px 20px !important;
      }
      .compact-card-body p {
        margin-bottom: 0 !important;
        line-height: 1.2 !important;
      }
    `]
})
export class DashboardEstadisticasPageComponent { }
