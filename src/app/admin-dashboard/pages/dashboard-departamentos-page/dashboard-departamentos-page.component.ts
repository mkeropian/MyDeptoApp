// dashboard-departamentos-page.component.ts

import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { MiniMapComponent } from "../../../shared/components/mini-map/mini-map.component";
import { Departamento, DepartamentoBackend } from '../../../departamentos/interfaces/departamento.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../gastos/services/gastos.service';
import { PagosService } from '../../../incomes/services/incomes.service';
import { Pago } from '../../../incomes/interfaces/incomes.interface';
import { Gasto } from '../../../gastos/interfaces/gasto.interface';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { DashboardDataService } from '../../../shared/services/dashboard-data.service';

// Interface para la operación extendida con datos del propietario
interface DepartamentoConPropietario extends Departamento {
  propietario?: Propietario;
}

// Interface para la operación
interface Operacion {
  tipoOperacion: 'ingresos' | 'gastos';
  categoria: string;
  departamentoId: number;
  departamentoNombre: string;
  monto: number;
  fecha: string;
  observaciones?: string;
}

interface CategoriaOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dashboard-departamentos-page',
  imports: [MiniMapComponent, ReactiveFormsModule],
  templateUrl: './dashboard-departamentos-page.component.html'
})
export class DashboardDepartamentosPageComponent {
  departamentosService = inject(DepartamentosService);
  propietariosService = inject(PropietariosService);

  pagosService = inject(PagosService);
  gastosService = inject(GastosService);
  notificationService = inject(NotificationService);
  dashboardDataService = inject(DashboardDataService);

  formBuilder = inject(FormBuilder);

  // Signals para el modal
  showModal = signal(false);
  selectedDepartamento = signal<DepartamentoConPropietario | null>(null);
  tipoOperacion = signal<'ingresos' | 'gastos'>('ingresos');

  // Formulario reactivo
  operacionForm: FormGroup;

