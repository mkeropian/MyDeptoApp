import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { MiniMapComponent } from "../../../shared/components/mini-map/mini-map.component";
import { Departamento, DepartamentoBackend } from '../../../departamentos/interfaces/departamento.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../gastos/services/gastos.service';
import { PagosService } from '../../../incomes/services/incomes.service';

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
  pagosService = inject(PagosService);
  gastosService = inject(GastosService);

  formBuilder = inject(FormBuilder);

  // Signals para el modal
  showModal = signal(false);
  selectedDepartamento = signal<Departamento | null>(null);
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
    // console.log(backendData);
    // Transformar los datos del backend a la interfaz Departamento
    const transformedData: Departamento[] = backendData.map(item => {
      try {
        // Parsear las coordenadas "lng,lat" a objeto
        const [lng, lat] = item.lngLat.split(',').map(coord => parseFloat(coord.trim()));

        // Validar que las coordenadas sean números válidos
        if (isNaN(lng) || isNaN(lat)) {
          throw new Error('Coordenadas inválidas');
        }

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
          activo: item.activo
        };
      } catch (error) {
        // console.error(`Error parseando coordenadas para ${item.nombre}:`, error);
        // console.error('Coordenadas recibidas:', item.lngLat);

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
          activo: item.activo
        };
      }
    });

    // console.log('Datos del backend:', backendData);
    // console.log('Departamentos transformados:', transformedData);
    return transformedData;
  });

  // Métodos para el modal
  openModal(departamento: Departamento): void {
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
    const tipoPagoData= this.tipoPagoResource.value();

    if (tipoPagoData && tipoPagoData.length > 0) {
      // Mapear los datos del backend al formato esperado
      return tipoPagoData.map(item => ({
        value: item.id.toString(), // o item.codigo, dependiendo de tu estructura
        label: item.descripcion,
      }));
    }

    // Si no hay datos, mostrar mensaje informativo
    return [
      { value: '', label: 'Sin categorías disponibles' }
    ];

  }

  getCategoriasGastos(): CategoriaOption[] {
    // Usar los datos del resource si están disponibles
    const tipoGastoData = this.tipoGastoResource.value();

    if (tipoGastoData && tipoGastoData.length > 0) {
      // Mapear los datos del backend al formato esperado
      return tipoGastoData.map(item => ({
        value: item.id.toString(), // o item.codigo, dependiendo de tu estructura
        label: item.descripcion,
      }));
    }

    // Si no hay datos, mostrar mensaje informativo
    return [
      { value: '', label: 'Sin categorías disponibles' }
    ];
  }

  // Método auxiliar para obtener la fecha actual en formato YYYY-MM-DD
  private getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.operacionForm.valid && this.selectedDepartamento()) {
      const operacion: Operacion = {
        tipoOperacion: this.tipoOperacion(),
        categoria: this.operacionForm.get('categoria')?.value,
        departamentoId: this.selectedDepartamento()!.id,
        departamentoNombre: this.selectedDepartamento()!.nombre,
        monto: this.operacionForm.get('monto')?.value,
        fecha: this.operacionForm.get('fecha')?.value,
        observaciones: this.operacionForm.get('observaciones')?.value || undefined
      };

      console.log('Operación a guardar:', operacion);

      // Aquí puedes llamar a tu servicio para guardar la operación
      // this.operacionesService.crearOperacion(operacion).subscribe(...)

      // Mostrar mensaje de éxito (puedes usar un servicio de notificaciones)
      alert('Operación guardada exitosamente');

      // Cerrar el modal
      this.closeModal();
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.operacionForm.controls).forEach(key => {
        this.operacionForm.get(key)?.markAsTouched();
      });
    }
  }

}
