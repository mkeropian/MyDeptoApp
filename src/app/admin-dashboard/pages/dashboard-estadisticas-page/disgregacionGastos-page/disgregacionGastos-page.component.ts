import { Component, inject, OnInit, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstadisticasReportesService } from '../../../../estadisticasReportes/services/estadisticasReportes.service';
import { GastoGrid } from '../../../../gastos/interfaces/gasto.interface';
import { SafeCurrencyPipe, SafeNumberPipe } from '../../../../estadisticasReportes/pipes/safe-number.pipe';

import {
  ChartComponent,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexResponsive,
  ApexLegend,
  ApexDataLabels,
  NgApexchartsModule
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  colors: string[];
};

interface GastosPorCategoria {
  categoria: string;
  monto: number;
  cantidad: number;
  porcentaje: number;
}

@Component({
  selector: 'app-disgregacion-gastos-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule,
    SafeCurrencyPipe,
    SafeNumberPipe
  ],
  templateUrl: './disgregacionGastos-page.component.html',
})
export class DisgregacionGastosPageComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;

  private estadisticasService = inject(EstadisticasReportesService);
  private ngZone = inject(NgZone);

  public chartOptions: Partial<ChartOptions> | any;
  public gastos: GastoGrid[] = [];
  public gastosFiltrados: GastoGrid[] = [];
  public gastosPorCategoria: GastosPorCategoria[] = [];

  public totalGastos: number = 0;
  public categoriaConMayorGasto: string = '';
  public montoMayorCategoria: number = 0;
  public cantidadCategorias: number = 0;

  public isLoading: boolean = true;

  // Detalle de categoría seleccionada
  public categoriaSeleccionada: string = '';
  public gastosDetalleCategoria: GastoGrid[] = [];
  public mostrarTabla: boolean = false;

  // Filtros
  public anioSeleccionado: number;
  public mesSeleccionado: number = 0;
  public aniosDisponibles: number[] = [];
  public meses = [
    { value: 0, label: 'Todos' },
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  constructor() {
    this.anioSeleccionado = new Date().getFullYear();
    this.initializeChart();
  }

  ngOnInit(): void {
    this.loadGastos();
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 420,
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            this.onChartClick(config.dataPointIndex);
          }
        }
      },
      labels: [],
      colors: [
        '#008FFB',
        '#00E396',
        '#FEB019',
        '#FF4560',
        '#775DD0',
        '#546E7A',
        '#26a69a',
        '#D10CE8',
        '#F86624',
        '#2E93fA',
        '#66DA26',
        '#E91E63'
      ],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '18px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 600,
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '24px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 700,
                offsetY: 10,
                formatter: (val: string) => {
                  return new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(Number(val));
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total Gastos',
                fontSize: '16px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 600,
                color: '#373d3f',
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(total);
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '14px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
        },
        dropShadow: {
          enabled: false
        }
      },
      legend: {
        show: true,
        position: 'left',
        horizontalAlign: 'left',
        fontSize: '14px',
        fontFamily: 'Helvetica, Arial, sans-serif',
        offsetY: 0,
        offsetX: -20,
        markers: {
          width: 12,
          height: 12,
          radius: 12
        },
        itemMargin: {
          horizontal: 10,
          vertical: 8
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 350
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ],
      tooltip: {
        y: {
          formatter: (val: number) => {
            return new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(val);
          }
        }
      },
      states: {
        active: {
          filter: {
            type: 'darken',
            value: 0.35
          }
        }
      }
    };
  }

  private loadGastos(): void {
    this.isLoading = true;

    this.estadisticasService.getGastos().subscribe({
      next: (gastos: any[]) => {
        this.gastos = gastos.map(gasto => ({
          ...gasto,
          monto: typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : gasto.monto
        }));
        this.extractAniosDisponibles(this.gastos);
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando gastos:', error);
        this.isLoading = false;
      }
    });
  }

  private extractAniosDisponibles(gastos: GastoGrid[]): void {
    const anios = new Set<number>();
    gastos.forEach(gasto => {
      const fecha = new Date(gasto.fecha);
      if (!isNaN(fecha.getTime())) {
        anios.add(fecha.getFullYear());
      }
    });
    this.aniosDisponibles = Array.from(anios).sort((a, b) => b - a);

    if (this.aniosDisponibles.length > 0 && !this.aniosDisponibles.includes(this.anioSeleccionado)) {
      this.anioSeleccionado = this.aniosDisponibles[0];
    }
  }

  public aplicarFiltros(): void {
    this.gastosFiltrados = this.gastos.filter(gasto => {
      const fechaStr = gasto.fecha;
      const [year, month] = fechaStr.split('T')[0].split('-').map(Number);

      const cumpleAnio = year === this.anioSeleccionado;
      const cumpleMes = this.mesSeleccionado === 0 || month === this.mesSeleccionado;

      return cumpleAnio && cumpleMes;
    });

    this.processChartData(this.gastosFiltrados);
    this.limpiarSeleccion();
  }

  private processChartData(gastos: GastoGrid[]): void {
    const gastosAgrupados = this.agruparGastosPorTipo(gastos);
    this.gastosPorCategoria = gastosAgrupados;

    this.chartOptions.series = gastosAgrupados.map(g => g.monto);
    this.chartOptions.labels = gastosAgrupados.map(g => g.categoria);

    this.calcularEstadisticas(gastosAgrupados);
  }

  private agruparGastosPorTipo(gastos: GastoGrid[]): GastosPorCategoria[] {
    const grupos = new Map<string, { monto: number, cantidad: number }>();

    gastos.forEach(gasto => {
      const tipo = gasto.descripcion || 'Sin categoría';
      const monto = gasto.monto;

      if (!grupos.has(tipo)) {
        grupos.set(tipo, { monto: 0, cantidad: 0 });
      }

      const grupoActual = grupos.get(tipo)!;
      grupoActual.monto += monto;
      grupoActual.cantidad += 1;
    });

    const totalMonto = Array.from(grupos.values()).reduce((sum, g) => sum + g.monto, 0);

    return Array.from(grupos.entries())
      .map(([categoria, datos]) => ({
        categoria,
        monto: datos.monto,
        cantidad: datos.cantidad,
        porcentaje: totalMonto > 0 ? (datos.monto / totalMonto) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto);
  }

  private calcularEstadisticas(gastosPorCategoria: GastosPorCategoria[]): void {
    this.totalGastos = gastosPorCategoria.reduce((sum, g) => sum + g.monto, 0);
    this.cantidadCategorias = gastosPorCategoria.length;

    if (gastosPorCategoria.length > 0) {
      const categoriaMax = gastosPorCategoria.reduce((max, g) =>
        g.monto > max.monto ? g : max
      , gastosPorCategoria[0]);

      this.categoriaConMayorGasto = categoriaMax.categoria;
      this.montoMayorCategoria = categoriaMax.monto;
    } else {
      this.categoriaConMayorGasto = '';
      this.montoMayorCategoria = 0;
    }
  }

  public onChartClick(dataPointIndex: number): void {
    this.ngZone.run(() => {
      const categoria = this.chartOptions.labels[dataPointIndex];
      const hayCategoriaPrevia = !!this.categoriaSeleccionada;

      if (hayCategoriaPrevia) {
        this.mostrarTabla = false;
      }

      this.categoriaSeleccionada = categoria;

      const gastosTemp = this.gastosFiltrados
        .filter(gasto => gasto.descripcion === categoria)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      this.gastosDetalleCategoria = [...gastosTemp];

      if (hayCategoriaPrevia) {
        setTimeout(() => {
          this.mostrarTabla = true;
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 310);
        }, 10);
      } else {
        this.mostrarTabla = true;
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 310);
      }
    });
  }

  public limpiarSeleccion(): void {
    this.categoriaSeleccionada = '';
    this.gastosDetalleCategoria = [];
    this.mostrarTabla = false;

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 350);
  }

  public formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  public calcularTotalCategoria(): number {
    return this.gastosDetalleCategoria.reduce((sum, g) => sum + g.monto, 0);
  }

  public trackByGastoId(index: number, gasto: GastoGrid): number {
    return gasto.id;
  }

  public onAnioChange(): void {
    this.anioSeleccionado = Number(this.anioSeleccionado);
    this.aplicarFiltros();
  }

  public onMesChange(): void {
    this.mesSeleccionado = Number(this.mesSeleccionado);
    this.aplicarFiltros();
  }
}