  // Categorías disponibles basadas en el tipo de operación
  categoriasDisponibles = computed(() => {
    if (this.tipoOperacion() === 'ingresos') {
      return this.getCategoriasIngresos();
    } else {
      return this.getCategoriasGastos();
    }
  });

  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosRawActivos()
  });

  propietariosResource = rxResource<Propietario[], {}>({
    request: () => ({}),
    loader: () => this.propietariosService.getPropietariosActivos()
  });

  tipoPagoResource = rxResource({
    request: () => ({}),
    loader: () => this.pagosService.getTipoPago()
  });

  tipoGastoResource = rxResource({
    request: () => ({}),
    loader: () => this.gastosService.getTipoGasto()
  });

  constructor() {
    // Inicializar el formulario
    this.operacionForm = this.formBuilder.group({
      categoria: ['', [Validators.required]],
      monto: [0, [Validators.required, Validators.min(0.01)]],
      fecha: [this.getCurrentDate(), [Validators.required]],
      observaciones: [''] // Campo opcional
    });
  }

  departamentos = computed(() => {
    const backendData: DepartamentoBackend[] = this.departamentosResource.value() || [];
    const propietariosData: Propietario[] = this.propietariosResource.value() || [];

    // Crear un mapa de propietarios para búsqueda rápida
    const propietariosMap = new Map<number, Propietario>();
    propietariosData.forEach(prop => {
      propietariosMap.set(prop.id, prop);
    });

    // Transformar los datos del backend a la interfaz Departamento
    const transformedData: DepartamentoConPropietario[] = backendData.map(item => {
      try {
        // Parsear las coordenadas "lng,lat" a objeto
        const [lng, lat] = item.lngLat.split(',').map(coord => parseFloat(coord.trim()));

        // Validar que las coordenadas sean números válidos
        if (isNaN(lng) || isNaN(lat)) {
          throw new Error('Coordenadas inválidas');
        }

        // Buscar el propietario correspondiente y transformar su avatarUrl
        const propietario = propietariosMap.get(item.idProp);
        const propietarioConAvatar = propietario ? {
          ...propietario,
          avatarUrl: this.propietariosService.getAvatarUrl(propietario.avatarUrl)
        } : undefined;

        return {
          id: item.id,
          idProp: item.idProp,
          nombre: item.nombre,
          descripcion: item.descripcion,
          calle: item.calle,
          barrio: item.barrio,
          localidad: item.localidad,
          provincia: item.provincia,
          codigoPostal: item.codigoPostal,
          lngLat: { lng, lat }, // Crear el objeto esperado
          observaciones: item.observaciones,
          activo: item.activo,
          propietario: propietarioConAvatar
        };
      } catch (error) {
        // Buscar el propietario correspondiente incluso si hay error en coordenadas
        const propietario = propietariosMap.get(item.idProp);
        const propietarioConAvatar = propietario ? {
          ...propietario,
          avatarUrl: this.propietariosService.getAvatarUrl(propietario.avatarUrl)
        } : undefined;

        // Coordenadas por defecto (Buenos Aires) si hay error
        return {
          id: item.id,
          idProp: item.idProp,
          nombre: item.nombre,
          descripcion: item.descripcion,
          calle: item.calle,
          barrio: item.barrio,
          localidad: item.localidad,
          provincia: item.provincia,
          codigoPostal: item.codigoPostal,
          lngLat: { lng: -58.3816, lat: -34.6037 }, // Buenos Aires por defecto
          observaciones: item.observaciones,
          activo: item.activo,
          propietario: propietarioConAvatar
        };
      }
    });

    return transformedData;
  });

  // Métodos para el modal
  openModal(departamento: DepartamentoConPropietario): void {
    this.selectedDepartamento.set(departamento);
    this.showModal.set(true);
    this.tipoOperacion.set('ingresos'); // Default a ingresos
    // Reset del formulario cuando se abre el modal
    this.operacionForm.reset({
      categoria: '',
      monto: 0,
      fecha: this.getCurrentDate(),
      observaciones: ''
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedDepartamento.set(null);
    this.tipoOperacion.set('ingresos');
    this.operacionForm.reset();
  }

  // Toggle entre ingresos y gastos
  toggleTipoOperacion(): void {
    const nuevoTipo = this.tipoOperacion() === 'ingresos' ? 'gastos' : 'ingresos';
    this.tipoOperacion.set(nuevoTipo);
    // Reset del campo categoría cuando cambia el tipo
    this.operacionForm.patchValue({ categoria: '' });
  }

  // Método para establecer el tipo de operación
  setTipoOperacion(tipo: 'ingresos' | 'gastos'): void {
    this.tipoOperacion.set(tipo);
    // Reset del campo categoría cuando cambia el tipo
    this.operacionForm.patchValue({ categoria: '' });
  }

  // Métodos para obtener categorías
  getCategoriasIngresos(): CategoriaOption[] {
    const tipoPagoData = this.tipoPagoResource.value();

    if (tipoPagoData && tipoPagoData.length > 0) {
      return tipoPagoData.map(item => ({
        value: item.id.toString(),
        label: item.descripcion,
      }));
    }

    return [
      { value: '', label: 'Sin categorías disponibles' }
    ];
  }

  getCategoriasGastos(): CategoriaOption[] {
    const tipoGastoData = this.tipoGastoResource.value();

    if (tipoGastoData && tipoGastoData.length > 0) {
      return tipoGastoData.map(item => ({
        value: item.id.toString(),
        label: item.descripcion,
      }));
    }

    return [
      { value: '', label: 'Sin categorías disponibles' }
    ];
  }

  // Método auxiliar para obtener la fecha actual en formato YYYY-MM-DD
  private getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // NUEVO: Método para manejar errores de carga de avatar
  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.propietariosService.getDefaultAvatarUrl();
  }

  onSubmit(): void {
    if (this.operacionForm.valid && this.selectedDepartamento()) {

      if (this.tipoOperacion() === 'ingresos') {

        const formValue: Pago = {
          id: 0,
          idTipoPago: this.operacionForm.get('categoria')?.value,
          idDep: this.selectedDepartamento()!.id,
          monto: this.operacionForm.get('monto')?.value,
          fecha: this.operacionForm.get('fecha')?.value,
          observaciones: this.operacionForm.get('observaciones')?.value || undefined
        }

        this.pagosService.createPago(formValue as Pago).subscribe({
          next: (pago) => {
            console.log('Pago creado:', pago);
            this.notificationService.mostrarNotificacion('Ingreso registrado exitosamente', 'success');

            // NUEVO: Disparar actualización del dashboard
            this.dashboardDataService.triggerRefresh();

            this.closeModal();
          },
          error: (error) => {
            console.error('Error al crear pago:', error);
            this.notificationService.mostrarNotificacion('Error al registrar el ingreso', 'error');
          }
        });
      } else if (this.tipoOperacion() === 'gastos') {

        const formValue: Gasto = {
          id: 0,
          idTipoGasto: this.operacionForm.get('categoria')?.value,
          idDep: this.selectedDepartamento()!.id,
          monto: this.operacionForm.get('monto')?.value,
          fecha: this.operacionForm.get('fecha')?.value,
          observaciones: this.operacionForm.get('observaciones')?.value || undefined
        }

        this.gastosService.createGasto(formValue as Gasto).subscribe({
          next: (gasto) => {
            console.log('Gasto creado:', gasto);
            this.notificationService.mostrarNotificacion('Gasto registrado exitosamente', 'success');

            // NUEVO: Disparar actualización del dashboard
            this.dashboardDataService.triggerRefresh();

            this.closeModal();
          },
          error: (error) => {
            console.error('Error al crear gasto:', error);
            this.notificationService.mostrarNotificacion('Error al registrar el gasto', 'error');
          }
        });
      }
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.operacionForm.controls).forEach(key => {
        this.operacionForm.get(key)?.markAsTouched();
      });
      this.notificationService.mostrarNotificacion('Complete todos los campos requeridos', 'warning');
    }
  }
}
