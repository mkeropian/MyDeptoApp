// gastosDepartamentos-page.component.ts
import { JsonPipe, DatePipe, CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexYAxis, ApexLegend, ApexFill, ChartComponent, ApexTooltip, ApexGrid, ApexPlotOptions } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { GastoGrid } from '../../../../gastos/interfaces/gasto.interface';

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
  selector: 'app-gastos-departamentos-page',
  imports: [ChartComponent, JsonPipe, DatePipe, CurrencyPipe, CommonModule],
  templateUrl: './gastosDepartamentos-page.component.html',
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
    }

    .filter-select:focus {
      outline: none;
      border-color: #3182ce;
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
      }
    }
  `
})
export class GastosDepartamentosPageComponent implements OnInit, OnDestroy {
  @ViewChild("chart") chart: ChartComponent | any;

  public chartOptions: Partial<ChartOptions> | any;
  public isLoading = true;
  public hasError = false;
  public errorMessage = '';

  // Datos procesados
  public departmentExpenses: DepartmentExpense[] = [];
  public availableYears: number[] = [];
  public availableMonths: string[] = [];
  public selectedYear: number = new Date().getFullYear();
  public selectedChartType: 'bar' | 'area' | 'line' = 'bar';

  // Resumen
  public totalGastos = 0;
  public promedioMensual = 0;
  public departamentoMayorGasto = '';
  public mesConMayorGasto = '';

  private destroy$ = new Subject<void>();

  constructor(
    private gastosService: GastosService // Inyecta tu servicio aquí
  ) {}

  ngOnInit(): void {
    this.initializeChart();
    this.loadGastosData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: this.selectedChartType,
        height: 450,
        stacked: false,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '65%',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      colors: ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#dd6b20', '#319795'],
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: undefined,
          inverseColors: false,
          opacityFrom: 0.8,
          opacityTo: 0.6,
          stops: [0, 100]
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        floating: false,
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 500
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#718096',
            fontSize: '12px'
          }
        },
        axisBorder: {
          show: true,
          color: '#e2e8f0'
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#718096',
            fontSize: '12px'
          },
          formatter: (val: number) => {
            return '$' + this.formatCurrency(val);
          }
        },
        title: {
          text: 'Monto en Pesos',
          style: {
            color: '#4a5568',
            fontSize: '14px',
            fontWeight: 500
          }
        }
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (val: number) => {
            return '$' + val.toLocaleString('es-AR');
          }
        },
        x: {
          format: 'MMM yyyy'
        }
      }
    };
  }

  private loadGastosData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.gastosService.getGastos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: GastoGrid[]) => {
          this.processGastosData(data);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar gastos:', error);
          this.handleError('Error al cargar los datos de gastos');
        }
      });
  }

  private processGastosData(data: GastoGrid[]): void {
    if (!data || data.length === 0) {
      this.departmentExpenses = [];
      this.updateChart();
      return;
    }

    // Extraer años disponibles
    this.availableYears = [...new Set(data.map(item =>
      new Date(item.fecha).getFullYear()
    ))].sort((a, b) => b - a);

    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }

    // Filtrar datos por año seleccionado
    const filteredData = data.filter(item =>
      new Date(item.fecha).getFullYear() === this.selectedYear
    );

    // Agrupar por departamento
    const departmentGroups = this.groupByDepartment(filteredData);

    // Procesar datos para el gráfico
    this.departmentExpenses = this.processDepartmentExpenses(departmentGroups);

    // Calcular resumen
    this.calculateSummary();

    // Actualizar gráfico
    this.updateChart();
  }

  private groupByDepartment(data: GastoGrid[]): { [key: string]: GastoGrid[] } {
    return data.reduce((groups, item) => {
      const departmentKey = `${item.idDep}-${item.nombre}`;
      if (!groups[departmentKey]) {
        groups[departmentKey] = [];
      }
      groups[departmentKey].push(item);
      return groups;
    }, {} as { [key: string]: GastoGrid[] });
  }

  private processDepartmentExpenses(departmentGroups: { [key: string]: GastoGrid[] }): DepartmentExpense[] {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    return Object.entries(departmentGroups).map(([departmentKey, expenses]) => {
      const departmentName = expenses[0].nombre;
      const monthlyData: { [month: string]: number } = {};

      // Inicializar todos los meses en 0
      months.forEach(month => {
        monthlyData[month] = 0;
      });

      // Sumar gastos por mes
      expenses.forEach(expense => {
        const date = new Date(expense.fecha);
        const monthIndex = date.getMonth();
        const monthName = months[monthIndex];
        monthlyData[monthName] += expense.monto;
      });

      const total = Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0);

      return {
        departmentName,
        monthlyData,
        total
      };
    }).sort((a, b) => b.total - a.total); // Ordenar por total descendente
  }

  private updateChart(): void {
    if (this.departmentExpenses.length === 0) {
      this.chartOptions = {
        ...this.chartOptions,
        series: [],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: []
        }
      };
      return;
    }

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const series = this.departmentExpenses.map(dept => ({
      name: dept.departmentName,
      data: months.map(month => dept.monthlyData[month] || 0)
    }));

    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: months
      },
      chart: {
        ...this.chartOptions.chart,
        type: this.selectedChartType
      }
    };
  }

  private calculateSummary(): void {
    if (this.departmentExpenses.length === 0) {
      this.totalGastos = 0;
      this.promedioMensual = 0;
      this.departamentoMayorGasto = '';
      this.mesConMayorGasto = '';
      return;
    }

    this.totalGastos = this.departmentExpenses.reduce((sum, dept) => sum + dept.total, 0);

    const totalMonths = Object.keys(this.departmentExpenses[0].monthlyData).length;
    this.promedioMensual = this.totalGastos / totalMonths;

    // Departamento con mayor gasto
    const deptWithMaxExpense = this.departmentExpenses.reduce((max, dept) =>
      dept.total > max.total ? dept : max
    );
    this.departamentoMayorGasto = deptWithMaxExpense.departmentName;

    // Mes con mayor gasto
    const monthlyTotals: { [month: string]: number } = {};
    this.departmentExpenses.forEach(dept => {
      Object.entries(dept.monthlyData).forEach(([month, amount]) => {
        monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;
      });
    });

    this.mesConMayorGasto = Object.entries(monthlyTotals).reduce((max, [month, total]) =>
      total > max[1] ? [month, total] : max
    )[0];
  }

  public onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedYear = parseInt(target.value);
    this.loadGastosData();
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

  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  }
}
