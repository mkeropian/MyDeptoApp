import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { EstadisticasReportesService } from '../../../../estadisticasReportes/services/estadisticasReportes.service';
import { Gasto } from '../../../../gastos/interfaces/gasto.interface';

export interface GastoGrid extends Gasto {
  tipoGasto?: string;
  departamento?: string;
}

@Component({
  selector: 'app-recaudacion-mensual-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule
  ],
  templateUrl: './recaudacionMensual-page.component.html',
  styleUrls: ['./recaudacionMensual-page.component.css']
})
export class RecaudacionMensualPageComponent implements OnInit {

  public chartOptions: any;
  public gastos: GastoGrid[] = [];
  public loading = false;
  public selectedYear: number = new Date().getFullYear();
  public availableYears: number[] = [];

  // Nombres de los meses en español
  private meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private estadisticasService: EstadisticasReportesService
  ) {
    this.initChartOptions();
  }

  ngOnInit(): void {
    this.loadGastos();
  }

  private initChartOptions(): void {
    this.chartOptions = {
      series: [{
        name: 'Honorarios',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      }],
      chart: {
        type: 'bar',
        height: 350,
        width: '100%'
      },
      plotOptions: {
        bar: {
          horizontal: true
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          // CORRECCIÓN: No convertir a string aquí, dejar que ApexCharts maneje el número
          if (val === 0 || val === null || val === undefined) return '';
          return '$' + val.toLocaleString('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          });
        }
      },
      xaxis: {
        categories: this.meses,
        labels: {
          formatter: (val: string) => {
            // CORRECCIÓN: val viene como string, convertir a número primero
            const numVal = parseFloat(val);
            if (isNaN(numVal)) return val;
            return '$' + numVal.toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            });
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            if (val === 0 || val === null || val === undefined) return '$0';
            return '$' + val.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
        }
      },
      legend: {
        position: 'right',
        fontSize: '12px',
        width: 100,
        offsetX: 10,
        offsetY: 50,
        markers: {
          width: 8,
          height: 8
        },
        itemMargin: {
          horizontal: 3,
          vertical: 3
        }
      }
    };
  }

  private loadGastos(): void {
    this.loading = true;

    this.estadisticasService.getGastos().subscribe({
      next: (gastos: GastoGrid[]) => {
        this.gastos = gastos;
        this.extractAvailableYears();
        this.updateChart();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar gastos:', error);
        this.loading = false;
      }
    });
  }

  private extractAvailableYears(): void {
    const years = new Set<number>();

    this.gastos.forEach(gasto => {
      const year = new Date(gasto.fecha).getFullYear();
      if (!isNaN(year)) {
        years.add(year);
      }
    });

    this.availableYears = Array.from(years).sort((a, b) => b - a);

    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }
  }

  public onYearChange(): void {
    this.updateChart();
  }

  private updateChart(): void {
    // Filtrar gastos con idTipoGasto = 1 para el año seleccionado
    const gastosHonorarios = this.gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha);
      const yearGasto = fechaGasto.getFullYear();
      return gasto.idTipoGasto === 1 && yearGasto === this.selectedYear;
    });

    // Inicializar array con 12 meses, todos en 0
    const montosPorMes = new Array(12).fill(0);

    // Sumar los montos por mes
    gastosHonorarios.forEach(gasto => {
      const mes = new Date(gasto.fecha).getMonth(); // 0-11
      if (mes >= 0 && mes <= 11) {
        // Asegurar que estamos sumando números, no strings
        const monto = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto;
        montosPorMes[mes] += monto;
      }
    });

    // Actualizar el gráfico con los nuevos datos
    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: 'Honorarios',
        data: montosPorMes
      }]
    };
  }
}
