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

  public chartOptions: ChartOptions;
  public gastos: GastoGrid[] = [];
  public loading = false;

  public selectedYear: number = new Date().getFullYear();
  public availableYears: number[] = [];

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
    private cdr: ChangeDetectorRef
  ) {
    // Configuración Inicial Completa
    this.chartOptions = {
      series: [{ name: "Recaudación", data: [] }],
      chart: {
        type: "bar",
        height: 350,
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        // CORRECCIÓN: Quitamos 'easing' para evitar el error de TypeScript
        animations: { enabled: true, speed: 800 }
      },
      plotOptions: {
        bar: { columnWidth: '50%', borderRadius: 4, dataLabels: { position: 'top' } }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          if (val === 0) return "";
          if (val >= 1000000) return "$" + (val / 1000000).toFixed(1) + "M";
          if (val >= 1000) return "$" + (val / 1000).toFixed(0) + "k";
          return "$" + val;
        },
        offsetY: -20,
        style: { fontSize: '12px', colors: ["#304758"] }
      },
      xaxis: {
        categories: this.meses,
        labels: { rotate: -45, style: { fontSize: '12px' } }
      },
      yaxis: {
        title: { text: 'Monto ($)' },
        labels: { formatter: (val: number) => "$" + val.toLocaleString('es-AR') }
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
      grid: { row: { colors: ["#fff", "#f2f2f2"] } },
      stroke: { width: 0 },
      title: { text: undefined },
      legend: { show: false },
      colors: ['#008FFB']
    };
  }

  ngOnInit(): void {
    this.loadGastos();
  }

  private loadGastos(): void {
    this.loading = true;
    this.estadisticasService.getGastos().subscribe({
      next: (data) => {
        this.gastos = data;
        this.processYears();
        this.updateChartData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando gastos:', err);
        this.loading = false;
      }
    });
  }

  // --- PARSER DE FECHA UNIVERSAL ---
  private getFechaInfo(fecha: any): { year: number, month: number } | null {
    if (!fecha) return null;

    // Caso 1: Objeto Date real
    if (fecha instanceof Date) {
       return { year: fecha.getUTCFullYear(), month: fecha.getUTCMonth() };
    }

    const str = String(fecha).trim();

    // Caso 2: String ISO o DD/MM/YYYY
    const yearMatch = str.match(/\d{4}/);
    if (!yearMatch) return null;

    const year = parseInt(yearMatch[0]);

    // Eliminar hora
    const datePart = str.split('T')[0];
    const parts = datePart.split(/[-/]/);

    let month = -1;

    // Detectar mes
    if (parts.length >= 2) {
      const yearIndex = parts.findIndex(p => p.includes(year.toString()));

      if (yearIndex !== -1 && parts.length >= 3) {
         month = parseInt(parts[1]) - 1;
      } else if (yearIndex === 0 && parts.length === 2) {
         month = parseInt(parts[1]) - 1;
      }
    }

    // Validación y Fallback
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
       const d = new Date(str);
       if (!isNaN(d.getTime())) {
         return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
       }
       return null;
    }

    return { year, month };
  }

  private processYears(): void {
    const years = new Set<number>();
    this.gastos.forEach(gasto => {
      const info = this.getFechaInfo(gasto.fecha);
      if (info) years.add(info.year);
    });

    this.availableYears = Array.from(years).sort((a, b) => b - a);

    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }
  }

  public onYearChange(): void {
    this.updateChartData();
  }

  private updateChartData(): void {
    const montosPorMes = new Array(12).fill(0);

    console.log(`Procesando datos para año: ${this.selectedYear}`);
    let encontrados = 0;

    this.gastos.forEach(gasto => {
      if (gasto.idTipoGasto === 1) {
        const info = this.getFechaInfo(gasto.fecha);

        if (info && info.year === this.selectedYear) {
          if (info.month >= 0 && info.month <= 11) {
             const monto = Number(gasto.monto || 0);
             montosPorMes[info.month] += monto;
             encontrados++;
          }
        }
      }
    });

    console.log(`Registros encontrados: ${encontrados}`, montosPorMes);

    // Métricas
    this.totalAnual = montosPorMes.reduce((a, b) => a + b, 0);

    const currentDate = new Date();
    const isCurrentYear = this.selectedYear === currentDate.getFullYear();
    const divisor = isCurrentYear ? (currentDate.getMonth() + 1) : 12;
    this.promedioMensual = this.totalAnual > 0 ? (this.totalAnual / divisor) : 0;

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

    // Actualización del gráfico
    if (this.chart) {
      this.chart.updateSeries([{
        name: "Recaudación",
        data: montosPorMes
      }]);
    } else {
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: "Recaudación",
          data: montosPorMes
        }]
      };
    }

    this.cdr.detectChanges();
  }
}
