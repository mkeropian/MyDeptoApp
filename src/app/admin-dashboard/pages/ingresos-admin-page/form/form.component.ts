import { Component, computed, inject, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DashboardDataService } from '../../../../shared/services/dashboard-data.service';
import { Pago, Empleado } from '../../../../incomes/interfaces/incomes.interface';
import { Router } from '@angular/router';
import { PagosService } from '../../../../incomes/services/incomes.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {

  @Output() pagoCreado = new EventEmitter<void>();

  pago: Pago = {
    id: 0,
    idDep: 0,
    idTipoPago: 0,
    monto: 0,
    fecha: '01/01/2025',
    observaciones:''
  };

  router = inject(Router);
  fb = inject(FormBuilder);
  pagosService = inject(PagosService);
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

  tipoPagoResource = rxResource({
    request: () => ({}),
    loader: () => this.pagosService.getTipoPagoActivos()
  });

  // NUEVO: Resource para cargar empleados
  empleadosResource = rxResource({
    request: () => ({}),
    loader: () => this.usuariosService.getEmpleados()
  });

  tipoPagos = computed(() => this.tipoPagoResource.value() || []);
  departamentos = computed(() => this.departamentosResource.value() || []);
  empleados = computed(() => {
    const value = this.empleadosResource.value();
    return (Array.isArray(value) ? value : []) as Empleado[];
  });

  pagosForm = this.fb.group({
    idsDep: [[] as number[], Validators.required],
    idTipoPago: [0, Validators.required],
    monto: [0, Validators.required],
    fecha: [''],
    observaciones: [''],
    idEmpleado: [0] // NUEVO: Campo de empleado
  });

  ngOnInit(): void {
    this.setFormValue(this.pago);

    // Escuchar cambios en idTipoPago
    this.pagosForm.get('idTipoPago')?.valueChanges.subscribe(idTipoPago => {
      this.actualizarRequiereEmpleado(idTipoPago);
    });

    // Inicializar validación del tipo seleccionado por defecto
    const idTipoPagoInicial = this.pagosForm.get('idTipoPago')?.value;
    if (idTipoPagoInicial) {
      this.actualizarRequiereEmpleado(idTipoPagoInicial);
    }
  }

  private actualizarRequiereEmpleado(idTipoPago: number | null) {
    const tipos = this.tipoPagos();

    if (idTipoPago && tipos.length > 0) {
      const tipoSeleccionado = tipos.find(t => Number(t.id) === Number(idTipoPago));
      const requiere = tipoSeleccionado?.requiere_empleado === 1;

      this.requiereEmpleado.set(requiere);

      // Actualizar validación del campo idEmpleado
      const empleadoControl = this.pagosForm.get('idEmpleado');
      if (requiere) {
        empleadoControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        empleadoControl?.clearValidators();
        empleadoControl?.setValue(0);
      }
      empleadoControl?.updateValueAndValidity();
    }
  }

  setFormValue(formLike: Partial<Pago>) {
    this.pagosForm.patchValue(formLike as any);
  }

  limpiarForm() {
    this.pagosForm.reset({
      idsDep: [],
      idTipoPago: 0,
      monto: 0,
      fecha: '',
      observaciones: '',
      idEmpleado: 0
    });
    this.pagosForm.markAsUntouched();
    this.pagosForm.markAsPristine();

    // Resetear el signal
    this.requiereEmpleado.set(false);
  }

  async onSubmit() {
    const isValid = this.pagosForm.valid;
    this.pagosForm.markAllAsTouched();

    if (!isValid) {
      this.notificationService.mostrarNotificacion('Complete todos los campos requeridos', 'error');
      return;
    }

    const formValue = this.pagosForm.value;
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
      title: '¿Confirmar distribución de pago?',
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
      const pagoIndividual: Pago = {
        id: 0,
        idTipoPago: formValue.idTipoPago!,
        idDep: idDep,
        monto: montoPorDepartamento,
        fecha: formValue.fecha || '',
        observaciones: formValue.observaciones || '',
        idEmpleado: this.requiereEmpleado() && formValue.idEmpleado ? formValue.idEmpleado : undefined
      };
      return this.pagosService.createPago(pagoIndividual);
    });

    // Ejecutar todos los requests en paralelo
    forkJoin(requests).subscribe({
      next: (resultados) => {
        // Resetear el formulario
        this.pagosForm.reset({
          idsDep: [],
          idTipoPago: 0,
          monto: 0,
          fecha: '',
          observaciones: '',
          idEmpleado: 0
        });

        // Resetear el signal
        this.requiereEmpleado.set(false);

        this.pagosForm.markAsUntouched();
        this.pagosForm.markAsPristine();

        // Emitir evento para refrescar la lista
        this.pagoCreado.emit();

        // Disparar actualización del dashboard
        this.dashboardDataService.triggerRefresh();

        // Mostrar mensaje de éxito
        this.notificationService.mostrarNotificacion(
          `${resultados.length} pago(s)/ingreso(s) creado(s) exitosamente`,
          'success',
          `$${montoPorDepartamento.toLocaleString()} por departamento`
        );
      },
      error: (error) => {
        console.error('Error al crear pagos:', error);
        this.notificationService.mostrarNotificacion(
          'Error al crear los pagos/ingresos',
          'error',
          error.error?.msg || 'Algunos registros pueden no haberse guardado'
        );
      }
    });
  }
}
