import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SafeCurrencyPipe } from '../../../../estadisticasReportes/pipes/safe-number.pipe';
import { ReportesService } from '../../../../estadisticasReportes/services/reportes.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { PagosService } from '../../../../incomes/services/incomes.service';
import {
  FiltrosReporteEmpleados,
  ResumenEmpleado,
  MetricasReporte,
  MovimientoEmpleado
} from '../../../../estadisticasReportes/interfaces/reporte-empleado.interface';
import { Empleado } from '../../../../gastos/interfaces/gasto.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexLegend,
  ApexDataLabels,
  ApexStroke
} from 'ng-apexcharts';

@Component({
  selector: 'app-reporte-empleados-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule,
    SafeCurrencyPipe
  ],
  templateUrl: './reporteEmpleados-page.component.html',
  styleUrls: ['./reporteEmpleados-page.component.css']
})
export class ReporteEmpleadosPageComponent implements OnInit {

  private reportesService = inject(ReportesService);
  private usuariosService = inject(UsuariosService);
  private departamentosService = inject(DepartamentosService);
  private gastosService = inject(GastosService);
  private pagosService = inject(PagosService);

  // Estados
  isLoading = signal(false);
  empleadoExpandido = signal<number | null>(null);
  mostrarModalEmail = signal(false);

  // Datos
  resumenEmpleados = signal<ResumenEmpleado[]>([]);
  metricas = signal<MetricasReporte>({
    totalOperaciones: 0,
    totalGastos: 0,
    totalPagos: 0,
    balance: 0
  });

  // Filtros
  filtros = signal<FiltrosReporteEmpleados>({
    fechaDesde: this.getPrimerDiaMesActual(),
    fechaHasta: this.getUltimoDiaMesActual(),
    tipoOperacion: 'todos'
  });

  presetActivo = signal<string>('mes');

  // Resources
  empleadosResource = rxResource({
    request: () => ({}),
    loader: () => this.usuariosService.getEmpleados()
  });

  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosActivos()
  });

  tipoGastoResource = rxResource({
    request: () => ({}),
    loader: () => this.gastosService.getTipoGastoActivos()
  });

  tipoPagoResource = rxResource({
    request: () => ({}),
    loader: () => this.pagosService.getTipoPagoActivos()
  });

  empleados = computed(() => {
    const value = this.empleadosResource.value();
    return (Array.isArray(value) ? value : []) as Empleado[];
  });

  departamentos = computed(() => this.departamentosResource.value() || []);
  tiposGasto = computed(() => this.tipoGastoResource.value() || []);
  tiposPago = computed(() => this.tipoPagoResource.value() || []);

  // Categorías dinámicas según tipo de operación
  categoriasDisponibles = computed(() => {
    const tipo = this.filtros().tipoOperacion;
    if (tipo === 'gastos') return this.tiposGasto();
    if (tipo === 'pagos') return this.tiposPago();
    return [...this.tiposGasto(), ...this.tiposPago()];
  });

