import { Component, ViewChild, OnInit } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexYAxis, ApexLegend, ApexFill, ChartComponent, ApexPlotOptions, ApexStroke, ApexTitleSubtitle } from 'ng-apexcharts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Departamento } from '../../../../departamentos/interfaces/departamento.interface';
import { rendDepGrid } from '../../../../estadisticasReportes/interfaces/estadisticasReportes.interface';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { EstadisticasReportesService } from '../../../../estadisticasReportes/services/estadisticasReportes.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  plotOptions: ApexPlotOptions;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};

interface DepartamentoOption {
  id: number;
  nombre: string;
  selected: boolean;
}

interface MesOption {
  value: string;
  label: string;
  selected: boolean;
}

interface AnoOption {
  value: number;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-rendimiento-mensual-departamentos-page',
  imports: [ChartComponent, CommonModule, FormsModule],
  templateUrl: './rendimientoMensualDepartamentos-page.component.html',
  styles: `
    #chart {
      max-width: 1200px;
      margin: 35px auto;
    }
    .filters-container {
      max-width: 1200px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e1e5e9;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .filter-section {
      margin-bottom: 20px;
    }
    .filter-section:last-child {
      margin-bottom: 0;
    }
    .filters-row {
      display: flex;
      gap: 40px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .filter-column {
      flex: 1;
      min-width: 200px;
    }
    .filter-title {
      font-weight: 600;
      margin-bottom: 10px;
      color: #2c3e50;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .checkbox-pill {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 16px;
      padding: 6px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 11px;
      font-weight: 500;
      color: #495057;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .checkbox-pill:hover {
      border-color: #007bff;
      background: #e7f3ff;
      transform: translateY(-1px);
    }
    .checkbox-pill.selected {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }
    .checkbox-pill input[type="checkbox"],
    .checkbox-pill input[type="radio"] {
      display: none;
    }
    .filter-info {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .clear-filters-btn {
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 16px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .clear-filters-btn:hover {
      background: #c82333;
      transform: translateY(-1px);
    }
    .clear-filters-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
    }
    .error-message {
      text-align: center;
      padding: 20px;
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      margin: 20px auto;
      max-width: 600px;
    }
  `
})

export class RendimientoMensualDepartamentosPageComponent implements OnInit {

  @ViewChild("chart") chart: ChartComponent | any;
  public chartOptions: Partial<ChartOptions> | any;

  // Opciones de filtros
  public departamentosOptions: DepartamentoOption[] = [];
  public mesesOptions: MesOption[] = [];
  public anosOptions: AnoOption[] = [];

  // Datos desde servicios
  public departamentosActivos: Departamento[] = [];
  public rendimientoData: rendDepGrid[] = [];
  public filteredData: rendDepGrid[] = [];

  // Estados
  public isLoading: boolean = true;
  public errorMessage: string = '';

