import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexYAxis,
  ApexLegend,
  ApexPlotOptions,
  ApexFill,
  ApexTooltip
} from 'ng-apexcharts';
import { EstadisticasReportesService } from '../../../../estadisticasReportes/services/estadisticasReportes.service';
import { Gasto } from '../../../../gastos/interfaces/gasto.interface';

export interface GastoGrid extends Gasto {
  tipoGasto?: string;
  departamento?: string;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  yaxis: ApexYAxis;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  tooltip: ApexTooltip;
  colors: string[];
};

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
  @ViewChild('chart') chart: ChartComponent | undefined;

  public chartOptions: Partial<ChartOptions> | any;
  public gastos: GastoGrid[] = [];
  public loading = false;

  // Flag para reiniciar el gráfico
  public isChartVisible = true;

  public selectedYear: number = new Date().getFullYear();
  public availableYears: number[] = [];

  // Variables para estadísticas
  public totalAnual: number = 0;
  public promedioMensual: number = 0;
  public mesMayorRecaudacion: string = '-';
  public mejorMesMonto: number = 0;

  private meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private estadisticasService: EstadisticasReportesService,
    private cdr: ChangeDetectorRef // Inyectamos el detector de cambios
  ) {
    // Inicialización básica vacía
    this.chartOptions = { series: [], chart: { type: 'bar' } };
  }

  ngOnInit(): void {
    this.loadGastos();
  }

  private loadGastos(): void {
    this.loading = true;
    this.estadisticasService.getGastos().subscribe({
      next: (data) => {
        this.gastos = data;
        this.processGastos();
        this.updateChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando gastos:', err);
        this.loading = false;
      }
    });
  }

  private processGastos(): void {
    const years = new Set<number>();
    this.gastos.forEach(gasto => {
      const fechaStr = String(gasto.fecha);
      const yearStr = fechaStr.substring(0, 4);
      const year = parseInt(yearStr);
      if (!isNaN(year)) years.add(year);
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
    // 1. Calcular datos
    const gastosHonorarios = this.gastos.filter(gasto => {
      const fechaStr = String(gasto.fecha);
      const yearStr = fechaStr.substring(0, 4);
      const yearGasto = parseInt(yearStr);
      return gasto.idTipoGasto === 1 && yearGasto === this.selectedYear;
    });

    const montosPorMes = new Array(12).fill(0);

    gastosHonorarios.forEach(gasto => {
      const fechaStr = String(gasto.fecha);
      const mesStr = fechaStr.substring(5, 7);
      const mesIndex = parseInt(mesStr) - 1;

      if (mesIndex >= 0 && mesIndex <= 11) {
        const monto = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto;
        montosPorMes[mesIndex] += monto;
      }
    });

    // Calcular Estadísticas
    this.totalAnual = montosPorMes.reduce((a, b) => a + b, 0);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    let divisor = 12;
    if (this.selectedYear === currentYear) {
        const currentMonth = currentDate.getMonth() + 1;
        divisor = currentMonth;
    }
    this.promedioMensual = this.totalAnual / (divisor || 1);

    let maxMonto = 0;
    let maxIndex = -1;
    montosPorMes.forEach((monto, index) => {
      if (monto > maxMonto) {
        maxMonto = monto;
        maxIndex = index;
      }
    });
    this.mejorMesMonto = maxMonto;
    this.mesMayorRecaudacion = maxIndex >= 0 ? this.meses[maxIndex] : '-';

    // 2. REINICIO "NUCLEAR" DEL GRÁFICO
    this.isChartVisible = false; // Ocultar
    this.cdr.detectChanges();    // Aplicar cambio

    setTimeout(() => {
      this.generarOpcionesGrafico(montosPorMes); // Crear configuración nueva
      this.isChartVisible = true; // Mostrar
      this.cdr.detectChanges();   // Aplicar cambio
    }, 50); // Pequeño delay imperceptible
  }

  private generarOpcionesGrafico(dataSeries: number[]): void {
    this.chartOptions = {
      series: [{
        name: "Recaudación",
        data: dataSeries
      }],
      chart: {
        height: 350,
        type: "bar",
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        animations: { enabled: false } // Evitar glitches visuales al recargar
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          borderRadius: 4,
          dataLabels: { position: 'top' }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          if (val === 0) return "";
          if (val >= 1000000) return "$" + (val / 1000000).toFixed(1) + "M";
          if (val >= 1000) return "$" + (val / 1000).toFixed(0) + "k";
          return "$" + val;
        },
        offsetY: -20,
        style: { fontSize: '12px', colors: ["#304758"] }
      },
      stroke: { width: 0 },
      grid: { row: { colors: ["#fff", "#f2f2f2"] } },
      xaxis: {
        categories: this.meses,
        labels: {
          rotate: -45,
          style: { fontSize: '12px' }
        }
      },
      yaxis: {
        title: { text: 'Monto ($)' },
        labels: { formatter: (value: number) => "$" + value.toLocaleString('es-AR') }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.25,
          inverseColors: true,
          opacityFrom: 0.85,
          opacityTo: 0.85,
          stops: [50, 0, 100]
        },
      },
      tooltip: {
        y: { formatter: (val: number) => "$ " + val.toLocaleString('es-AR') }
      },
      colors: ['#008FFB']
    };
  }
}
