import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Usamos GastosService que es el que tiene el método getGastos() que funcionó antes
import { GastosService } from '../../../../gastos/services/gastos.service';
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
import { take } from 'rxjs';

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
    SafeCurrencyPipe
  ],
  templateUrl: './disgregacionGastos-page.component.html',
})
export class DisgregacionGastosPageComponent implements OnInit {
  // Inyectamos el servicio correcto
  private gastosService = inject(GastosService);

  @ViewChild('chart') chart: ChartComponent | undefined;

  // Estados de datos
  public gastosTotales: GastoGrid[] = [];
  public gastosFiltrados: GastoGrid[] = [];
  public gastosPorCategoria: GastosPorCategoria[] = [];
  public isLoading = true;

  // Filtros
  public aniosDisponibles: number[] = [];
  public anioSeleccionado: number = new Date().getFullYear();
  public mesSeleccionado: number = -1; // -1 = Todos

  public meses = [
    { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
  ];

  // Detalles e interacción
  public mostrarTabla: boolean = false;
  public categoriaSeleccionada: string = '';
  public gastosDetalleCategoria: GastoGrid[] = [];
  public iniciarTransicion: boolean = false;
  public totalGastos: number = 0;

  // Configuración del Gráfico
  public chartOptions: ChartOptions = {
    series: [],
    chart: {
      type: 'donut',
      height: 350,
      events: {
        dataPointSelection: (event, chartContext, config) => {
          if (config && config.w && config.w.config && config.w.config.labels) {
            const label = config.w.config.labels[config.dataPointIndex];
            this.seleccionarCategoria(label);
          }
        }
      }
    },
    labels: [],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: function (w) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return '$' + total.toLocaleString('es-AR');
              }
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 300 },
        legend: { position: 'bottom' }
      }
    }]
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.isLoading = true;

    // Usamos getGastos() que sabemos que funciona
    this.gastosService.getGastos()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.gastosTotales = data;
          this.procesarAniosDisponibles();
          this.filtrarGastos(); // Esto llamará a procesarDatosGrafico
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando gastos', err);
          this.isLoading = false;
        }
      });
  }

  private procesarAniosDisponibles(): void {
    // Extracción segura de año usando string (evita bug de zona horaria)
    const anios = new Set(this.gastosTotales.map(g =>
      parseInt(g.fecha.toString().substring(0, 4))
    ));

    this.aniosDisponibles = Array.from(anios).sort((a, b) => b - a);

    // Si el año actual no está en los datos, seleccionamos el más reciente disponible
    if (this.aniosDisponibles.length > 0 && !this.aniosDisponibles.includes(this.anioSeleccionado)) {
      this.anioSeleccionado = this.aniosDisponibles[0];
    }
  }

  // Se ejecuta cuando cambia el Dropdown de Año o Mes
  public onAnioChange(): void {
    this.limpiarSeleccion();
    this.filtrarGastos();
  }

  public onMesChange(): void {
    this.limpiarSeleccion();
    this.filtrarGastos();
  }

  private filtrarGastos(): void {
    if (!this.gastosTotales) return;

    this.gastosFiltrados = this.gastosTotales.filter(g => {
      // Parseo seguro de fecha texto "YYYY-MM-DD"
      const year = parseInt(g.fecha.toString().substring(0, 4));
      // Mes en string "01" -> int 1
      const month = parseInt(g.fecha.toString().substring(5, 7));

      const coincideAnio = year === Number(this.anioSeleccionado);
      // Si mesSeleccionado es -1, mostramos todos los meses
      const coincideMes = this.mesSeleccionado === -1 || month === Number(this.mesSeleccionado);

      return coincideAnio && coincideMes;
    });

    this.procesarDatosGrafico();
  }

  private procesarDatosGrafico(): void {
    const categoriasMap = new Map<string, { monto: number, cantidad: number }>();
    this.totalGastos = 0;

    this.gastosFiltrados.forEach(g => {
      // --- LECTURA ROBUSTA DE CATEGORÍA ---
      // Usamos 'any' para leer 'categoria' venga como string o como objeto {nombre: ...}
      const itemAny = g as any;
      let nombreCategoria = 'Sin Categoría';

      if (itemAny.categoria) {
        if (typeof itemAny.categoria === 'object' && itemAny.categoria.nombre) {
          nombreCategoria = itemAny.categoria.nombre;
        } else if (typeof itemAny.categoria === 'string') {
          nombreCategoria = itemAny.categoria;
        }
      }

      const monto = Number(g.monto || 0);

      if (!categoriasMap.has(nombreCategoria)) {
        categoriasMap.set(nombreCategoria, { monto: 0, cantidad: 0 });
      }

      const catData = categoriasMap.get(nombreCategoria)!;
      catData.monto += monto;
      catData.cantidad += 1;
      this.totalGastos += monto;
    });

    // Calcular porcentajes y crear array final
    this.gastosPorCategoria = Array.from(categoriasMap.entries())
      .map(([cat, data]) => ({
        categoria: cat,
        monto: data.monto,
        cantidad: data.cantidad,
        porcentaje: this.totalGastos > 0 ? (data.monto / this.totalGastos) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto); // Ordenar por monto descendente

    this.actualizarGrafico();
  }

  private actualizarGrafico(): void {
    const labels = this.gastosPorCategoria.map(d => d.categoria);
    const series = this.gastosPorCategoria.map(d => d.monto);

    this.chartOptions = {
      ...this.chartOptions,
      labels: labels,
      series: series,
      // Actualizamos el formateador del total del centro del donut
      plotOptions: {
        pie: {
          donut: {
            labels: {
              total: {
                formatter: () => {
                   return '$' + this.totalGastos.toLocaleString('es-AR', {
                     minimumFractionDigits: 0,
                     maximumFractionDigits: 0
                   });
                }
              }
            }
          }
        }
      }
    };
  }

  public seleccionarCategoria(categoria: string): void {
    if (this.categoriaSeleccionada === categoria && this.mostrarTabla) {
      this.limpiarSeleccion();
      return;
    }

    this.iniciarTransicion = true;

    // Pequeño delay para permitir que la UI respire antes de la animación
    setTimeout(() => {
      this.categoriaSeleccionada = categoria;

      // Filtrar detalles usando la misma lógica robusta de categoría
      this.gastosDetalleCategoria = this.gastosFiltrados.filter(g => {
        const itemAny = g as any;
        let catName = 'Sin Categoría';
        if (itemAny.categoria) {
             catName = (typeof itemAny.categoria === 'object') ? itemAny.categoria.nombre : itemAny.categoria;
        }
        return catName === categoria;
      });

      this.mostrarTabla = true;

      // Forzar resize del gráfico si es necesario por cambios de layout
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }, 100);
  }

  public limpiarSeleccion(): void {
    this.mostrarTabla = false;
    this.categoriaSeleccionada = '';
    this.gastosDetalleCategoria = [];
    this.iniciarTransicion = false;

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  // Método seguro para formatear fechas en la tabla (sin timezone offset)
  public formatearFecha(fechaISO: string | Date): string {
    if (!fechaISO) return '';
    const str = fechaISO.toString();
    // Asumimos formato YYYY-MM-DD
    if (str.length >= 10) {
      const year = str.substring(0, 4);
      const month = str.substring(5, 7);
      const day = str.substring(8, 10);
      return `${day}/${month}/${year}`;
    }
    return str;
  }

  public calcularTotalCategoria(): number {
    return this.gastosDetalleCategoria.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  }

  public trackByGastoId(index: number, gasto: GastoGrid): number {
    return gasto.id;
  }
}
