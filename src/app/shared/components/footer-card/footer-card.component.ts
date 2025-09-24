import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasReportesService } from '../../../estadisticasReportes/services/estadisticasReportes.service';
import { PagoGrid } from '../../../incomes/interfaces/incomes.interface';
import { GastoGrid } from '../../../gastos/interfaces/gasto.interface';
import { rendDepGrid, rendPropGrid } from '../../../estadisticasReportes/interfaces/estadisticasReportes.interface';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-footer-card',
  imports: [CommonModule],
  templateUrl: './footer-card.component.html',
})
export class FooterCardComponent implements OnInit {

  constructor(private estadisticasService: EstadisticasReportesService) {}

  // Propiedades para mostrar en el template
  topDepartmentByRevenue = {
    name: '',
    value: 0,
    comparison: '',
    trend: ''
  };

  topDepartmentByPerformance = {
    name: '',
    value: 0,
    comparison: '',
    trend: ''
  };

  topOwnerByRevenue = {
    name: '',
    value: 0,
    comparison: '',
    trend: ''
  };

  totalMonthlyRevenue = 0;
  monthlyHonorarios = 0;
  loading = true;

  ngOnInit() {
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

    // 1. Departamento con más Facturación Mensual (mes anterior)
    this.calculateTopDepartmentByRevenue(pagos, lastMonth, lastMonthYear, twoMonthsAgo, twoMonthsAgoYear);

    // 2. Departamento con mejor Rendimiento Mensual (mes anterior)
    this.calculateTopDepartmentByPerformance(rendDep, lastMonth, lastMonthYear, twoMonthsAgo, twoMonthsAgoYear);

    // 3. Propietario con Mayor Facturación Mensual (mes anterior)
    this.calculateTopOwnerByRevenue(rendProp, lastMonth, lastMonthYear, twoMonthsAgo, twoMonthsAgoYear);

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
    const topDept = Object.entries(lastMonthByDept).reduce((max, [dept, amount]) =>
      amount > max.amount ? { dept, amount } : max
    , { dept: '', amount: 0 });

    if (topDept.dept) {
      const prevAmount = twoMonthsAgoByDept[topDept.dept] || 0;
      const change = topDept.amount - prevAmount;
      const percentage = prevAmount > 0 ? ((change / prevAmount) * 100).toFixed(1) : '0';

      this.topDepartmentByRevenue = {
        name: topDept.dept,
        value: topDept.amount,
        comparison: `${Math.abs(Number(percentage))}%`,
        trend: change >= 0 ? '↗︎' : '↘︎'
      };
    }
  }

  private calculateTopDepartmentByPerformance(
    rendDep: rendDepGrid[],
    lastMonth: number,
    lastMonthYear: number,
    twoMonthsAgo: number,
    twoMonthsAgoYear: number
  ) {
    // Filtrar rendimientos del mes anterior
    const lastMonthRend = rendDep.filter(rend => {
      const fecha = new Date(rend.fecha);
      return fecha.getMonth() + 1 === lastMonth && fecha.getFullYear() === lastMonthYear;
    });

    // Filtrar rendimientos de dos meses atrás
    const twoMonthsAgoRend = rendDep.filter(rend => {
      const fecha = new Date(rend.fecha);
      return fecha.getMonth() + 1 === twoMonthsAgo && fecha.getFullYear() === twoMonthsAgoYear;
    });

    // Calcular rendimiento (balance) promedio por departamento
    const lastMonthAvg = this.calculateAvgBalanceByDepartment(lastMonthRend);
    const twoMonthsAgoAvg = this.calculateAvgBalanceByDepartment(twoMonthsAgoRend);

    // Encontrar departamento con mejor rendimiento del mes anterior
    const topDept = Object.entries(lastMonthAvg).reduce((max, [dept, balance]) =>
      balance > max.balance ? { dept, balance } : max
    , { dept: '', balance: 0 });

    if (topDept.dept) {
      const prevBalance = twoMonthsAgoAvg[topDept.dept] || 0;
      const change = topDept.balance - prevBalance;
      const percentage = prevBalance > 0 ? ((change / prevBalance) * 100).toFixed(1) : '0';

      this.topDepartmentByPerformance = {
        name: topDept.dept,
        value: Number(topDept.balance.toFixed(0)),
        comparison: `${Math.abs(Number(percentage))}%`,
        trend: change >= 0 ? '↗︎' : '↘︎'
      };
    }
  }