  constructor(
    private departamentosService: DepartamentosService,
    private estadisticasService: EstadisticasReportesService
  ) {
    this.initializeChart();
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    // Cargar departamentos y datos de rendimiento en paralelo
    forkJoin({
      departamentos: this.departamentosService.getDepartamentosActivos(),
      rendimiento: this.estadisticasService.getRendDiarioDep()
    }).subscribe({
      next: (data) => {
        this.departamentosActivos = data.departamentos;
        this.rendimientoData = data.rendimiento;

        this.initializeFilters();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.errorMessage = 'Error al cargar los datos. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  private initializeFilters() {
    // Inicializar filtros de departamentos (NINGUNO seleccionado por defecto)
    this.departamentosOptions = this.departamentosActivos.map(dept => ({
      id: dept.id,
      nombre: dept.nombre,
      selected: false
    })).sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Inicializar filtros de años y meses
    this.initializeYearAndMonthFilters();
  }

  private initializeYearAndMonthFilters() {
    if (this.rendimientoData.length === 0) return;

    // Extraer años únicos
    const anosUnicos = Array.from(
      new Set(this.rendimientoData.map(item => {
        const fecha = new Date(item.fecha);
        return fecha.getFullYear();
      }))
    ).sort((a, b) => b - a); // Orden descendente (más reciente primero)

    this.anosOptions = anosUnicos.map(ano => ({
      value: ano,
      label: ano.toString(),
      selected: false
    }));

    // Extraer meses únicos
    const mesesUnicos = Array.from(
      new Set(this.rendimientoData.map(item => {
        const fecha = new Date(item.fecha);
        return `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      }))
    ).map(mesAno => {
      const [year, month] = mesAno.split('-');
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return {
        value: mesAno,
        label: `${nombresMeses[parseInt(month) - 1]}`,
        selected: false
      };
    }).sort((a, b) => a.value.localeCompare(b.value));

    this.mesesOptions = mesesUnicos;
  }

  public applyFilters() {
    if (this.rendimientoData.length === 0) {
      this.filteredData = [];
      this.processChartData();
      return;
    }

    // Obtener departamento seleccionado (solo uno permitido)
    const selectedDepartamento = this.departamentosOptions.find(dept => dept.selected);

    // Obtener años seleccionados
    const selectedAnos = this.anosOptions
      .filter(ano => ano.selected)
      .map(ano => ano.value);

    // Obtener meses seleccionados
    const selectedMeses = this.mesesOptions
      .filter(mes => mes.selected)
      .map(mes => mes.value);

    // Si no hay departamento seleccionado, no mostrar datos
    if (!selectedDepartamento) {
      this.filteredData = [];
      this.processChartData();
      return;
    }

    // Filtrar datos
    this.filteredData = this.rendimientoData.filter(item => {
      const fecha = new Date(item.fecha);
      const ano = fecha.getFullYear();
      const mesAno = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;

      const matchesDepartamento = item.departamento_id === selectedDepartamento.id;
      const matchesAno = selectedAnos.length === 0 || selectedAnos.includes(ano);
      const matchesMes = selectedMeses.length === 0 || selectedMeses.includes(mesAno);

      return matchesDepartamento && matchesAno && matchesMes;
    });

    this.processChartData();
  }

  public toggleDepartamento(dept: DepartamentoOption) {
    // Solo permite un departamento seleccionado a la vez
    this.departamentosOptions.forEach(d => d.selected = false);
    dept.selected = !dept.selected;
    this.applyFilters();
  }

  public toggleAno(ano: AnoOption) {
    ano.selected = !ano.selected;
    this.applyFilters();
  }

  public toggleMes(mes: MesOption) {
    mes.selected = !mes.selected;
    this.applyFilters();
  }

  public clearFilters() {
    // Limpiar todos los filtros
    this.departamentosOptions.forEach(dept => dept.selected = false);
    this.anosOptions.forEach(ano => ano.selected = false);
    this.mesesOptions.forEach(mes => mes.selected = false);
    this.applyFilters();
  }

  public hasActiveFilters(): boolean {
    return this.departamentosOptions.some(dept => dept.selected) ||
           this.anosOptions.some(ano => ano.selected) ||
           this.mesesOptions.some(mes => mes.selected);
  }

  public reloadData() {
    this.loadData();
  }

private processChartData() {
  // Obtener nombre del departamento seleccionado para el título
  const selectedDepartamento = this.departamentosOptions.find(dept => dept.selected);
  const tituloChart = selectedDepartamento
    ? `Rendimiento Departamento ${selectedDepartamento.nombre}`
    : 'Rendimiento por Departamentos';

  if (this.filteredData.length === 0) {
    this.chartOptions = {
      ...this.chartOptions,
      series: [],
      labels: [],
      title: {
        ...this.chartOptions.title,
        text: tituloChart
      },
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: []
      }
    };
    return;
  }

  // NUEVA LÓGICA: Agrupar datos por mes
  const groupedByMonth = this.filteredData.reduce((acc, item) => {
    const fecha = new Date(item.fecha);
    const year = fecha.getFullYear();
    const month = fecha.getMonth() + 1; // Mes desde 1
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

    if (!acc[monthKey]) {
      acc[monthKey] = {
        year,
        month,
        totalPagos: 0,
        totalGastos: 0,
        balance: 0,
        fechaOrden: new Date(year, month - 1, 1) // Para ordenar
      };
    }

    // Sumar los valores del mes
    acc[monthKey].totalPagos += Number(item.total_pagos);
    acc[monthKey].totalGastos += Number(item.total_gastos);
    acc[monthKey].balance += Number(item.balance_fecha);

    return acc;
  }, {} as any);

  // Convertir el objeto agrupado a array y ordenar por fecha
  const processedData = Object.keys(groupedByMonth)
    .map(key => {
      const data = groupedByMonth[key];
      const nombresMeses = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];

      return {
        label: `${nombresMeses[data.month - 1]} ${data.year}`,
        totalPagos: data.totalPagos,
        totalGastos: data.totalGastos,
        balance: data.balance,
        fechaOrden: data.fechaOrden
      };
    })
    .sort((a, b) => a.fechaOrden.getTime() - b.fechaOrden.getTime());

  const labels = processedData.map(item => item.label);
  const totalPagos = processedData.map(item => item.totalPagos);
  const totalGastos = processedData.map(item => item.totalGastos);
  const balances = processedData.map(item => item.balance);

  this.updateChartOptions(labels, totalPagos, totalGastos, balances, tituloChart);
}

// MODIFICACIÓN EN EL MÉTODO initializeChart() - Actualizar configuración del eje X
private initializeChart() {
  this.chartOptions = {
    series: [],
    chart: {
      height: 550,
      type: 'line',
      stacked: false
    },
    stroke: {
      width: [0, 0, 4],
      curve: 'smooth'
    },
    plotOptions: {
      bar: {
        columnWidth: '50%'  // Aumentar el ancho de las columnas para datos mensuales
      }
    },
    fill: {
      opacity: [0.85, 0.85, 1],
      gradient: {
        inverseColors: false,
        shade: 'light',
        type: "vertical",
        opacityFrom: 0.85,
        opacityTo: 0.55,
        stops: [0, 100, 100, 100]
      }
    },
    labels: [],
    markers: {
      size: 0
    },
    xaxis: {
      type: 'category',
      labels: {
        rotate: -20,  // Menos rotación para etiquetas mensuales
        style: {
          fontSize: '11px'  // Texto ligeramente más grande
        },
        maxHeight: 80
      },
      axisBorder: {
        show: true
      },
      axisTicks: {
        show: true
      }
    },
    yaxis: {
      title: {
        text: 'Monto ($)',
      },
      labels: {
        formatter: function(val: number) {
          return '$' + val.toLocaleString();
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (y: number) {
          if (typeof y !== "undefined") {
            return '$' + y.toLocaleString();
          }
          return y;
        }
      }
    },
    colors: ['#28a745', '#dc3545', '#007bff'],
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    dataLabels: {
      enabled: false
    },
    title: {
      text: 'Rendimiento por Departamentos',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333'
      }
    }
  };
}

  private updateChartOptions(labels: string[], totalPagos: number[], totalGastos: number[], balances: number[], titulo: string) {
    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Total Pagos',
          type: 'column',
          data: totalPagos
        },
        {
          name: 'Total Gastos',
          type: 'column',
          data: totalGastos
        },
        {
          name: 'Balance',
          type: 'line',
          data: balances
        }
      ],
      labels: labels,
      title: {
        ...this.chartOptions.title,
        text: titulo
      },
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: labels
      }
    };
  }

  // Métodos auxiliares para el template
  public trackByDeptId(index: number, item: DepartamentoOption): number {
    return item.id;
  }

  public trackByAnoValue(index: number, item: AnoOption): number {
    return item.value;
  }

  public trackByMesValue(index: number, item: MesOption): string {
    return item.value;
  }

  public getSelectedDepartamento(): DepartamentoOption | undefined {
    return this.departamentosOptions.find(dept => dept.selected);
  }

  public getSelectedAnosCount(): number {
    return this.anosOptions.filter(ano => ano.selected).length;
  }

  public getSelectedMesesCount(): number {
    return this.mesesOptions.filter(mes => mes.selected).length;
  }
}
