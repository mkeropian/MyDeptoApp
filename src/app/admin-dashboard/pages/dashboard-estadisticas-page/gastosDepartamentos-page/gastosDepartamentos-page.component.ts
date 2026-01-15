import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importante para ngModel
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

// Extendemos la interfaz para asegurar que departamento exista
export interface GastoGrid extends Gasto {
  departamento?: string;
  tipoGasto?: string;
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
  departmentName: string;
  monthlyData: number[]; // Array de 12 posiciones para simplificar gráficos
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
  templateUrl: './gastosDepartamentos-page.component.html'
})
export class GastosDepartamentosPageComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent | undefined;

  public chartOptions: ChartOptions;
  public isLoading = false;

  // Datos crudos
  private allGastos: GastoGrid[] = [];

  // Datos procesados
  public departmentExpenses: DepartmentExpense[] = [];

  // Filtros
  public selectedYear: number = new Date().getFullYear();
  public availableYears: number[] = [];
  public selectedChartType: 'bar' | 'area' | 'line' = 'bar';

  // Estadísticas
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
    // Configuración Base del Gráfico
    this.chartOptions = {
      series: [],
      chart: {
        height: 350,
        type: 'bar',
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: true },
        animations: { enabled: true, speed: 800 }
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 }
      },
      dataLabels: { enabled: false },
      xaxis: { categories: [] },
      yaxis: {
        title: { text: 'Monto ($)' },
        labels: { formatter: (val) => '$' + val.toLocaleString('es-AR', { notation: "compact" }) }
      },
      grid: { borderColor: '#f1f1f1' },
      fill: { opacity: 1 },
      tooltip: {
        y: { formatter: (val) => '$ ' + val.toLocaleString('es-AR') }
      },
      legend: { position: 'top' },
      colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8']
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
        this.updateDashboard();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando gastos:', err);
        this.isLoading = false;
      }
    });
  }

  // --- PARSER DE FECHA UNIVERSAL (Igual que en Recaudación) ---
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

    // Si el año seleccionado no existe, usar el más reciente
    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }
  }

  public onYearChange(): void {
    // Asegurar conversión a número
    this.selectedYear = Number(this.selectedYear);
    this.updateDashboard();
  }

  public onChartTypeChange(): void {
    this.updateChartRender();
  }

  private updateDashboard(): void {
    const targetYear = Number(this.selectedYear);
    console.log(`Procesando Departamentos para año: ${targetYear}`);

    // Mapa temporal para agrupar: Clave = Nombre Depto
    const deptMap = new Map<string, number[]>();

    let totalAnualCalc = 0;

    this.allGastos.forEach(gasto => {
      const info = this.getFechaInfo(gasto.fecha);

      if (info && info.year === targetYear && info.month >= 0 && info.month <= 11) {
        // Normalizar nombre departamento
        const deptName = gasto.departamento ? gasto.departamento.trim() : 'Sin Departamento';
        const monto = Number(gasto.monto || 0);

        if (!deptMap.has(deptName)) {
          deptMap.set(deptName, new Array(12).fill(0));
        }

        const meses = deptMap.get(deptName)!;
        meses[info.month] += monto;

        totalAnualCalc += monto;
      }
    });

    // Convertir Mapa a Array estructurado
    this.departmentExpenses = Array.from(deptMap.entries()).map(([name, meses]) => ({
      departmentName: name,
      monthlyData: meses,
      total: meses.reduce((a, b) => a + b, 0)
    }));

    // Ordenar por gasto total descendente
    this.departmentExpenses.sort((a, b) => b.total - a.total);

    console.log('Datos procesados:', this.departmentExpenses);

    // Actualizar Estadísticas
    this.totalGastos = totalAnualCalc;

    const currentDate = new Date();
    const isCurrentYear = targetYear === currentDate.getFullYear();
    const divisor = isCurrentYear ? (currentDate.getMonth() + 1) : 12;
    this.promedioMensual = this.totalGastos > 0 ? (this.totalGastos / divisor) : 0;

    if (this.departmentExpenses.length > 0) {
      this.departamentoMayorGasto = this.departmentExpenses[0].departmentName;
    } else {
      this.departamentoMayorGasto = '-';
    }

    // Calcular mes con mayor gasto global
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

    this.updateChartRender();
  }

  private updateChartRender(): void {
    if (!this.chart) return; // O esperar al next tick

    const isBar = this.selectedChartType === 'bar';

    let newSeries: ApexAxisChartSeries = [];
    let newXAxisCategories: string[] = [];

    if (isBar) {
      // GRÁFICO DE BARRAS: Eje X = Departamentos, Y = Total Anual
      // Top 10 para no saturar si hay muchos
      const topDepts = this.departmentExpenses.slice(0, 15);

      newSeries = [{
        name: 'Gasto Total',
        data: topDepts.map(d => d.total)
      }];
      newXAxisCategories = topDepts.map(d => d.departmentName);

    } else {
      // GRÁFICO LINEA / AREA: Eje X = Meses, Series = Departamentos
      // Tomamos solo los top 5 o 7 departamentos para que se entienda
      const topDepts = this.departmentExpenses.slice(0, 7);

      newSeries = topDepts.map(d => ({
        name: d.departmentName,
        data: d.monthlyData
      }));
      newXAxisCategories = this.meses;
    }

    // Actualizamos opciones
    this.chartOptions = {
      ...this.chartOptions,
      chart: {
        ...this.chartOptions.chart,
        type: this.selectedChartType
      },
      xaxis: {
        categories: newXAxisCategories
      },
      // Si es barra mostramos nombres abajo, si es linea mostramos meses
      series: newSeries
    };

    // Forzamos actualización visual
    this.cdr.detectChanges();
    if (this.chart) {
      this.chart.updateOptions(this.chartOptions);
    }
  }
}
