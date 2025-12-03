import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import { RendicionesService } from '../../../shared/services/rendiciones.service';
import { RendicionFiltros, RendicionMovimiento, RendicionResumen } from '../../../shared/interfaces/rendicion.interface';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface GrupoMovimientos {
  departamento: string;
  movimientos: RendicionMovimiento[];
  totalIngresos: number;
  totalGastos: number;
  balance: number;
}

@Component({
  selector: 'rendiciones-admin-prop-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rendiciones-admin-prop-page.component.html',
})
export class RendicionesAdminPropPageComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private rendicionesService = inject(RendicionesService);
  private departamentosService = inject(DepartamentosService);
  private notificationService = inject(NotificationService);

  // Signals
  departamentos = signal<Departamento[]>([]);
  movimientos = signal<RendicionMovimiento[]>([]);
  loading = signal<boolean>(false);
  loadingExport = signal<boolean>(false);
  loadingExportDep = signal<string | null>(null);
  mostrarResultados = signal<boolean>(false);
  idPropietario = signal<number | null>(null);

  // Computed
  currentUser = computed(() => this.authService.user());

  resumen = computed<RendicionResumen>(() => {
    const movs = this.movimientos();

    const totalIngresos = movs
      .filter(m => m.tipoOperacion === 'Ingreso')
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const totalGastos = movs
      .filter(m => m.tipoOperacion === 'Gasto')
      .reduce((sum, m) => sum + Number(m.monto), 0);

    return {
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
      cantidadMovimientos: movs.length
    };
  });

  movimientosAgrupados = computed<GrupoMovimientos[]>(() => {
    const movs = this.movimientos();

    // Agrupar por departamento
    const grupos = new Map<string, RendicionMovimiento[]>();

    movs.forEach(mov => {
      if (!grupos.has(mov.departamento)) {
        grupos.set(mov.departamento, []);
      }
      grupos.get(mov.departamento)!.push(mov);
    });

    // Convertir a array y calcular totales
    const resultado: GrupoMovimientos[] = [];

    grupos.forEach((movimientos, departamento) => {
      // Ordenar movimientos por fecha descendente
      movimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      const totalIngresos = movimientos
        .filter(m => m.tipoOperacion === 'Ingreso')
        .reduce((sum, m) => sum + Number(m.monto), 0);

      const totalGastos = movimientos
        .filter(m => m.tipoOperacion === 'Gasto')
        .reduce((sum, m) => sum + Number(m.monto), 0);

      resultado.push({
        departamento,
        movimientos,
        totalIngresos,
        totalGastos,
        balance: totalIngresos - totalGastos
      });
    });

    // Ordenar grupos por nombre de departamento
    resultado.sort((a, b) => a.departamento.localeCompare(b.departamento));

    return resultado;
  });

  departamentosSeleccionadosTexto = computed(() => {
    const ids = this.filtrosForm.get('departamentos')?.value || [];
    const deps = this.departamentos();

    if (ids.length === 0) return 'Ninguno seleccionado';
    if (ids.length === deps.length) return 'Todos los departamentos';

    const nombres = deps
      .filter(d => ids.includes(d.id))
      .map(d => d.nombre)
      .join(', ');

    return nombres;
  });

  periodoTexto = computed(() => {
    const tipo = this.filtrosForm.get('tipoPeriodo')?.value;

    if (tipo === 'diario') {
      const fecha = this.filtrosForm.get('fecha')?.value;
      if (!fecha) return '';

      const [anio, mes, dia] = fecha.split('-');
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${dia} de ${meses[parseInt(mes) - 1]} ${anio}`;
    } else {
      const anio = this.filtrosForm.get('anio')?.value;
      const mes = this.filtrosForm.get('mes')?.value;

      if (!anio || !mes) return '';

      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${meses[mes - 1]} ${anio}`;
    }
  });

  // Form
  filtrosForm: FormGroup;

  // Arrays auxiliares
  anios: number[] = [];
  meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  constructor() {
    const currentYear = new Date().getFullYear();
    this.anios = Array.from({ length: 10 }, (_, i) => currentYear - i);

    this.filtrosForm = this.fb.group({
      departamentos: [[], Validators.required],
      tipoPeriodo: ['mensual', Validators.required],
      fecha: [this.getTodayString()],
      anio: [currentYear],
      mes: [new Date().getMonth() + 1]
    });

    this.filtrosForm.get('tipoPeriodo')?.valueChanges.subscribe(tipo => {
      this.updateValidators(tipo);
    });
  }

  ngOnInit(): void {
    this.cargarDepartamentos();
  }

  private cargarDepartamentos(): void {
    const user = this.currentUser();
    if (!user?.id) return;

    this.loading.set(true);

    const tieneSoloRolProp = user.roles?.length === 1 && user.roles.includes('prop');

    if (tieneSoloRolProp) {
      // Primero obtener el idPropietario del usuario
      this.rendicionesService.getPropietarioByUsuario(user.id).subscribe({
        next: (response) => {
          this.idPropietario.set(response.idPropietario);
          // Ahora sí cargar los departamentos con el idPropietario correcto
          this.rendicionesService.getDepartamentosByPropietario(response.idPropietario).subscribe({
            next: (deps) => {
              this.departamentos.set(deps);
              this.loading.set(false);
            },
            error: (error) => {
              console.error('Error cargando departamentos del propietario:', error);
              this.loading.set(false);
            }
          });
        },
        error: (error) => {
          console.error('Error obteniendo propietario del usuario:', error);
          this.loading.set(false);
        }
      });
    } else {
      // admin o gerenciadora: cargar todos los departamentos activos
      this.departamentosService.getDepartamentosActivos().subscribe({
        next: (deps) => {
          this.departamentos.set(deps);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando todos los departamentos:', error);
          this.loading.set(false);
        }
      });
    }
  }

  private updateValidators(tipoPeriodo: string): void {
    const fechaControl = this.filtrosForm.get('fecha');
    const anioControl = this.filtrosForm.get('anio');
    const mesControl = this.filtrosForm.get('mes');

    if (tipoPeriodo === 'diario') {
      fechaControl?.setValidators([Validators.required]);
      anioControl?.clearValidators();
      mesControl?.clearValidators();
    } else {
      fechaControl?.clearValidators();
      anioControl?.setValidators([Validators.required]);
      mesControl?.setValidators([Validators.required]);
    }

    fechaControl?.updateValueAndValidity();
    anioControl?.updateValueAndValidity();
    mesControl?.updateValueAndValidity();
  }

  toggleDepartamento(depId: number): void {
    const current = this.filtrosForm.get('departamentos')?.value || [];
    const index = current.indexOf(depId);

    if (index === -1) {
      this.filtrosForm.patchValue({ departamentos: [...current, depId] });
    } else {
      this.filtrosForm.patchValue({
        departamentos: current.filter((id: number) => id !== depId)
      });
    }
  }

  isDepartamentoSeleccionado(depId: number): boolean {
    const selected = this.filtrosForm.get('departamentos')?.value || [];
    return selected.includes(depId);
  }

  seleccionarTodos(): void {
    const allIds = this.departamentos().map(d => d.id);
    this.filtrosForm.patchValue({ departamentos: allIds });
  }

  limpiarSeleccion(): void {
    this.filtrosForm.patchValue({ departamentos: [] });
  }

  mostrarRendicion(): void {
    if (this.filtrosForm.invalid) {
      this.filtrosForm.markAllAsTouched();
      return;
    }

    const filtros = this.buildFiltros();
    this.loading.set(true);
    this.mostrarResultados.set(false);

    this.rendicionesService.getMovimientos(filtros).subscribe({
      next: (movs) => {
        this.movimientos.set(movs);
        this.mostrarResultados.set(true);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error obteniendo movimientos:', error);
        this.movimientos.set([]);
        this.mostrarResultados.set(true);
        this.loading.set(false);
      }
    });
  }

  exportarExcel(): void {
    if (this.filtrosForm.invalid) {
      this.filtrosForm.markAllAsTouched();
      return;
    }

    const filtros = this.buildFiltros();
    this.loadingExport.set(true);

    this.rendicionesService.exportToExcel(filtros).subscribe({
      next: (blob) => {
        this.rendicionesService.downloadExcel(blob, filtros);
        this.loadingExport.set(false);
        this.notificationService.mostrarNotificacion('Archivo exportado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error exportando:', error);
        this.loadingExport.set(false);
        this.notificationService.mostrarNotificacion('Error al exportar el archivo', 'error');
      }
    });
  }

  exportarDepartamento(grupo: GrupoMovimientos): void {
    if (this.filtrosForm.invalid) {
      return;
    }

    // Obtener el ID del departamento desde los datos
    const depSeleccionado = this.departamentos().find(d =>
      grupo.departamento.includes(d.nombre)
    );

    if (!depSeleccionado) {
      this.notificationService.mostrarNotificacion('No se pudo identificar el departamento', 'error');
      return;
    }

    // Construir filtros pero solo para este departamento
    const filtros = this.buildFiltros();
    filtros.idsDepartamentos = [depSeleccionado.id];

    this.loadingExportDep.set(grupo.departamento);

    this.rendicionesService.exportToExcel(filtros).subscribe({
      next: (blob) => {
        this.rendicionesService.downloadExcel(blob, filtros);
        this.loadingExportDep.set(null);
        this.notificationService.mostrarNotificacion('Departamento exportado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error exportando departamento:', error);
        this.loadingExportDep.set(null);
        this.notificationService.mostrarNotificacion('Error al exportar el departamento', 'error');
      }
    });
  }

  private buildFiltros(): RendicionFiltros {
    const formValue = this.filtrosForm.value;

    const filtros: RendicionFiltros = {
      idsPropietario: this.idPropietario() ? [this.idPropietario()!] : [],
      idsDepartamentos: formValue.departamentos,
      tipoPeriodo: formValue.tipoPeriodo
    };

    if (formValue.tipoPeriodo === 'diario') {
      filtros.fecha = formValue.fecha;
    } else {
      filtros.anio = formValue.anio;
      filtros.mes = formValue.mes;
    }

    return filtros;
  }

  private getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  }
}
