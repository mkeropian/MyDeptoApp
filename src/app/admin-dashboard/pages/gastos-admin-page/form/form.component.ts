import { Component, computed, inject, OnInit, Output, EventEmitter, signal, effect } from '@angular/core';
import { Gasto, Empleado } from '../../../../gastos/interfaces/gasto.interface';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DashboardDataService } from '../../../../shared/services/dashboard-data.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-form',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent
  ],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {

  @Output() gastoCreado = new EventEmitter<void>();

  gasto: Gasto = {
    id: 0,
    idDep: 0,
    idTipoGasto: 0,
    monto: 0,
    fecha: '01/01/2025',
    observaciones:''
  };

  router = inject(Router);
  fb = inject(FormBuilder);
  gastosService = inject(GastosService);
  departamentosService = inject(DepartamentosService);
  usuariosService = inject(UsuariosService);
  notificationService = inject(NotificationService);
  dashboardDataService = inject(DashboardDataService);

  // Signal para controlar si se requiere empleado
  requiereEmpleado = signal(false);

  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosActivos()
  });

  tipoGastoResource = rxResource({
    request: () => ({}),
    loader: () => this.gastosService.getTipoGastoActivos()
  });

  // NUEVO: Resource para cargar empleados
  empleadosResource = rxResource({
    request: () => ({}),
    loader: () => this.usuariosService.getEmpleados()
  });

  tipoGastos = computed(() => this.tipoGastoResource.value() || []);
  departamentos = computed(() => this.departamentosResource.value() || []);
  empleados = computed(() => this.empleadosResource.value() || []);

  gastosForm = this.fb.group({
    idsDep: [[] as number[], Validators.required],
    idTipoGasto: [0, Validators.required],
    monto: [0, Validators.required],
    fecha: [''],
    observaciones: [''],
    idEmpleado: [0]
  });

  constructor() {
    // Effect para actualizar validación de empleado cuando cambia el tipo de gasto
    effect(() => {
      const idTipoGasto = this.gastosForm.get('idTipoGasto')?.value;
      const tipos = this.tipoGastos();

      if (idTipoGasto && tipos.length > 0) {
        const tipoSeleccionado = tipos.find(t => t.id === idTipoGasto);
        const requiere = tipoSeleccionado?.requiere_empleado === 1;

        this.requiereEmpleado.set(requiere);

        // Actualizar validación del campo idEmpleado
        const empleadoControl = this.gastosForm.get('idEmpleado');
        if (requiere) {
          empleadoControl?.setValidators([Validators.required, Validators.min(1)]);
        } else {
          empleadoControl?.clearValidators();
          empleadoControl?.setValue(0);
        }
        empleadoControl?.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    this.setFormValue(this.gasto);

    // Escuchar cambios en idTipoGasto
    this.gastosForm.get('idTipoGasto')?.valueChanges.subscribe(idTipoGasto => {
      this.actualizarRequiereEmpleado(idTipoGasto);
    });

    // Inicializar validación del tipo seleccionado por defecto
    const idTipoGastoInicial = this.gastosForm.get('idTipoGasto')?.value;
    if (idTipoGastoInicial) {
      this.actualizarRequiereEmpleado(idTipoGastoInicial);
    }
  }

  private actualizarRequiereEmpleado(idTipoGasto: number | null) {
    console.log('🔍 actualizarRequiereEmpleado llamado con:', idTipoGasto);

    const tipos = this.tipoGastos();
    console.log('🔍 Tipos disponibles:', tipos);

    if (idTipoGasto && tipos.length > 0) {
      // CORRECCIÓN: Convertir ambos a número para comparar
      const tipoSeleccionado = tipos.find(t => Number(t.id) === Number(idTipoGasto));
      console.log('🔍 Tipo seleccionado:', tipoSeleccionado);

      const requiere = tipoSeleccionado?.requiere_empleado === 1;
      console.log('🔍 Requiere empleado?', requiere);
      console.log('🔍 requiere_empleado raw:', tipoSeleccionado?.requiere_empleado);

      this.requiereEmpleado.set(requiere);
      console.log('🔍 Signal actualizado a:', this.requiereEmpleado());

      // Actualizar validación del campo idEmpleado
      const empleadoControl = this.gastosForm.get('idEmpleado');
      if (requiere) {
        empleadoControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        empleadoControl?.clearValidators();
        empleadoControl?.setValue(0);
      }
      empleadoControl?.updateValueAndValidity();
    } else {
      console.log('❌ No se cumplió la condición - idTipoGasto:', idTipoGasto, 'tipos.length:', tipos.length);
    }
  }

  setFormValue(formLike: Partial<Gasto>) {
    this.gastosForm.patchValue(formLike as any);
  }

  limpiarForm() {
    this.gastosForm.reset({
      idsDep: [],
      idTipoGasto: 0,
      monto: 0,
      fecha: '',
      observaciones: '',
      idEmpleado: 0
    });
    this.gastosForm.markAsUntouched();
    this.gastosForm.markAsPristine();

    // Resetear el signal
    this.requiereEmpleado.set(false);
  }

  async onSubmit() {
    const isValid = this.gastosForm.valid;
    this.gastosForm.markAllAsTouched();

    if (!isValid) {
      this.notificationService.mostrarNotificacion('Complete todos los campos requeridos', 'error');
      return;
    }

    const formValue = this.gastosForm.value;
    const selectedDepartments = formValue.idsDep || [];
    const totalMonto = formValue.monto || 0;

    // Validar que haya al menos 1 departamento seleccionado
    if (selectedDepartments.length === 0) {
      this.notificationService.mostrarNotificacion('Debe seleccionar al menos un departamento', 'error');
      return;
    }

    // Calcular monto por departamento
    const montoPorDepartamento = totalMonto / selectedDepartments.length;

    // Obtener nombres de departamentos seleccionados
    const nombresDeptos = selectedDepartments
      .map(id => {
        const depto = this.departamentos().find(d => d.id === id);
        return depto ? depto.nombre : `Depto ${id}`;
      })
      .join(', ');

    // Obtener nombre del empleado si aplica
    let empleadoInfo = '';
    if (this.requiereEmpleado() && formValue.idEmpleado) {
      const empleado = this.empleados().find(e => Number(e.id) === Number(formValue.idEmpleado));
      empleadoInfo = `<p class="mb-2"><strong>Empleado:</strong> ${empleado?.nombreCompleto || 'N/A'}</p>`;
    }

    // Mostrar confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Confirmar distribución de gasto?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Monto total:</strong> $${totalMonto.toLocaleString()}</p>
          <p class="mb-2"><strong>Departamentos seleccionados:</strong> ${selectedDepartments.length}</p>
          <p class="mb-2"><strong>Monto por departamento:</strong> $${montoPorDepartamento.toLocaleString()}</p>
          ${empleadoInfo}
          <p class="mb-2 text-sm text-gray-600"><strong>Departamentos:</strong> ${nombresDeptos}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    // Crear array de observables para ejecutar todos los POST
    const requests = selectedDepartments.map(idDep => {
      const gastoIndividual: Gasto = {
        id: 0,
        idTipoGasto: formValue.idTipoGasto!,
        idDep: idDep,
        monto: montoPorDepartamento,
        fecha: formValue.fecha || '',
        observaciones: formValue.observaciones || '',
        idEmpleado: this.requiereEmpleado() && formValue.idEmpleado ? formValue.idEmpleado : undefined
      };
      return this.gastosService.createGasto(gastoIndividual);
    });

    // Ejecutar todos los requests en paralelo
    forkJoin(requests).subscribe({
      next: (resultados) => {
        // Resetear el formulario
        this.gastosForm.reset({
          idsDep: [],
          idTipoGasto: 0,
          monto: 0,
          fecha: '',
          observaciones: '',
          idEmpleado: 0
        });

        this.gastosForm.markAsUntouched();
        this.gastosForm.markAsPristine();

        this.requiereEmpleado.set(false);

        // Emitir evento para refrescar la lista
        this.gastoCreado.emit();

        // Disparar actualización del dashboard
        this.dashboardDataService.triggerRefresh();

        // Mostrar mensaje de éxito
        this.notificationService.mostrarNotificacion(
          `${resultados.length} gasto(s) creado(s) exitosamente`,
          'success',
          `$${montoPorDepartamento.toLocaleString()} por departamento`
        );
      },
      error: (error) => {
        console.error('Error al crear gastos:', error);
        this.notificationService.mostrarNotificacion(
          'Error al crear los gastos',
          'error',
          error.error?.msg || 'Algunos registros pueden no haberse guardado'
        );
      }
    });
  }
}
