import { JsonPipe, DatePipe, CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexYAxis, ApexLegend, ApexFill, ApexTooltip, ApexGrid, ApexPlotOptions, NgApexchartsModule } from 'ng-apexcharts';
import { PagosService } from '../../../../incomes/services/incomes.service';
import { Subject, takeUntil } from 'rxjs';
import { PagoGrid } from '../../../../incomes/interfaces/incomes.interface';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
};

interface DepartmentExpense {
  departmentName: string;
  monthlyData: { [month: string]: number };
  total: number;
}

@Component({
  selector: 'app-ingresos-departamentos-page',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, CurrencyPipe], // Agregamos NgApexchartsModule explícitamente
  templateUrl: './ingresosDepartamentos-page.component.html',
  styles: `
    .chart-container {
      max-width: 1200px;
      margin: 20px auto;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .chart-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .chart-filters {
      display: flex;
      gap: 12px;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #374151;
      background-color: white;
      outline: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-select:hover {
      border-color: #3b82f6;
    }

    .filter-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
      color: #3b82f6;
    }

    .error-message {
      padding: 16px;
      background-color: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 8px;
      color: #b91c1c;
      text-align: center;
    }

    .no-data {
      padding: 40px;
      text-align: center;
      color: #6b7280;
      background-color: #f9fafb;
      border-radius: 8px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .summary-card {
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-card .label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .summary-card .value {
      font-size: 1.25rem;
      color: #0f172a;
      font-weight: 700;
    }
  `
})
export class IngresosDepartamentosPageComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent | undefined;

  public isLoading = false;
  public hasError = false;
  public errorMessage = '';
  public rawData: PagoGrid[] = [];
  public departmentExpenses: DepartmentExpense[] = [];
  public availableYears: number[] = [];
  public selectedYear: number = new Date().getFullYear();
  public selectedChartType: 'bar' | 'area' | 'line' = 'bar';

  // Métricas
  public totalIngresos = 0;
  public promedioMensual = 0;
  public departamentoMayorIngreso = '-';
  public mesConMayorIngreso = '-';

  public chartOptions: ChartOptions = {
    series: [],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif'
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 }
    },
    dataLabels: { enabled: false },
    xaxis: { categories: [] },
    yaxis: {
      title: { text: 'Monto ($)' },
      labels: {
        formatter: (value) => {
          if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
          return `$${value}`;
        }
      }
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (val) => `$${val.toLocaleString('es-AR')}`
      }
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    legend: { position: 'bottom' },
    grid: { borderColor: '#f1f1f1' }
  };

  private destroy$ = new Subject<void>();

  constructor(private pagosService: PagosService) {}

  ngOnInit(): void {
    this.loadPagosData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPagosData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.pagosService.getPagos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rawData = data;
          this.processPagosData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar ingresos:', error);
          this.handleError('Error al cargar los datos de ingresos');
        }
      });
  }

  // --- LÓGICA CORREGIDA ---
  private processPagosData(): void {
    if (!this.rawData || this.rawData.length === 0) {
      this.departmentExpenses = [];
      this.updateChart();
      return;
    }

    // 1. Obtener Años disponibles de forma segura
    const yearsSet = new Set<number>();
    this.rawData.forEach(item => {
      // Intentamos extraer el año de forma robusta
      const fechaStr = String(item.fecha);
      // Si es "YYYY-MM-DD" tomamos los primeros 4
      if (fechaStr.length >= 4) {
        const y = parseInt(fechaStr.substring(0, 4));
        if (!isNaN(y)) yearsSet.add(y);
      }
    });

    this.availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Si no hay año seleccionado válido, tomar el primero
    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }

    // 2. Filtrar y Agrupar
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Estructura temporal: Map<NombreDepto, { total: number, monthly: Map<NombreMes, number> }>
    const tempMap = new Map<string, { total: number, monthly: Map<string, number> }>();
    this.totalIngresos = 0;

    // Filtrar datos para el año seleccionado
    const datosDelAnio = this.rawData.filter(item => {
      const fechaStr = String(item.fecha);
      const year = parseInt(fechaStr.substring(0, 4));
      return year === this.selectedYear;
    });

    datosDelAnio.forEach(item => {
      // A. Extraer Mes (índice 0-11)
      const fechaStr = String(item.fecha);
      // Asumimos formato ISO YYYY-MM-DD que es lo estándar en tu backend
      let monthIndex = parseInt(fechaStr.substring(5, 7)) - 1;

      // Validación extra por si acaso
      if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
         // Si falló el parseo simple, intentamos con Date object real
         const d = new Date(item.fecha);
         if (!isNaN(d.getTime())) {
            monthIndex = d.getMonth(); // Si es objeto Date, getMonth devuelve 0-11
         } else {
            return; // Fecha inválida, saltamos este registro
         }
      }

      const monthName = monthNames[monthIndex];
      const monto = Number(item.monto || 0);

      // B. Extraer Nombre Departamento (usando 'any' para evitar errores de tipo)
      const itemAny = item as any;
      // Busca: item.nombre O item.departamento.nombre O item.departamento (si es string)
      const deptName = itemAny.nombre || itemAny.departamento?.nombre || itemAny.departamento || 'Sin Departamento';

      // C. Acumular
      if (!tempMap.has(deptName)) {
        tempMap.set(deptName, { total: 0, monthly: new Map() });
      }

      const current = tempMap.get(deptName)!;
      current.total += monto;
      this.totalIngresos += monto;

      const currentMonthVal = current.monthly.get(monthName) || 0;
      current.monthly.set(monthName, currentMonthVal + monto);
    });

    // 3. Convertir Map a Array para el gráfico
    this.departmentExpenses = Array.from(tempMap.entries()).map(([name, val]) => {
      const monthlyDataObj: { [key: string]: number } = {};

      // Aseguramos que existan todos los meses, aunque sea en 0
      monthNames.forEach(m => {
        monthlyDataObj[m] = val.monthly.get(m) || 0;
      });

      return {
        departmentName: name,
        monthlyData: monthlyDataObj,
        total: val.total
      };
    });

    this.calculateMetrics();
    this.updateChart();
  }

  private updateChart(): void {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Construir series para ApexCharts
    const series = this.departmentExpenses.map(dept => ({
      name: dept.departmentName,
      data: monthNames.map(m => dept.monthlyData[m] || 0)
    }));

    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      xaxis: {
        categories: monthNames
      },
      chart: {
        ...this.chartOptions.chart,
        type: this.selectedChartType
      }
    };
  }

  private calculateMetrics(): void {
    const currentMonthIndex = new Date().getMonth();
    const isCurrentYear = this.selectedYear === new Date().getFullYear();
    // Si es año actual, dividimos por meses transcurridos; si es pasado, por 12
    const totalMonths = isCurrentYear ? (currentMonthIndex + 1) : 12;

    this.promedioMensual = this.totalIngresos > 0 ? (this.totalIngresos / totalMonths) : 0;

    if (this.departmentExpenses.length > 0) {
      // Departamento con mayor ingreso
      const topDept = this.departmentExpenses.reduce((prev, current) =>
        (prev.total > current.total) ? prev : current
      );
      this.departamentoMayorIngreso = topDept.departmentName;
    } else {
      this.departamentoMayorIngreso = '-';
    }

    // Mes con mayor ingreso global
    const globalMonthly = new Map<string, number>();
    this.departmentExpenses.forEach(d => {
      Object.entries(d.monthlyData).forEach(([m, val]) => {
        globalMonthly.set(m, (globalMonthly.get(m) || 0) + val);
      });
    });

    let maxVal = -1;
    let maxName = '-';
    globalMonthly.forEach((val, key) => {
      if (val > maxVal) {
        maxVal = val;
        maxName = key;
      }
    });
    this.mesConMayorIngreso = maxVal > 0 ? maxName : '-';
  }

  public onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedYear = parseInt(target.value);
    this.processPagosData(); // No hace falta recargar del servidor, ya tenemos rawData
  }

  public onChartTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedChartType = target.value as 'bar' | 'area' | 'line';
    this.updateChart();
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = message;
    console.error(message);
  }
}
