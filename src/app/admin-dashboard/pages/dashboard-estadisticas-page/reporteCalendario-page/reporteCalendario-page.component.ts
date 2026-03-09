import { Component, computed, effect, inject, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';


import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

// ApexCharts
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexLegend,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexFill,
  ApexStroke
} from 'ng-apexcharts';
import { CalendarioService, TipoCalendario } from '../../../../calendario-empleados/services/calendario.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { Empleado } from '../../../../gastos/interfaces/gasto.interface';
import { Departamento } from '../../../../departamentos/interfaces/departamento.interface';


// Interfaces
interface ReporteCalendarioData {
  totalEventos: number;
  totalHoras: number;
  promedioEventosPorDia: number;
  eventosPorEmpleado: Array<{ empleado: string; cantidad: number; porcentaje: number }>;
  eventosPorDepartamento: Array<{ departamento: string; cantidad: number }>;
  eventosPorTipo: Array<{ tipo: string; cantidad: number; porcentaje: number }>;
  eventosPorDiaSemana: Array<{ dia: string; cantidad: number }>;
  horasPorEmpleado: Array<{ empleado: string; horas: number }>;
  eventosPorFranja: Array<{ franja: string; cantidad: number }>;
  insights: {
    empleadoEstrella: string | null;
    deptoMasVisitado: string | null;
    diaMasOcupado: string | null;
    tipoMasComun: string | null;
    franjaPico: string | null;
    promedioDuracion: number;
  };
}

@Component({
  selector: 'app-reporte-calendario-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgApexchartsModule],
  templateUrl: './reporteCalendario-page.component.html',
  styleUrls: ['./reporteCalendario-page.component.css']
})
export class ReporteCalendarioPageComponent {

