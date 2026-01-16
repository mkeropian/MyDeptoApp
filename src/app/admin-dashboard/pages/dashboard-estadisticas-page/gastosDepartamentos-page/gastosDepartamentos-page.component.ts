import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgApexchartsModule,
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
  ApexPlotOptions
} from 'ng-apexcharts';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { Gasto } from '../../../../gastos/interfaces/gasto.interface';

export interface GastoGrid extends Gasto {
  [key: string]: any;
}

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
  id: string;
  departmentName: string;
  monthlyData: number[];
  total: number;
}

@Component({
  selector: 'app-gastos-departamentos-page',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    FormsModule,
    CurrencyPipe
  ],
  templateUrl: './gastosDepartamentos-page.component.html',
  styleUrls: ['./gastosDepartamentos-page.component.css']
})
export class GastosDepartamentosPageComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent | undefined;

  public chartOptions: ChartOptions;
  public isLoading = true;

  private allGastos: GastoGrid[] = [];
  public departmentExpenses: DepartmentExpense[] = [];

  public selectedYear: number = new Date().getFullYear();
  public availableYears: number[] = [];
  public selectedChartType: 'bar' | 'area' | 'line' = 'bar';

  public totalGastos: number = 0;
  public promedioMensual: number = 0;
  public departamentoMayorGasto: string = '-';
  public mesConMayorGasto: string = '-';

  private meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  constructor(
    private gastosService: GastosService,
    private cdr: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [],
      chart: {
        height: 350,
        type: 'bar',
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: true },
        animations: { enabled: true }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          borderRadius: 2
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: [],
        labels: {
          rotate: -45,
          rotateAlways: false
        }
      },
      yaxis: {
        title: { text: 'Monto en Pesos' },
        labels: {
          formatter: (val) => {
            if (val >= 1000000) {
              const millions = val / 1000000;
              return `$${millions.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
            }
            if (val >= 1000) {
              const thousands = Math.round(val / 1000);
              return `$${thousands.toLocaleString('es-AR')}K`;
            }
            return `$${val.toLocaleString('es-AR')}`;
          }
        }
      },
      grid: { borderColor: '#f1f1f1' },
      fill: { opacity: 1 },
      tooltip: {
        y: { formatter: (val) => '$ ' + val.toLocaleString('es-AR') }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        offsetY: 0
      },
      colors: [
        '#008FFB',  // Azul
        '#00E396',  // Verde
        '#FEB019',  // Naranja
        '#FF4560',  // Rojo
        '#775DD0',  // Púrpura
        '#546E7A',  // Gris azulado
        '#26a69a',  // Turquesa
        '#D10CE8',  // Magenta
        '#00D9E9',  // Cyan
        '#F9CE1D',  // Amarillo
        '#FF9800',  // Naranja oscuro
        '#9C27B0'   // Púrpura oscuro
      ]
    };
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.gastosService.getGastos().subscribe({
      next: (data) => {
        this.allGastos = data;
        this.processYears();
        this.processDashboardData();

        // Marcamos como cargado y forzamos detección de cambios
        this.isLoading = false;
        this.cdr.detectChanges();

        // Esperamos a que Angular renderice el componente apx-chart en el DOM
        // y luego renderizamos el gráfico
        setTimeout(() => {
          this.renderChart();
        }, 200);
      },
      error: (err) => {
        console.error('Error cargando gastos:', err);
        this.isLoading = false;
      }
    });
  }

  private getFechaInfo(fecha: any): { year: number, month: number } | null {
    if (!fecha) return null;
    if (fecha instanceof Date) return { year: fecha.getUTCFullYear(), month: fecha.getUTCMonth() };

    const str = String(fecha).trim();
    const yearMatch = str.match(/\d{4}/);
    if (!yearMatch) return null;
    const year = parseInt(yearMatch[0]);

    const datePart = str.split('T')[0];
    const parts = datePart.split(/[-/]/);
    let month = -1;

    if (parts.length >= 2) {
      const yearIndex = parts.findIndex(p => p.includes(year.toString()));
      if (yearIndex !== -1 && parts.length >= 3) month = parseInt(parts[1]) - 1;
      else if (yearIndex === 0 && parts.length === 2) month = parseInt(parts[1]) - 1;
    }

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
       const d = new Date(str);
       return !isNaN(d.getTime()) ? { year: d.getUTCFullYear(), month: d.getUTCMonth() } : null;
    }
    return { year, month };
  }

  private processYears(): void {
    const years = new Set<number>();
    this.allGastos.forEach(g => {
      const info = this.getFechaInfo(g.fecha);
      if (info) years.add(info.year);
    });
    this.availableYears = Array.from(years).sort((a, b) => b - a);

    const currentYear = new Date().getFullYear();
    if (this.availableYears.includes(currentYear)) {
        this.selectedYear = currentYear;
    } else if (this.availableYears.length > 0) {
        this.selectedYear = this.availableYears[0];
    }
  }

  public onYearChange(): void {
    this.selectedYear = Number(this.selectedYear);
    this.processDashboardData();
    this.renderChart();
  }

  public onChartTypeChange(): void {
    this.renderChart();
  }

  private processDashboardData(): void {
    const targetYear = Number(this.selectedYear);
    const deptMap = new Map<string, { name: string, data: number[] }>();
    let totalAnualCalc = 0;

    this.allGastos.forEach(gasto => {
      const info = this.getFechaInfo(gasto.fecha);

      if (info && info.year === targetYear && info.month >= 0 && info.month <= 11) {

        let depId = gasto['idDep'];
        let depNombre = gasto['nombre'];

        if (!depId) depId = gasto['idDepartamento'];
        if (!depNombre) depNombre = gasto['departamento'];
        if (!depNombre) depNombre = 'Sin Nombre';

        const uniqueKey = String(depId ? depId : depNombre);

        if (typeof depNombre === 'string') {
            depNombre = depNombre.charAt(0).toUpperCase() + depNombre.slice(1);
        }

        const monto = Number(gasto.monto || 0);

        if (!deptMap.has(uniqueKey)) {
          deptMap.set(uniqueKey, {
              name: String(depNombre),
              data: new Array(12).fill(0)
          });
        }

        const entry = deptMap.get(uniqueKey)!;
        entry.data[info.month] += monto;

        if (entry.name === 'Sin Nombre' && depNombre !== 'Sin Nombre') {
            entry.name = String(depNombre);
        }

        totalAnualCalc += monto;
      }
    });

    this.departmentExpenses = Array.from(deptMap.entries()).map(([key, value]) => ({
      id: key,
      departmentName: value.name,
      monthlyData: value.data,
      total: value.data.reduce((a, b) => a + b, 0)
    }));

    this.departmentExpenses.sort((a, b) => b.total - a.total);

    // Calcular estadísticas
    this.totalGastos = totalAnualCalc;
    const currentDate = new Date();
    const isCurrentYear = targetYear === currentDate.getFullYear();
    const divisor = isCurrentYear ? (currentDate.getMonth() + 1) : 12;
    this.promedioMensual = this.totalGastos > 0 ? (this.totalGastos / divisor) : 0;
    this.departamentoMayorGasto = this.departmentExpenses.length > 0 ? this.departmentExpenses[0].departmentName : '-';

    const globalMonthly = new Array(12).fill(0);
    this.departmentExpenses.forEach(d => {
      d.monthlyData.forEach((val, idx) => globalMonthly[idx] += val);
    });
    let maxMesVal = 0;
    let maxMesIdx = -1;
    globalMonthly.forEach((val, idx) => {
      if(val > maxMesVal) { maxMesVal = val; maxMesIdx = idx; }
    });
    this.mesConMayorGasto = maxMesIdx >= 0 ? this.meses[maxMesIdx] : '-';
  }

  private renderChart(): void {
    // Verificar que hay datos para renderizar
    if (this.departmentExpenses.length === 0) {
      return;
    }

    // TODOS los tipos de gráfico ahora muestran datos mensuales
    const topDepts = this.departmentExpenses.slice(0, 8);
    const newSeries = topDepts.map(d => ({
      name: d.departmentName,
      data: d.monthlyData
    }));
    const newXAxisCategories = this.meses;

    // Actualizar las opciones del gráfico
    this.chartOptions = {
      ...this.chartOptions,
      chart: {
        ...this.chartOptions.chart,
        type: this.selectedChartType
      },
      xaxis: {
        categories: newXAxisCategories,
        labels: {
          rotate: -45,
          rotateAlways: false
        }
      },
      yaxis: {
        title: { text: 'Monto en Pesos' },
        labels: {
          formatter: (val) => {
            if (val >= 1000000) {
              const millions = val / 1000000;
              return `$${millions.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
            }
            if (val >= 1000) {
              const thousands = Math.round(val / 1000);
              return `$${thousands.toLocaleString('es-AR')}K`;
            }
            return `$${val.toLocaleString('es-AR')}`;
          }
        }
      },
      series: newSeries,
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        offsetY: 0
      },
      colors: [
        '#008FFB',  // Azul
        '#00E396',  // Verde
        '#FEB019',  // Naranja
        '#FF4560',  // Rojo
        '#775DD0',  // Púrpura
        '#546E7A',  // Gris azulado
        '#26a69a',  // Turquesa
        '#D10CE8',  // Magenta
        '#00D9E9',  // Cyan
        '#F9CE1D',  // Amarillo
        '#FF9800',  // Naranja oscuro
        '#9C27B0'   // Púrpura oscuro
      ]
    };

    // Forzar detección de cambios
    this.cdr.detectChanges();

    // Si el chart ya está disponible, actualizar sus opciones
    if (this.chart) {
      this.chart.updateOptions(this.chartOptions, true, true);
    }
  }
}
