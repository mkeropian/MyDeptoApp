import { CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { 
  ChartComponent, 
  ApexAxisChartSeries, 
  ApexChart, 
  ApexXAxis, 
  ApexDataLabels, 
  ApexYAxis, 
  ApexLegend, 
  ApexFill, 
  ApexTooltip, 
  ApexGrid, 
  ApexPlotOptions, 
  NgApexchartsModule // IMPORTANTE: Importamos el Módulo completo
} from 'ng-apexcharts';
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
  // CORRECCION 1: Usamos NgApexchartsModule en lugar de ChartComponent
  imports: [CommonModule, NgApexchartsModule, CurrencyPipe], 
  templateUrl: './ingresosDepartamentos-page.component.html',
  styles: `
    .chart-container { max-width: 1200px; margin: 20px auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .chart-title { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0; }
    .chart-filters { display: flex; gap: 12px; }
    .filter-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; color: #374151; background-color: white; outline: none; cursor: pointer; }
    .loading-spinner { display: flex; justify-content: center; padding: 40px; color: #3b82f6; }
    .error-message { padding: 16px; background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; color: #b91c1c; text-align: center; }
    .no-data { padding: 40px; text-align: center; color: #6b7280; background-color: #f9fafb; border-radius: 8px; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
    .summary-card { padding: 16px; background: #f8fafc; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; }
    .summary-card .label { font-size: 0.875rem; color: #64748b; font-weight: 500; }
    .summary-card .value { font-size: 1.25rem; color: #0f172a; font-weight: 700; }
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
    chart: { type: 'bar', height: 350, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories: [] },
    yaxis: { title: { text: 'Monto ($)' } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (val) => `$${val.toLocaleString('es-AR')}` } },
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
          console.log('📥 Datos recibidos del servicio:', data.length); // DEBUG
          this.rawData = data;
          this.processPagosData();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError('Error al cargar los datos de ingresos');
        }
      });
  }

  private processPagosData(): void {
    if (!this.rawData || this.rawData.length === 0) {
      this.departmentExpenses = [];
      return;
    }

    // --- 1. Detectar años ---
    const yearsSet = new Set<number>();
    this.rawData.forEach(item => {
      const d = new Date(item.fecha);
      if(!isNaN(d.getFullYear())) yearsSet.add(d.getFullYear());
    });
    this.availableYears = Array.from(yearsSet).sort((a, b) => b - a);
    
    // Asegurar año válido
    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }
    console.log('📅 Año seleccionado:', this.selectedYear);

    // --- 2. Agrupar Datos ---
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const tempMap = new Map<string, { total: number, monthly: Map<string, number> }>();
    this.totalIngresos = 0;

    // Filtramos
    const datosFiltrados = this.rawData.filter(item => {
      const d = new Date(item.fecha);
      return d.getFullYear() === this.selectedYear;
    });

    console.log(`🔎 Registros encontrados para ${this.selectedYear}:`, datosFiltrados.length);

    datosFiltrados.forEach(item => {
      // Obtener Mes
      // Truco: Usamos 'new Date' + 'getUTCMonth' para evitar líos de zona horaria si viene ISO
      // O 'getMonth' simple. Vamos a usar un método seguro.
      const d = new Date(item.fecha);
      // Ajuste: si la fecha viene como string "2026-01-01", el new Date asume UTC.
      // Si usamos getMonth() en Argentina (GMT-3), las 00:00 se vuelven 21:00 del día anterior.
      // SOLUCIÓN: Usar UTC para determinar el mes si es string ISO.
      const monthIndex = d.getUTCMonth(); 

      const monthName = monthNames[monthIndex];
      const monto = Number(item.monto || 0);
      
      const itemAny = item as any;
      const deptName = itemAny.nombre || itemAny.departamento?.nombre || itemAny.departamento || 'Sin Departamento';

      if (!tempMap.has(deptName)) {
        tempMap.set(deptName, { total: 0, monthly: new Map() });
      }

      const current = tempMap.get(deptName)!;
      current.total += monto;
      this.totalIngresos += monto;

      const currentMonthVal = current.monthly.get(monthName) || 0;
      current.monthly.set(monthName, currentMonthVal + monto);
    });

    // --- 3. Construir Array final ---
    this.departmentExpenses = Array.from(tempMap.entries()).map(([name, val]) => {
      const monthlyDataObj: { [key: string]: number } = {};
      monthNames.forEach(m => monthlyDataObj[m] = val.monthly.get(m) || 0);
      return { departmentName: name, monthlyData: monthlyDataObj, total: val.total };
    });

    console.log('📊 Datos procesados para el gráfico:', this.departmentExpenses);

    this.calculateMetrics();
    
    // CORRECCIÓN 2: Pequeño delay para asegurar renderizado
    setTimeout(() => {
        this.updateChart();
    }, 100);
  }

  private updateChart(): void {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const newSeries = this.departmentExpenses.map(dept => ({
      name: dept.departmentName,
      data: monthNames.map(m => dept.monthlyData[m] || 0)
    }));

    console.log('📈 Series enviadas a ApexCharts:', newSeries);

    // Asignamos una NUEVA referencia al objeto chartOptions para forzar detección de cambios
    this.chartOptions = {
      ...this.chartOptions,
      series: newSeries,
      xaxis: { categories: monthNames },
      chart: { ...this.chartOptions.chart, type: this.selectedChartType }
    };
  }

  private calculateMetrics(): void {
    const currentMonthIndex = new Date().getMonth(); 
    const isCurrentYear = this.selectedYear === new Date().getFullYear();
    const totalMonths = isCurrentYear ? (currentMonthIndex + 1) : 12;
    
    this.promedioMensual = this.totalIngresos > 0 ? (this.totalIngresos / totalMonths) : 0;

    if (this.departmentExpenses.length > 0) {
      const topDept = this.departmentExpenses.reduce((prev, current) => (prev.total > current.total) ? prev : current);
      this.departamentoMayorIngreso = topDept.departmentName;
    } else {
      this.departamentoMayorIngreso = '-';
    }

    // Mes mayor
    const globalMonthly = new Map<string, number>();
    this.departmentExpenses.forEach(d => {
      Object.entries(d.monthlyData).forEach(([m, val]) => globalMonthly.set(m, (globalMonthly.get(m) || 0) + val));
    });
    let maxVal = -1; 
    let maxName = '-';
    globalMonthly.forEach((val, key) => { if (val > maxVal) { maxVal = val; maxName = key; } });
    this.mesConMayorIngreso = maxVal > 0 ? maxName : '-';
  }

  public onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedYear = parseInt(target.value);
    this.processPagosData();
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