  private calendarioService = inject(CalendarioService);
  private usuariosService = inject(UsuariosService);
  private departamentosService = inject(DepartamentosService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // ==================== VIEW CHILDREN ====================

  @ViewChildren('tipoCheckbox') tipoCheckboxes!: QueryList<ElementRef<HTMLInputElement>>;

  // ==================== SIGNALS ====================

  public cargando = signal(false);
  public reporteData = signal<ReporteCalendarioData | null>(null);
  public tiposCalendario = signal<TipoCalendario[]>([]);
  public usuarios = signal<Empleado[]>([]);
  public departamentos = signal<Departamento[]>([]);
  public mostrarGraficos = signal(false);

  // ==================== FORM ====================

  public filtrosForm: FormGroup = this.fb.group({
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    idUsuario: [null],
    idsTipoCalendario: [[]],
    idDepartamento: [null]
  });

  // ==================== COMPUTED - OPCIONES DE GRÁFICOS ====================

  // Gráfico Dona - Eventos por Empleado
  public chartDonaEmpleados = computed(() => {
    const data = this.reporteData();
    if (!data || !data.eventosPorEmpleado.length) return null;

    return {
      series: data.eventosPorEmpleado.map(e => e.cantidad),
      chart: {
        type: 'donut' as const,
        height: 350
      },
      labels: data.eventosPorEmpleado.map(e => e.empleado),
      colors: ['#4F46E5', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
      legend: {
        position: 'bottom' as const
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        }
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + ' eventos';
          }
        }
      }
    };
  });

  // Gráfico Barras - Top 10 Departamentos
  public chartBarrasDepartamentos = computed(() => {
    const data = this.reporteData();
    if (!data || !data.eventosPorDepartamento.length) return null;

    return {
      series: [{
        name: 'Eventos',
        data: data.eventosPorDepartamento.map(d => d.cantidad)
      }],
      chart: {
        type: 'bar' as const,
        height: 350
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: '60%',
          distributed: false
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#4F46E5'],
      xaxis: {
        categories: data.eventosPorDepartamento.map(d => d.departamento),
        labels: {
          rotate: -45,
          style: {
            fontSize: '11px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Cantidad de Eventos'
        }
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + ' eventos';
          }
        }
      }
    };
  });

  // Gráfico Torta - Tipos de Evento
  public chartTortaTipos = computed(() => {
    const data = this.reporteData();
    if (!data || !data.eventosPorTipo.length) return null;

    return {
      series: data.eventosPorTipo.map(t => t.cantidad),
      chart: {
        type: 'pie' as const,
        height: 350
      },
      labels: data.eventosPorTipo.map(t => t.tipo),
      colors: ['#4F46E5', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'],
      legend: {
        position: 'bottom' as const
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        }
      }
    };
  });

  // Gráfico Barras - Eventos por Día de Semana
  public chartBarrasSemana = computed(() => {
    const data = this.reporteData();
    if (!data || !data.eventosPorDiaSemana.length) return null;

    return {
      series: [{
        name: 'Eventos',
        data: data.eventosPorDiaSemana.map(d => d.cantidad)
      }],
      chart: {
        type: 'bar' as const,
        height: 350
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: '60%'
        }
      },
      colors: ['#10B981'],
      xaxis: {
        categories: data.eventosPorDiaSemana.map(d => d.dia)
      },
      yaxis: {
        title: {
          text: 'Cantidad de Eventos'
        }
      }
    };
  });

  // Gráfico Barras Horizontales - Horas por Empleado
  public chartBarrasHoras = computed(() => {
    const data = this.reporteData();
    if (!data || !data.horasPorEmpleado.length) return null;

    return {
      series: [{
        name: 'Horas',
        data: data.horasPorEmpleado.map(h => h.horas)
      }],
      chart: {
        type: 'bar' as const,
        height: 350
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true
        }
      },
      colors: ['#10B981'],
      xaxis: {
        categories: data.horasPorEmpleado.map(h => h.empleado)
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + ' horas';
          }
        }
      }
    };
  });

  // ==================== CONSTRUCTOR ====================

  constructor() {
    // Cargar datos iniciales
    this.cargarTiposCalendario();
    this.cargarUsuarios();
    this.cargarDepartamentos();
    this.establecerFechasPorDefecto();
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private establecerFechasPorDefecto(): void {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.filtrosForm.patchValue({
      fechaInicio: this.formatearFecha(primerDiaMes),
      fechaFin: this.formatearFecha(ultimoDiaMes)
    });
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  private cargarTiposCalendario(): void {
    this.calendarioService.obtenerTiposCalendario().subscribe({
      next: (tipos) => {
        this.tiposCalendario.set(tipos.filter((t) => t.activo === 1));
      },
      error: (error) => {
        console.error('Error al cargar tipos de calendario:', error);
      }
    });
  }

  private cargarUsuarios(): void {
    this.usuariosService.getEmpleados().subscribe({
      next: (empleados) => {
        this.usuarios.set(empleados);
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
      }
    });
  }

  private cargarDepartamentos(): void {
    this.departamentosService.getDepartamentosActivos().subscribe({
      next: (deptos) => {
        this.departamentos.set(deptos);
      },
      error: (error) => {
        console.error('Error al cargar departamentos:', error);
      }
    });
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  public onTipoCalendarioChange(event: Event, idTipo: number): void {
    const checkbox = event.target as HTMLInputElement;
    const currentIds = this.filtrosForm.get('idsTipoCalendario')?.value || [];

    if (checkbox.checked) {
      this.filtrosForm.patchValue({
        idsTipoCalendario: [...currentIds, idTipo]
      });
    } else {
      this.filtrosForm.patchValue({
        idsTipoCalendario: currentIds.filter((id: number) => id !== idTipo)
      });
    }
  }

  public cargarReporte(): void {
    if (this.filtrosForm.invalid) {
      return;
    }

    this.cargando.set(true);
    this.mostrarGraficos.set(false);

    const filtros = this.filtrosForm.value;

    this.http.post<ReporteCalendarioData>(`${environment.baseUrl}/estadisticasReportes/calendario`, filtros)
      .subscribe({
        next: (data) => {
          this.reporteData.set(data);
          this.mostrarGraficos.set(true);
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error al cargar reporte:', error);
          this.cargando.set(false);
        }
      });
  }

  public limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.establecerFechasPorDefecto();
    this.mostrarGraficos.set(false);
    this.reporteData.set(null);

    // Deseleccionar todos los checkboxes de tipos de calendario
    this.tipoCheckboxes?.forEach((checkbox) => {
      checkbox.nativeElement.checked = false;
    });
  }
}
