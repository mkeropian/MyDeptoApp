import { JsonPipe, DatePipe, CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';
import { PagosService } from '../../../../incomes/services/incomes.service';
import { Subject, takeUntil } from 'rxjs';
import { PagoGrid } from '../../../../incomes/interfaces/incomes.interface';

export type RadialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

interface DepartmentRanking {
  departmentName: string;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-ingresos-ranking-mensual-departamentos-page',
  imports: [ChartComponent, CurrencyPipe, CommonModule],
  templateUrl: './ingresosRankingMensualDepartamentos-page.component.html',
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
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .chart-title {
      font-size: 24px;
      font-weight: 600;
      color: #2d3748;
      margin: 0;
    }

    .chart-filters {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filter-select {
      padding: 8px 12px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #4a5568;
      font-size: 14px;
      cursor: pointer;
      transition: border-color 0.2s ease;
      min-width: 100px;
    }

    .filter-select:focus {
      outline: none;
      border-color: #3182ce;
    }

    .month-selector-container {
      position: relative;
      min-width: 200px;
    }

    .month-selector-header {
      padding: 8px 12px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #4a5568;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: border-color 0.2s ease;
      width: 100%;
      text-align: left;
    }

    .month-selector-header:hover,
    .month-selector-header:focus {
      border-color: #3182ce;
      outline: none;
    }

    .dropdown-arrow {
      font-size: 10px;
      transition: transform 0.2s ease;
    }

    .month-selector-header:hover .dropdown-arrow {
      transform: rotate(180deg);
    }

    .month-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      z-index: 1000;
    }

    .month-dropdown.open {
      max-height: 400px;
    }

    .month-option {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .month-option:hover {
      background-color: #f7fafc;
    }

    .month-option.select-all {
      border-bottom: 1px solid #e2e8f0;
      font-weight: 500;
      background-color: #f8f9fa;
    }

    .month-option input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }

    .month-option label {
      cursor: pointer;
      flex: 1;
      margin: 0;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 350px;
      font-size: 16px;
      color: #718096;
    }

    .error-message {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 350px;
      color: #e53e3e;
      font-size: 16px;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 350px;
      color: #718096;
    }

    .no-data-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .ranking-table-container {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .ranking-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin: 0 0 16px 0;
      text-align: center;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .ranking-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .ranking-table th {
      background: #4a5568;
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }

    .ranking-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }

    .ranking-table tbody tr:hover {
      background-color: #f7fafc;
    }

    .position {
      width: 80px;
      text-align: center;
    }

    .rank-badge {
      display: inline-block;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      color: white;
      font-weight: bold;
      line-height: 28px;
      text-align: center;
      font-size: 12px;
    }

    .rank-badge.rank-1 {
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      color: #744210;
    }

    .rank-badge.rank-2 {
      background: linear-gradient(135deg, #c0c0c0, #e2e8f0);
      color: #4a5568;
    }

    .rank-badge.rank-3 {
      background: linear-gradient(135deg, #cd7f32, #d69e2e);
      color: white;
    }

    .rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
      background: #718096;
    }

    .department-name {
      font-weight: 500;
      color: #2d3748;
    }

    .amount {
      font-weight: 500;
      font-family: 'Courier New', monospace;
      color: #059669;
      text-align: center;
      font-size: 15px;
    }

    .percentage {
      font-weight: bold;
      color: #3182ce;
      text-align: center;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }

    .summary-card {
      background: #f7fafc;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .summary-card .label {
      display: block;
      color: #718096;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .summary-card .value {
      display: block;
      color: #2d3748;
      font-size: 20px;
      font-weight: 600;
    }

    .summary-card .sub-value {
      display: block;
      color: #718096;
      font-size: 12px;
      margin-top: 4px;
    }

    @media (max-width: 768px) {
      .chart-container {
        margin: 10px;
        padding: 16px;
      }

      .chart-header {
        flex-direction: column;
        align-items: stretch;
      }

      .chart-filters {
        justify-content: center;
        flex-direction: column;
      }

      .ranking-table {
        font-size: 12px;
      }

      .ranking-table th,
      .ranking-table td {
        padding: 8px;
      }
    }
  `
})
export class IngresosRankingMensualDepartamentosPageComponent implements OnInit, OnDestroy {

  @ViewChild("chart") chart: ChartComponent | any;

  public chartOptions: Partial<RadialChartOptions> | any;
  public isLoading = true;
  public hasError = false;
  public errorMessage = '';
  public isMonthDropdownOpen = false;

  // Datos procesados
  public departmentRanking: DepartmentRanking[] = [];
  public availableYears: number[] = [];
  public availableMonths: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  public selectedYear: number = new Date().getFullYear();
  public selectedMonths: string[] = [];

  // Resumen
  public totalIngresos = 0;
  public topDepartment: DepartmentRanking | null = null;

  private destroy$ = new Subject<void>();
  private rawData: PagoGrid[] = [];

  constructor(
    private pagosService: PagosService
  ) {
    // Seleccionar el mes actual por defecto
    const currentMonth = new Date().getMonth();
    this.selectedMonths = [this.availableMonths[currentMonth]];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.month-selector-container')) {
      this.isMonthDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.initializeChart();
    this.loadPagosData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: 'radialBar',
        height: 500,
        toolbar: {
          show: true,
          tools: {
            download: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: 0,
          endAngle: 270,
          hollow: {
            margin: 5,
            size: '30%',
            background: 'transparent',
            image: undefined,
          },
          dataLabels: {
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: '500',
              color: '#374151',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              color: '#111827',
              offsetY: 6,
              formatter: (val: number) => {
                return Number(val || 0).toFixed(1) + '%';
              }
            },
            total: {
              show: true,
              showAlways: false,
              label: 'Total',
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: '600',
              color: '#374151',
              formatter: () => {
                return '$' + this.formatCurrency(this.totalIngresos);
              }
            }
          }
        }
      },
      colors: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
      ],
      labels: [],
      legend: {
        show: true,
        floating: true,
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        position: 'left',
        offsetX: 40,
        offsetY: 15,
        labels: {
          useSeriesColors: true,
        },
        markers: {
          size: 6,
        },
        formatter: (seriesName: string, opts: any) => {
          const value = this.departmentRanking[opts.seriesIndex]?.total || 0;
          return seriesName + ": $" + value.toLocaleString('es-AR');
        },
        itemMargin: {
          vertical: 3
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      stroke: {
        lineCap: 'round'
      }
    };
  }

  private loadPagosData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.pagosService.getPagos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: PagoGrid[]) => {
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

  private processPagosData(): void {
    if (!this.rawData || this.rawData.length === 0) {
      this.departmentRanking = [];
      this.updateChart();
      return;
    }

    // Extraer años disponibles
    this.availableYears = [...new Set(this.rawData.map(item =>
      new Date(item.fecha).getFullYear()
    ))].sort((a, b) => b - a);

    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }

    // Filtrar datos por año y meses seleccionados
    const filteredData = this.rawData.filter(item => {
      const date = new Date(item.fecha);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthName = this.availableMonths[monthIndex];

      return year === this.selectedYear && this.selectedMonths.includes(monthName);
    });

    // Agrupar por departamento
    const departmentGroups = this.groupByDepartment(filteredData);

    // Procesar ranking
    this.departmentRanking = this.processDepartmentRanking(departmentGroups);

    // Calcular resumen
    this.calculateSummary();

    // Actualizar gráfico
    this.updateChart();
  }

  private groupByDepartment(data: PagoGrid[]): { [key: string]: PagoGrid[] } {
    return data.reduce((groups, item) => {
      const departmentKey = `${item.idDep}-${item.nombre}`;
      if (!groups[departmentKey]) {
        groups[departmentKey] = [];
      }
      groups[departmentKey].push(item);
      return groups;
    }, {} as { [key: string]: PagoGrid[] });
  }

  private processDepartmentRanking(departmentGroups: { [key: string]: PagoGrid[] }): DepartmentRanking[] {
    const rankings = Object.entries(departmentGroups).map(([departmentKey, expenses]) => {
      const departmentName = expenses[0].nombre;
      const total = expenses.reduce((sum, expense) => sum + (Number(expense.monto) || 0), 0);

      return {
        departmentName,
        total,
        percentage: 0 // Se calculará después
      };
    });

    // Ordenar por total descendente
    rankings.sort((a, b) => b.total - a.total);

    // Calcular porcentajes
    const totalAmount = rankings.reduce((sum, dept) => sum + dept.total, 0);
    rankings.forEach(dept => {
      dept.percentage = totalAmount > 0 ? (dept.total / totalAmount) * 100 : 0;
    });

    // Limitar a los top 5 para mejor visualización
    return rankings.slice(0, 5);
  }

  private updateChart(): void {
    if (this.departmentRanking.length === 0) {
      this.chartOptions = {
        ...this.chartOptions,
        series: [],
        labels: []
      };
      return;
    }

    const series = this.departmentRanking.map(dept => dept.percentage);
    const labels = this.departmentRanking.map(dept => dept.departmentName);

    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      labels: labels
    };
  }

  private calculateSummary(): void {
    this.totalIngresos = Number(this.departmentRanking.reduce((sum, dept) => sum + dept.total, 0));
    this.topDepartment = this.departmentRanking.length > 0 ? this.departmentRanking[0] : null;
  }

  public toggleMonthDropdown(): void {
    this.isMonthDropdownOpen = !this.isMonthDropdownOpen;
  }

  public getSelectedMonthsText(): string {
    if (this.selectedMonths.length === 0) {
      return 'Seleccionar meses';
    } else if (this.selectedMonths.length === 1) {
      return this.selectedMonths[0];
    } else if (this.selectedMonths.length === this.availableMonths.length) {
      return 'Todos los meses';
    } else {
      return `${this.selectedMonths.length} meses seleccionados`;
    }
  }

  public areAllMonthsSelected(): boolean {
    return this.selectedMonths.length === this.availableMonths.length;
  }

  public toggleAllMonths(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedMonths = [...this.availableMonths];
    } else {
      this.selectedMonths = [];
    }
    this.processPagosData();
  }

  public onMonthToggle(month: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedMonths.includes(month)) {
        this.selectedMonths.push(month);
      }
    } else {
      this.selectedMonths = this.selectedMonths.filter(m => m !== month);
    }
    this.processPagosData();
  }

  public onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedYear = parseInt(target.value);
    this.processPagosData();
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = message;
    console.error(message);
  }

  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  }
}