  private calculateTopOwnerByRevenue(
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
    const lastMonthByOwner = this.groupByOwner(lastMonthRend);
    const twoMonthsAgoByOwner = this.groupByOwner(twoMonthsAgoRend);

    // Encontrar propietario con más facturación del mes anterior
    const topOwner = Object.entries(lastMonthByOwner).reduce((max, [owner, amount]) =>
      amount > max.amount ? { owner, amount } : max
    , { owner: '', amount: 0 });

    if (topOwner.owner) {
      const prevAmount = twoMonthsAgoByOwner[topOwner.owner] || 0;
      const change = topOwner.amount - prevAmount;
      const percentage = prevAmount > 0 ? ((change / prevAmount) * 100).toFixed(1) : '0';

      this.topOwnerByRevenue = {
        name: topOwner.owner,
        value: topOwner.amount,
        comparison: `${Math.abs(Number(percentage))}%`,
        trend: change >= 0 ? '↗︎' : '↘︎'
      };
    }
  }

  private calculateTotalMonthlyRevenue(pagos: PagoGrid[], currentMonth: number, currentYear: number) {
    const currentMonthPagos = pagos.filter(pago => {
      const fecha = new Date(pago.fecha);
      return fecha.getMonth() + 1 === currentMonth && fecha.getFullYear() === currentYear;
    });

    this.totalMonthlyRevenue = currentMonthPagos.reduce((total, pago) => total + pago.monto, 0);
  }

  private calculateMonthlyHonorarios(gastos: GastoGrid[], currentMonth: number, currentYear: number) {
    const currentMonthHonorarios = gastos.filter(gasto => {
      const fecha = new Date(gasto.fecha);
      const isCurrentMonth = fecha.getMonth() + 1 === currentMonth && fecha.getFullYear() === currentYear;
      const isHonorarios = gasto.descripcion && gasto.descripcion.toLowerCase().includes('honorario');
      return isCurrentMonth && isHonorarios;
    });

    this.monthlyHonorarios = currentMonthHonorarios.reduce((total, gasto) => total + gasto.monto, 0);
  }

  private groupByDepartment(pagos: PagoGrid[]): { [dept: string]: number } {
    return pagos.reduce((acc, pago) => {
      const dept = pago.nombre || 'Sin Departamento';
      acc[dept] = (acc[dept] || 0) + pago.monto;
      return acc;
    }, {} as { [dept: string]: number });
  }

  private groupByOwner(rendimientos: rendPropGrid[]): { [owner: string]: number } {
    return rendimientos.reduce((acc, rend) => {
      const owner = String(rend.propietario_nombre) || 'Sin Propietario';
      acc[owner] = (acc[owner] || 0) + rend.total_pagos;
      return acc;
    }, {} as { [owner: string]: number });
  }

  private calculateAvgBalanceByDepartment(rendimientos: rendDepGrid[]): { [dept: string]: number } {
    const grouped = rendimientos.reduce((acc, rend) => {
      const dept = rend.departamento_nombre || 'Sin Departamento';
      if (!acc[dept]) {
        acc[dept] = { total: 0, count: 0 };
      }
      acc[dept].total += rend.balance_fecha;
      acc[dept].count++;
      return acc;
    }, {} as { [dept: string]: { total: number; count: number } });

    return Object.entries(grouped).reduce((acc, [dept, data]) => {
      acc[dept] = data.total / data.count;
      return acc;
    }, {} as { [dept: string]: number });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
