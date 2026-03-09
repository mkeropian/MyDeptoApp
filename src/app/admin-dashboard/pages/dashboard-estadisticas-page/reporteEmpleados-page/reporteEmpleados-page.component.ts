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
import Swal from 'sweetalert2';
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

  // Estados del modal de email
  emailDestinatario = signal('');
  formatoEmail = signal<'excel' | 'pdf'>('excel');
  mensajeEmail = signal('');
  enviandoEmail = signal(false);
  emailError = signal('');

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

    // Cuando es "todos", agregar un prefijo único a cada categoría para evitar duplicados
    return [
      ...this.tiposGasto().map(g => ({ ...g, id: `gasto-${g.id}` })),
      ...this.tiposPago().map(p => ({ ...p, id: `pago-${p.id}` }))
    ];
  });

 // Opciones de gráficos
  chartCantidadOptions: {
    series?: ApexAxisChartSeries;
    chart?: ApexChart;
    plotOptions?: ApexPlotOptions;
    xaxis?: ApexXAxis;
    yaxis?: ApexYAxis;
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

  chartVolumenAreaOptions: {
    series?: ApexAxisChartSeries;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    yaxis?: ApexYAxis;
    stroke?: ApexStroke;
    fill?: any;
    dataLabels?: ApexDataLabels;
    legend?: ApexLegend;
  } = {};

  chartCantidadLineaOptions: {
    series?: ApexAxisChartSeries;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    yaxis?: ApexYAxis;
    stroke?: ApexStroke;
    markers?: any;
    legend?: ApexLegend;
  } = {};

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ========== MÉTODOS DE CARGA DE DATOS ==========

  private cargarDatos(): void {
    this.isLoading.set(true);

    // Llamar al servicio real con filtros procesados
    this.reportesService.getReporteEmpleados(this.prepararFiltrosParaBackend()).subscribe({
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

  /**
   * Prepara los filtros para enviar al backend, limpiando el prefijo de idCategoria
   */
  private prepararFiltrosParaBackend(): FiltrosReporteEmpleados {
    const filtros = this.filtros();

    // Si hay idCategoria y tiene prefijo 'gasto-' o 'pago-', removerlo
    if (filtros.idCategoria) {
      const idCategoriaStr = String(filtros.idCategoria);

      if (idCategoriaStr.includes('gasto-') || idCategoriaStr.includes('pago-')) {
        return {
          ...filtros,
          idCategoria: Number(idCategoriaStr.replace(/^(gasto|pago)-/, '')) as any
        };
      }
    }

    return filtros;
  }

  private actualizarGraficos(): void {
    const data = this.resumenEmpleados();

    if (data.length === 0) {
      this.chartCantidadOptions = {};
      this.chartBarrasOptions = {};
      this.chartVolumenAreaOptions = {};
      this.chartCantidadLineaOptions = {};
      return;
    }

    // ==================== GRÁFICO 1: CANTIDAD DE OPERACIONES (BARRAS APILADAS) ====================
    this.chartCantidadOptions = {
      series: [
        {
          name: 'Gastos',
          data: data.map(emp => emp.cantidadGastos)
        },
        {
          name: 'Pagos',
          data: data.map(emp => emp.cantidadPagos)
        }
      ],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 8
        }
      },
      xaxis: {
        categories: data.map(emp => emp.nombreEmpleado),
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Cantidad de Operaciones'
        },
        labels: {
          formatter: function(val: number) {
            return Math.round(val).toString();
          }
        }
      },
      colors: ['#f59e0b', '#3b82f6'],
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '14px'
      },
      dataLabels: {
        enabled: false
      }
    };

    // ==================== GRÁFICO 2: GASTOS VS PAGOS (BARRAS AGRUPADAS - MONTOS) ====================
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
        height: 350,
        toolbar: {
          show: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 8
        }
      },
      xaxis: {
        categories: data.map(emp => emp.nombreEmpleado),
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Monto ($)'
        },
        labels: {
          formatter: function(val: number) {
            return '$' + val.toLocaleString('es-AR');
          }
        }
      }
    };

    // ==================== GRÁFICO 3: VOLUMEN EN EL TIEMPO (ÁREA APILADA) ====================
    // Agrupar movimientos por fecha
    const movimientosPorFecha = this.agruparMovimientosPorFecha(data);

    this.chartVolumenAreaOptions = {
      series: data.map(emp => ({
        name: `${emp.idEmpleado}-${emp.nombreEmpleado}`, // ✅ FIX: Clave única
        data: movimientosPorFecha.fechas.map(fecha => {
          const movs = emp.movimientos.filter(m => {
            const fechaMov = new Date(m.fecha).toISOString().split('T')[0];
            return fechaMov === fecha;
          });
          return movs.reduce((sum, m) => sum + Number(m.monto), 0);
        })
      })),
      chart: {
        type: 'area',
        height: 350,
        stacked: true,
        toolbar: {
          show: true
        }
      },
      xaxis: {
        categories: movimientosPorFecha.fechas.map(f => this.formatearFechaCorta(f)),
        labels: {
          rotate: -45,
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Volumen ($)'
        },
        labels: {
          formatter: function(val: number) {
            return '$' + val.toLocaleString('es-AR');
          }
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.2
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        formatter: function(seriesName: string) {
          // ✅ Mostrar solo el nombre en la leyenda (sin el ID)
          return seriesName.split('-').slice(1).join('-');
        }
      }
    };

    // ==================== GRÁFICO 4: CANTIDAD EN EL TIEMPO (LÍNEA) ====================
    this.chartCantidadLineaOptions = {
      series: data.map(emp => ({
        name: `${emp.idEmpleado}-${emp.nombreEmpleado}`, // ✅ FIX: Clave única
        data: movimientosPorFecha.fechas.map(fecha => {
          const movs = emp.movimientos.filter(m => {
            const fechaMov = new Date(m.fecha).toISOString().split('T')[0];
            return fechaMov === fecha;
          });
          return movs.length; // Cantidad de movimientos
        })
      })),
      chart: {
        type: 'line',
        height: 350,
        toolbar: {
          show: true
        }
      },
      xaxis: {
        categories: movimientosPorFecha.fechas.map(f => this.formatearFechaCorta(f)),
        labels: {
          rotate: -45,
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Cantidad de Operaciones'
        },
        labels: {
          formatter: function(val: number) {
            return Math.round(val).toString();
          }
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      markers: {
        size: 5,
        hover: {
          size: 7
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        formatter: function(seriesName: string) {
          // ✅ Mostrar solo el nombre en la leyenda (sin el ID)
          return seriesName.split('-').slice(1).join('-');
        }
      }
    };
  }

  /**
   * Agrupar movimientos por fecha para los gráficos temporales
   */
  private agruparMovimientosPorFecha(data: ResumenEmpleado[]): { fechas: string[] } {
    const fechasSet = new Set<string>();

    // Recolectar todas las fechas únicas de todos los empleados
    data.forEach(emp => {
      emp.movimientos.forEach(mov => {
        const fecha = new Date(mov.fecha).toISOString().split('T')[0];
        fechasSet.add(fecha);
      });
    });

    // Ordenar fechas
    const fechas = Array.from(fechasSet).sort();

    return { fechas };
  }

  /**
   * Formatear fecha corta para eje X
   */
  private formatearFechaCorta(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
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

    this.reportesService.exportarExcel(this.prepararFiltrosParaBackend()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Nombre del archivo con fecha
        const fecha = new Date();
        const mes = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' }).replace(/ /g, '_');
        a.download = `liquidacion_empleados_${mes}.xlsx`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('✅ Excel descargado correctamente');
      },
      error: (err) => {
        console.error('❌ Error al exportar Excel:', err);
        alert('Error al exportar el archivo Excel. Por favor, intente nuevamente.');
      }
    });
  }

  exportarPDF(): void {
    console.log('Exportando a PDF...');

    this.reportesService.exportarPDF(this.prepararFiltrosParaBackend()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Nombre del archivo con fechas (igual que Excel pero .pdf)
        const fechaDesde = this.filtros().fechaDesde.replace(/-/g, '');
        const fechaHasta = this.filtros().fechaHasta.replace(/-/g, '');
        a.download = `liquidacion_empleados_${fechaDesde}_${fechaHasta}.pdf`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('✅ PDF descargado correctamente');
      },
      error: (err) => {
        console.error('❌ Error al exportar PDF:', err);
        alert('Error al exportar el archivo PDF. Por favor, intente nuevamente.');
      }
    });
  }

  abrirModalEmail(): void {
    // Pre-cargar email si hay empleado seleccionado
    const idEmpleado = this.filtros().idEmpleado;

    if (idEmpleado) {
      const empleado = this.empleados().find(emp => Number(emp.id) === Number(idEmpleado));
      if (empleado && empleado.email) {
        this.emailDestinatario.set(empleado.email);
      } else {
        this.emailDestinatario.set('');
      }
    } else {
      this.emailDestinatario.set('');
    }

    // Reset otros campos
    this.formatoEmail.set('excel');
    this.mensajeEmail.set('');
    this.emailError.set('');
    this.enviandoEmail.set(false);

    this.mostrarModalEmail.set(true);
  }

  cerrarModalEmail(): void {
    if (this.enviandoEmail()) {
      return; // No permitir cerrar mientras se envía
    }
    this.mostrarModalEmail.set(false);
  }

  confirmarEnvioEmail(): void {
    // Validar email
    const email = this.emailDestinatario().trim();

    if (!email) {
      this.emailError.set('El email es requerido');
      return;
    }

    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.emailError.set('Email inválido');
      return;
    }

    this.emailError.set('');
    this.enviandoEmail.set(true);

    // Preparar datos para el backend
    const payload = {
      emails: [email],
      formato: this.formatoEmail(),
      mensaje: this.mensajeEmail().trim() || undefined
    };

    this.reportesService.enviarEmail(
      this.prepararFiltrosParaBackend(),
      payload.emails,
      payload.formato,
      payload.mensaje
    ).subscribe({
      next: (response) => {
        this.enviandoEmail.set(false);
        this.cerrarModalEmail();

        // Mostrar SweetAlert de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Email enviado!',
          text: `La liquidación fue enviada correctamente a ${email}`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#10b981'
        });
      },
      error: (err) => {
        this.enviandoEmail.set(false);
        console.error('Error al enviar email:', err);

        // Mostrar SweetAlert de error
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar email',
          text: err.error?.msg || 'No se pudo enviar el email. Por favor, intente nuevamente.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#ef4444'
        });
      }
    });
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
