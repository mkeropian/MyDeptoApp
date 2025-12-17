import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasReportesService } from '../../../estadisticasReportes/services/estadisticasReportes.service';
import { PagoGrid } from '../../../incomes/interfaces/incomes.interface';
import { GastoGrid } from '../../../gastos/interfaces/gasto.interface';
import { rendDepGrid, rendPropGrid } from '../../../estadisticasReportes/interfaces/estadisticasReportes.interface';
import { forkJoin } from 'rxjs';
import { SafeCurrencyPipe } from '../../../estadisticasReportes/pipes/safe-number.pipe';
import { DashboardDataService } from '../../services/dashboard-data.service';


@Component({
  selector: 'app-footer-card',
  imports: [CommonModule, SafeCurrencyPipe],
  templateUrl: './footer-card.component.html',
})
export class FooterCardComponent implements OnInit {

  private estadisticasService = inject(EstadisticasReportesService);
  private dashboardDataService = inject(DashboardDataService);

  // Propiedades para mostrar en el template
  topDepartmentByRevenue = {
    name: 'N/A',
    value: 0,
    comparison: '0%',
    trend: ''
  };

  topDepartmentByPerformance = {
    name: 'N/A',
    value: 0,
    comparison: '0%',
    trend: ''
  };

  topOwnerByRevenue = {
    name: 'N/A',
    value: 0,
    comparison: '0%',
    trend: ''
  };

  totalMonthlyRevenue = 0;
  monthlyHonorarios = 0;
  loading = true;

  constructor() {
    // Effect que escucha cambios en el signal y recarga los datos
    effect(() => {
      // Leer el signal para registrar la dependencia
      this.dashboardDataService.dataChange();

      // Recargar datos cuando el signal cambia
      this.loadData();
    });
  }

  ngOnInit() {
    // Carga inicial de datos
    this.loadData();
  }

  private loadData() {
    this.loading = true;

    forkJoin({
      pagos: this.estadisticasService.getPagos(),
      gastos: this.estadisticasService.getGastos(),
      rendDep: this.estadisticasService.getRendDiarioDep(),
      rendProp: this.estadisticasService.getRendDiarioProp()
    }).subscribe({
      next: (data) => {
        this.calculateIndicators(data.pagos, data.gastos, data.rendDep, data.rendProp);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.loading = false;
      }
    });
  }

  private calculateIndicators(
    pagos: PagoGrid[],
    gastos: GastoGrid[],
    rendDep: rendDepGrid[],
    rendProp: rendPropGrid[]
  ) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // Mes actual (1-12)
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const twoMonthsAgo = lastMonth === 1 ? 12 : lastMonth - 1;
    const twoMonthsAgoYear = lastMonth === 1 ? lastMonthYear - 1 : lastMonthYear;

    // 1. Departamento con más Facturación Mensual (mes anterior vs 2 meses atrás)
    this.calculateTopDepartmentByRevenue(pagos, lastMonth, lastMonthYear, twoMonthsAgo, twoMonthsAgoYear);

    // 2. Departamento con mejor Rendimiento Mensual (mes anterior vs 2 meses atrás)
    this.calculateTopDepartmentByPerformance(pagos, gastos, lastMonth, lastMonthYear, twoMonthsAgo, twoMonthsAgoYear);

    // 3. Propietario con Mayor Facturación Mensual (mes anterior vs 2 meses atrás) - usando rendProp
    this.calculateTopOwnerFromRendProp(rendProp, lastMonth, lastMonthYear, twoMonthsAgo, twoMonthsAgoYear);

    // 4. Facturación TOTAL Mensual (mes actual)
    this.calculateTotalMonthlyRevenue(pagos, currentMonth, currentYear);