// Opciones de gráficos
  chartDonutOptions: {
    series?: ApexNonAxisChartSeries;
    chart?: ApexChart;
    labels?: string[];
    colors?: string[];
    legend?: ApexLegend;
    dataLabels?: ApexDataLabels;
  } = {};

  chartBarrasOptions: {
    series?: ApexAxisChartSeries;
    chart?: ApexChart;
    plotOptions?: ApexPlotOptions;
    xaxis?: ApexXAxis;
    yaxis?: ApexYAxis;
  } = {};

  chartLineaOptions: {
    series?: ApexAxisChartSeries;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    yaxis?: ApexYAxis;
    stroke?: ApexStroke;
  } = {};

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ========== MÉTODOS DE CARGA DE DATOS ==========

  private cargarDatos(): void {
    this.isLoading.set(true);

    // Llamar al servicio real
    this.reportesService.getReporteEmpleados(this.filtros()).subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos del backend:', data);
        this.resumenEmpleados.set(data);
        this.calcularMetricas();
        this.actualizarGraficos();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error cargando reporte:', err);
        this.isLoading.set(false);

        // En caso de error, mostrar datos vacíos
        this.resumenEmpleados.set([]);
        this.calcularMetricas();
        this.actualizarGraficos();
      }
    });
  }

  private calcularMetricas(): void {
    const data = this.resumenEmpleados();

    const totalOperaciones = data.reduce((sum, emp) =>
      sum + emp.cantidadGastos + emp.cantidadPagos, 0
    );

    const totalGastos = data.reduce((sum, emp) => sum + emp.totalGastos, 0);
    const totalPagos = data.reduce((sum, emp) => sum + emp.totalPagos, 0);
    const balance = totalPagos - totalGastos;

    this.metricas.set({
      totalOperaciones,
      totalGastos,
      totalPagos,
      balance
    });
  }

  private actualizarGraficos(): void {
    const data = this.resumenEmpleados();

    // Gráfico Donut
    this.chartDonutOptions = {
      series: data.map(emp => emp.totalGastos + emp.totalPagos),
      chart: {
        type: 'donut',
        height: 350
      },
      labels: data.map(emp => emp.nombreEmpleado),
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      legend: {
        position: 'bottom',
        fontSize: '14px'
      },
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        }
      }
    };

    // Gráfico Barras
    this.chartBarrasOptions = {
      series: [
        {
          name: 'Gastos',
          data: data.map(emp => emp.totalGastos)
        },
        {
          name: 'Pagos',
          data: data.map(emp => emp.totalPagos)
        }
      ],
      chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%'
        }
      },
      xaxis: {
        categories: data.map(emp => emp.nombreEmpleado)
      },
      yaxis: {
        labels: {
          formatter: function(val: number) {
            return '$' + val.toLocaleString('es-AR');
          }
        }
      }
    };

    // Gráfico Línea
    this.chartLineaOptions = {
      series: data.map(emp => ({
        name: emp.nombreEmpleado,
        data: [emp.totalGastos, emp.totalPagos]
      })),
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: ['Gastos', 'Pagos']
      },
      yaxis: {
        labels: {
          formatter: function(val: number) {
            return '$' + val.toLocaleString('es-AR');
          }
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      }
    };
  }

  // ========== MÉTODOS DE FILTROS ==========

  onFiltroChange(): void {
    this.presetActivo.set('');
    this.cargarDatos();
  }

  aplicarPreset(preset: string): void {
    this.presetActivo.set(preset);
    const filtrosActuales = this.filtros();

    switch (preset) {
      case 'mes':
        this.filtros.set({
          ...filtrosActuales,
          fechaDesde: this.getPrimerDiaMesActual(),
          fechaHasta: this.getUltimoDiaMesActual()
        });
        break;
      case 'ultimoMes':
        this.filtros.set({
          ...filtrosActuales,
          fechaDesde: this.getPrimerDiaMesAnterior(),
          fechaHasta: this.getUltimoDiaMesAnterior()
        });
        break;
      case 'anio':
        this.filtros.set({
          ...filtrosActuales,
          fechaDesde: this.getPrimerDiaAnioActual(),
          fechaHasta: this.getUltimoDiaAnioActual()
        });
        break;
    }

    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtros.set({
      fechaDesde: this.getPrimerDiaMesActual(),
      fechaHasta: this.getUltimoDiaMesActual(),
      tipoOperacion: 'todos'
    });
    this.presetActivo.set('mes');
    this.cargarDatos();
  }

  // ========== MÉTODOS DE TABLA ==========

  toggleEmpleado(idEmpleado: number): void {
    if (this.empleadoExpandido() === idEmpleado) {
      this.empleadoExpandido.set(null);
    } else {
      this.empleadoExpandido.set(idEmpleado);
    }
  }

  isExpandido(idEmpleado: number): boolean {
    return this.empleadoExpandido() === idEmpleado;
  }

  getMovimientosEmpleado(idEmpleado: number): MovimientoEmpleado[] {
    const empleado = this.resumenEmpleados().find(emp => emp.idEmpleado === idEmpleado);
    return empleado?.movimientos || [];
  }

  // ========== MÉTODOS DE EXPORTACIÓN ==========

  exportarExcel(): void {
    console.log('Exportando a Excel...');
    // TODO: Implementar cuando esté el backend
    // this.reportesService.exportarExcel(this.filtros()).subscribe({
    //   next: (blob) => {
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `reporte-empleados-${new Date().toISOString().split('T')[0]}.xlsx`;
    //     a.click();
    //   }
    // });
  }

  exportarPDF(): void {
    console.log('Exportando a PDF...');
    // TODO: Implementar cuando esté el backend
  }

  abrirModalEmail(): void {
    this.mostrarModalEmail.set(true);
  }

  cerrarModalEmail(): void {
    this.mostrarModalEmail.set(false);
  }

  enviarEmailHandler(emailsStr: string, formato: string, mensaje: string): void {
    const emails = emailsStr.split(',').map(e => e.trim()).filter(e => e.length > 0);

    if (emails.length === 0) {
      console.error('Debe ingresar al menos un email');
      return;
    }

    console.log('Enviando email...', { emails, formato, mensaje });

    // TODO: Implementar cuando esté el backend
    // this.reportesService.enviarEmail(
    //   this.filtros(),
    //   emails,
    //   formato as 'excel' | 'pdf' | 'ambos',
    //   mensaje
    // ).subscribe({
    //   next: () => {
    //     console.log('Email enviado correctamente');
    //     this.cerrarModalEmail();
    //   },
    //   error: (err) => {
    //     console.error('Error al enviar email:', err);
    //   }
    // });

    this.cerrarModalEmail();
  }

  // ========== UTILIDADES DE FECHAS ==========

  private getPrimerDiaMesActual(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }

  private getUltimoDiaMesActual(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  private getPrimerDiaMesAnterior(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString().split('T')[0];
  }

  private getUltimoDiaMesAnterior(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 0).toISOString().split('T')[0];
  }

  private getPrimerDiaAnioActual(): string {
    const date = new Date();
    return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0];
  }

  private getUltimoDiaAnioActual(): string {
    const date = new Date();
    return new Date(date.getFullYear(), 11, 31).toISOString().split('T')[0];
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-AR');
  }

  // ========== MÉTODOS AUXILIARES PARA TEMPLATE ==========

  getTotalCantidadGastos(): number {
    return this.resumenEmpleados().reduce((sum, emp) => sum + emp.cantidadGastos, 0);
  }

  getTotalCantidadPagos(): number {
    return this.resumenEmpleados().reduce((sum, emp) => sum + emp.cantidadPagos, 0);
  }


}
