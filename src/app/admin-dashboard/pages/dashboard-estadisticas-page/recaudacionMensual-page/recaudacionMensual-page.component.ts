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
    this.chartOptions = {
      series: [{ name: "Recaudación", data: [] }],
      chart: {
        type: "bar",
        height: 650,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          },
          offsetY: -10
        },
        animations: {
          enabled: true,
          speed: 1200,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '75%',
          borderRadius: 8,
          borderRadiusApplication: 'end',
          dataLabels: {
            position: 'top'
          },
          distributed: true
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          if (val === 0) return "";
          return '$' + val.toLocaleString('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
        },
        offsetX: 8,
        style: {
          fontSize: '13px',
          colors: ["#1a202c"],
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif'
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 6,
          borderRadius: 4,
          borderWidth: 0,
          opacity: 0.95,
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 2,
            color: '#000',
            opacity: 0.15
          }
        }
      },
      xaxis: {
        labels: {
          formatter: (val: string) => {
            const num = Number(val);
            if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return '$' + (num / 1000).toFixed(0) + 'k';
            return '$' + num.toLocaleString('es-AR');
          },
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#64748b'
          }
        },
        axisBorder: {
          show: true,
          color: '#e2e8f0'
        },
        axisTicks: {
          show: true,
          color: '#e2e8f0'
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '13px',
            fontWeight: 600,
            colors: '#334155'
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "horizontal",
          shadeIntensity: 0.4,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.85,
          stops: [0, 100]
        },
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        style: {
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif'
        },
        y: {
          formatter: (val: number) => '$ ' + val.toLocaleString('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }),
          title: {
            formatter: () => 'Recaudación:'
          }
        },
        marker: {
          show: true
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3,
        xaxis: {
          lines: { show: true }
        },
        yaxis: {
          lines: { show: false }
        },
        padding: {
          top: 10,
          right: 30,
          bottom: 20, // Aumentado para dar espacio
          left: 15
        }
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['transparent']
      },
      title: { text: undefined },
      legend: {
        show: true,
        position: 'bottom', // Cambiado de 'top' a 'bottom'
        horizontalAlign: 'center',
        floating: false,
        offsetY: 15,
        offsetX: 0,
        itemMargin: {
          horizontal: 15,
          vertical: 5
        },
        customLegendItems: ['Mejor mes', 'Peor mes', 'Resto de meses'],
        labels: {
          colors: ['#334155']
        }
      },
      colors: ['#0ea5e9']
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

  private getFechaInfo(fecha: any): { year: number, month: number } | null {
    if (!fecha) return null;

    if (fecha instanceof Date) {
       return { year: fecha.getUTCFullYear(), month: fecha.getUTCMonth() };
    }

    const str = String(fecha).trim();

    const yearMatch = str.match(/\d{4}/);
    if (!yearMatch) return null;

    const year = parseInt(yearMatch[0]);

    const datePart = str.split('T')[0];
    const parts = datePart.split(/[-/]/);

    let month = -1;

    if (parts.length >= 2) {
      const yearIndex = parts.findIndex(p => p.includes(year.toString()));

      if (yearIndex !== -1 && parts.length >= 3) {
         month = parseInt(parts[1]) - 1;
      } else if (yearIndex === 0 && parts.length === 2) {
         month = parseInt(parts[1]) - 1;
      }
    }

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
    this.selectedYear = Number(this.selectedYear);
    this.updateChartData();
  }

  private updateChartData(): void {
    const montosPorMes = new Array(12).fill(0);
    const targetYear = Number(this.selectedYear);

    this.gastos.forEach(gasto => {
      if (gasto.idTipoGasto === 1) {
        const info = this.getFechaInfo(gasto.fecha);

        if (info && info.year === targetYear) {
          if (info.month >= 0 && info.month <= 11) {
             const monto = Number(gasto.monto || 0);
             montosPorMes[info.month] += monto;
          }
        }
      }
    });

    this.totalAnual = montosPorMes.reduce((a, b) => a + b, 0);

    const currentDate = new Date();
    const isCurrentYear = targetYear === currentDate.getFullYear();
    const divisor = isCurrentYear ? (currentDate.getMonth() + 1) : 12;
    this.promedioMensual = this.totalAnual > 0 ? (this.totalAnual / divisor) : 0;

    // Encontrar mejor mes
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

    // Encontrar peor mes (excluyendo meses con $0)
    let minMonto = Infinity;
    let minIndex = -1;
    montosPorMes.forEach((monto, index) => {
      if (monto > 0 && monto < minMonto) {
        minMonto = monto;
        minIndex = index;
      }
    });

    // Asignar colores según mejor/peor mes
    const coloresPorMes = montosPorMes.map((monto, index) => {
      if (index === maxIndex && monto > 0) {
        return '#10b981'; // Verde para mejor mes
      } else if (index === minIndex && monto > 0) {
        return '#ef4444'; // Rojo para peor mes
      } else {
        return '#0ea5e9'; // Azul para resto
      }
    });

    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: "Recaudación",
        data: montosPorMes
      }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: this.meses
      },
      colors: coloresPorMes,
      legend: {
        ...this.chartOptions.legend,
        markers: {
          fillColors: ['#10b981', '#ef4444', '#0ea5e9']
        }
      }
    };

    if (this.chart) {
      this.chart.updateOptions(this.chartOptions);
    }

    this.cdr.detectChanges();
  }
}