    // 5. Honorarios del mes actual
    this.calculateMonthlyHonorarios(gastos, currentMonth, currentYear);
  }

  private calculateTopDepartmentByRevenue(
    pagos: PagoGrid[],
    lastMonth: number,
    lastMonthYear: number,
    twoMonthsAgo: number,
    twoMonthsAgoYear: number
  ) {
    // Filtrar pagos del mes anterior
    const lastMonthPagos = pagos.filter(pago => {
      const fecha = new Date(pago.fecha);
      return fecha.getMonth() + 1 === lastMonth && fecha.getFullYear() === lastMonthYear;
    });

    // Filtrar pagos de dos meses atrás
    const twoMonthsAgoPagos = pagos.filter(pago => {
      const fecha = new Date(pago.fecha);
      return fecha.getMonth() + 1 === twoMonthsAgo && fecha.getFullYear() === twoMonthsAgoYear;
    });

    // Agrupar por departamento y sumar facturación
    const lastMonthByDept = this.groupByDepartment(lastMonthPagos);
    const twoMonthsAgoByDept = this.groupByDepartment(twoMonthsAgoPagos);

    // Encontrar departamento con más facturación del mes anterior
    const entries = Object.entries(lastMonthByDept);
    if (entries.length === 0) {
      this.topDepartmentByRevenue = {
        name: 'Sin datos',
        value: 0,
        comparison: '0%',
        trend: ''
      };
      return;
    }

    const topDept = entries.reduce((max, [dept, amount]) =>
      amount > max.amount ? { dept, amount } : max
    , { dept: entries[0][0], amount: entries[0][1] });

    const prevAmount = twoMonthsAgoByDept[topDept.dept] || 0;
    const change = topDept.amount - prevAmount;
    const percentage = prevAmount > 0 ? ((change / prevAmount) * 100) : (topDept.amount > 0 ? 100 : 0);

    this.topDepartmentByRevenue = {
      name: topDept.dept,
      value: topDept.amount,
      comparison: `${Math.abs(percentage).toFixed(1)}%`,
      trend: change > 0 ? '↗︎' : change < 0 ? '↘︎' : ''
    };
  }

  private calculateTopDepartmentByPerformance(
    pagos: PagoGrid[],
    gastos: GastoGrid[],
    lastMonth: number,
    lastMonthYear: number,
    twoMonthsAgo: number,
    twoMonthsAgoYear: number
  ) {
    // Calcular rendimiento = ingresos - costos para cada departamento

    // Ingresos del mes anterior por departamento
    const lastMonthIngresos = this.groupByDepartment(
      pagos.filter(pago => {
        const fecha = new Date(pago.fecha);
        return fecha.getMonth() + 1 === lastMonth && fecha.getFullYear() === lastMonthYear;
      })
    );

    // Costos del mes anterior por departamento
    const lastMonthCostos = this.groupByDepartmentGastos(
      gastos.filter(gasto => {
        const fecha = new Date(gasto.fecha);
        return fecha.getMonth() + 1 === lastMonth && fecha.getFullYear() === lastMonthYear;
      })
    );

    // Ingresos de dos meses atrás por departamento
    const twoMonthsAgoIngresos = this.groupByDepartment(
      pagos.filter(pago => {
        const fecha = new Date(pago.fecha);
        return fecha.getMonth() + 1 === twoMonthsAgo && fecha.getFullYear() === twoMonthsAgoYear;
      })
    );

    // Costos de dos meses atrás por departamento
    const twoMonthsAgoCostos = this.groupByDepartmentGastos(
      gastos.filter(gasto => {
        const fecha = new Date(gasto.fecha);
        return fecha.getMonth() + 1 === twoMonthsAgo && fecha.getFullYear() === twoMonthsAgoYear;
      })
    );

    // Calcular rendimiento (ingresos - costos) para mes anterior
    const lastMonthRendimiento: { [dept: string]: number } = {};
    const allDepts = new Set([
      ...Object.keys(lastMonthIngresos),
      ...Object.keys(lastMonthCostos)
    ]);

    allDepts.forEach(dept => {
      const ingresos = lastMonthIngresos[dept] || 0;
      const costos = lastMonthCostos[dept] || 0;
      lastMonthRendimiento[dept] = ingresos - costos;
    });

    // Calcular rendimiento para dos meses atrás
    const twoMonthsAgoRendimiento: { [dept: string]: number } = {};
    const allDeptsPrev = new Set([
      ...Object.keys(twoMonthsAgoIngresos),
      ...Object.keys(twoMonthsAgoCostos)
    ]);

    allDeptsPrev.forEach(dept => {
      const ingresos = twoMonthsAgoIngresos[dept] || 0;
      const costos = twoMonthsAgoCostos[dept] || 0;
      twoMonthsAgoRendimiento[dept] = ingresos - costos;
    });

    // Encontrar departamento con mejor rendimiento
    const entries = Object.entries(lastMonthRendimiento);
    if (entries.length === 0) {
      this.topDepartmentByPerformance = {
        name: 'Sin datos',
        value: 0,
        comparison: '0%',
        trend: ''
      };
      return;
    }

    const topDept = entries.reduce((max, [dept, rendimiento]) =>
      rendimiento > max.rendimiento ? { dept, rendimiento } : max
    , { dept: entries[0][0], rendimiento: entries[0][1] });

    const prevRendimiento = twoMonthsAgoRendimiento[topDept.dept] || 0;
    const change = topDept.rendimiento - prevRendimiento;

    // Calcular porcentaje de cambio
    let percentage = 0;
    if (prevRendimiento !== 0) {
      percentage = (change / Math.abs(prevRendimiento)) * 100;
    } else if (topDept.rendimiento !== 0) {
      percentage = 100;
    }

    this.topDepartmentByPerformance = {
      name: topDept.dept,
      value: topDept.rendimiento,
      comparison: `${Math.abs(percentage).toFixed(1)}%`,
      trend: change > 0 ? '↗︎' : change < 0 ? '↘︎' : ''
    };
  }

  // Método auxiliar para calcular propietarios desde rendProp
  private calculateTopOwnerFromRendProp(
    rendProp: rendPropGrid[],
    lastMonth: number,
    lastMonthYear: number,
    twoMonthsAgo: number,
    twoMonthsAgoYear: number
  ) {
    // Filtrar rendimientos del mes anterior
    const lastMonthRend = rendProp.filter(rend => {
      const fecha = new Date(rend.fecha);
      return fecha.getMonth() + 1 === lastMonth && fecha.getFullYear() === lastMonthYear;
    });

    // Filtrar rendimientos de dos meses atrás
    const twoMonthsAgoRend = rendProp.filter(rend => {
      const fecha = new Date(rend.fecha);
      return fecha.getMonth() + 1 === twoMonthsAgo && fecha.getFullYear() === twoMonthsAgoYear;
    });

    // Agrupar por propietario y sumar total_pagos (facturación)
    const lastMonthByOwner = this.groupByOwnerFromRendProp(lastMonthRend);
    const twoMonthsAgoByOwner = this.groupByOwnerFromRendProp(twoMonthsAgoRend);

    // Encontrar propietario con más facturación del mes anterior
    const entries = Object.entries(lastMonthByOwner);
    if (entries.length === 0) {
      this.topOwnerByRevenue = {
        name: 'Sin datos',
        value: 0,
        comparison: '0%',
        trend: ''
      };
      return;
    }

    const topOwner = entries.reduce((max, [owner, amount]) =>
      amount > max.amount ? { owner, amount } : max
    , { owner: entries[0][0], amount: entries[0][1] });

    const prevAmount = twoMonthsAgoByOwner[topOwner.owner] || 0;
    const change = topOwner.amount - prevAmount;
    const percentage = prevAmount > 0 ? ((change / prevAmount) * 100) : (topOwner.amount > 0 ? 100 : 0);

    this.topOwnerByRevenue = {
      name: topOwner.owner,
      value: topOwner.amount,
      comparison: `${Math.abs(percentage).toFixed(1)}%`,
      trend: change > 0 ? '↗︎' : change < 0 ? '↘︎' : ''
    };
  }

  private groupByOwnerFromRendProp(rendimientos: rendPropGrid[]): { [owner: string]: number } {
    return rendimientos.reduce((acc, rend) => {
      const owner = String(rend.propietario_nombre) || 'Sin Propietario';
      const totalPagos = typeof rend.total_pagos === 'string' ? parseFloat(rend.total_pagos) : (rend.total_pagos || 0);
      acc[owner] = (acc[owner] || 0) + totalPagos;
      return acc;
    }, {} as { [owner: string]: number });
  }

  private calculateTotalMonthlyRevenue(pagos: PagoGrid[], currentMonth: number, currentYear: number) {
    const currentMonthPagos = pagos.filter(pago => {
      const fecha = new Date(pago.fecha);
      return fecha.getMonth() + 1 === currentMonth && fecha.getFullYear() === currentYear;
    });

    this.totalMonthlyRevenue = currentMonthPagos.reduce((total, pago) => {
      const monto = typeof pago.monto === 'string' ? parseFloat(pago.monto) : (pago.monto || 0);
      return total + monto;
    }, 0);
  }

  private calculateMonthlyHonorarios(gastos: GastoGrid[], currentMonth: number, currentYear: number) {
    const currentMonthHonorarios = gastos.filter(gasto => {
      const fecha = new Date(gasto.fecha);
      const isCurrentMonth = fecha.getMonth() + 1 === currentMonth && fecha.getFullYear() === currentYear;
      const isHonorarios = gasto.idTipoGasto === 1;
      return isCurrentMonth && isHonorarios;
    });

    this.monthlyHonorarios = currentMonthHonorarios.reduce((total, gasto) => {
      // Convertir explícitamente a número para evitar concatenación de strings
      const monto = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : (gasto.monto || 0);
      return total + monto;
    }, 0);
  }

  private groupByDepartment(pagos: PagoGrid[]): { [dept: string]: number } {
    return pagos.reduce((acc, pago) => {
      const dept = pago.nombre || 'Sin Departamento';
      const monto = typeof pago.monto === 'string' ? parseFloat(pago.monto) : (pago.monto || 0);
      acc[dept] = (acc[dept] || 0) + monto;
      return acc;
    }, {} as { [dept: string]: number });
  }

  private groupByDepartmentGastos(gastos: GastoGrid[]): { [dept: string]: number } {
    return gastos.reduce((acc, gasto) => {
      const dept = gasto.nombre || 'Sin Departamento';
      const monto = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : (gasto.monto || 0);
      acc[dept] = (acc[dept] || 0) + monto;
      return acc;
    }, {} as { [dept: string]: number });
  }

  formatCurrency(value: number | null | undefined): string {
    const safeValue = value ?? 0;
    if (isNaN(safeValue) || !isFinite(safeValue)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeValue);
  }
}
