import { JsonPipe, DatePipe, CurrencyPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';
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
  imports: [ChartComponent, CurrencyPipe, CommonModule],
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
export class IngresosDepartamentosPageComponent implements OnInit, OnDestroy{

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
  public totalIngresos = 0;
  public promedioMensual = 0;
  public departamentoMayorIngreso = '';
  public mesConMayorIngreso = '';

  private destroy$ = new Subject<void>();

  constructor(
    private pagosService: PagosService // Inyecta tu servicio aquí
  ) {}

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

  private loadPagosData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.pagosService.getPagos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: PagoGrid[]) => {
          this.processPagosData(data); // Delegamos el procesamiento
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar ingresos:', error);
          this.handleError('Error al cargar los datos de ingresos');
        }
      });
  }

  private processPagosData(data: PagoGrid[]): void {
    if (!data || data.length === 0) {
      this.departmentExpenses = [];
      this.updateChart();
      return;
    }

    // 1. Obtener Años disponibles (usando substring)
    const yearsSet = new Set(data.map(item =>
      parseInt(item.fecha.toString().substring(0, 4))
    ));
    this.availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }

    // 2. Filtrar por año seleccionado
    const filteredData = data.filter(item => {
      const year = parseInt(item.fecha.toString().substring(0, 4));
      return year === this.selectedYear;
    });

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const tempMap = new Map<string, { total: number, monthly: Map<string, number> }>();
    this.totalIngresos = 0;

    filteredData.forEach(item => {
      const monthIndex = parseInt(item.fecha.toString().substring(5, 7)) - 1;
      const monthName = monthNames[monthIndex];
      const monto = Number(item.monto || 0);

      // --- CORRECCIÓN AQUÍ ---
      // Usamos 'nombre' que es la propiedad correcta en tu interfaz PagoGrid
      const deptName = item.nombre || 'Sin Departamento';

      if (!tempMap.has(deptName)) {
        tempMap.set(deptName, { total: 0, monthly: new Map() });
      }

      const current = tempMap.get(deptName)!;
      current.total += monto;
      this.totalIngresos += monto;

      const currentMonthVal = current.monthly.get(monthName) || 0;
      current.monthly.set(monthName, currentMonthVal + monto);
    });

    // Convertir a estructura final
    this.departmentExpenses = Array.from(tempMap.entries()).map(([name, val]) => {
      const monthlyDataObj: { [key: string]: number } = {};
      monthNames.forEach(m => {
        monthlyDataObj[m] = val.monthly.get(m) || 0;
      });

      return {
        departmentName: name,
        monthlyData: monthlyDataObj,
        total: val.total
      };
    });

    // Calcular métricas adicionales
    const currentMonthIndex = new Date().getMonth();
    const isCurrentYear = this.selectedYear === new Date().getFullYear();
    const monthsDivisor = isCurrentYear ? (currentMonthIndex + 1) : 12;
    this.promedioMensual = this.totalIngresos > 0 ? (this.totalIngresos / monthsDivisor) : 0;

    if (this.departmentExpenses.length > 0) {
        const topDept = this.departmentExpenses.reduce((prev, current) =>
            (prev.total > current.total) ? prev : current
        );
        this.departamentoMayorIngreso = topDept.departmentName;
    } else {
        this.departamentoMayorIngreso = '-';
    }

    // Calcular mes con mayor ingreso
    const globalMonthly = new Map<string, number>();
    this.departmentExpenses.forEach(d => {
        Object.entries(d.monthlyData).forEach(([m, val]) => {
            globalMonthly.set(m, (globalMonthly.get(m) || 0) + val);
        });
    });

    let maxMonthVal = -1;
    let maxMonthName = '-';
    globalMonthly.forEach((val, key) => {
        if (val > maxMonthVal) {
            maxMonthVal = val;
            maxMonthName = key;
        }
    });
    this.mesConMayorIngreso = maxMonthVal > 0 ? maxMonthName : '-';

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

  private processDepartmentExpenses(departmentGroups: { [key: string]: PagoGrid[] }): DepartmentExpense[] {
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
        monthlyData[monthName] += Number(expense.monto) || 0;
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
      this.totalIngresos = 0;
      this.promedioMensual = 0;
      this.departamentoMayorIngreso = '';
      this.mesConMayorIngreso = '';
      return;
    }

    this.totalIngresos = Number(this.departmentExpenses.reduce((sum, dept) => sum + dept.total, 0));

    const totalMonths = Object.keys(this.departmentExpenses[0].monthlyData).length;
    this.promedioMensual = Number(this.totalIngresos / totalMonths);

    // Departamento con mayor gasto
    const deptWithMaxExpense = this.departmentExpenses.reduce((max, dept) =>
      dept.total > max.total ? dept : max
    );
    this.departamentoMayorIngreso = deptWithMaxExpense.departmentName;

    // Mes con mayor gasto
    const monthlyTotals: { [month: string]: number } = {};
    this.departmentExpenses.forEach(dept => {
      Object.entries(dept.monthlyData).forEach(([month, amount]) => {
        monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;
      });
    });

    this.mesConMayorIngreso = Object.entries(monthlyTotals).reduce((max, [month, total]) =>
      total > max[1] ? [month, total] : max
    )[0];
  }

  public onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedYear = parseInt(target.value);
    this.loadPagosData();
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
