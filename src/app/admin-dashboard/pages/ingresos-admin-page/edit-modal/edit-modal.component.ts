import { Component, computed, EventEmitter, inject, Output, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PagosService } from '../../../../incomes/services/incomes.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DashboardDataService } from '../../../../shared/services/dashboard-data.service';
import Swal from 'sweetalert2';
import { PagoGrid, Empleado } from '../../../../incomes/interfaces/incomes.interface';

@Component({
  selector: 'app-edit-modal-pago',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent
  ],
  templateUrl: './edit-modal.component.html',
})
export class EditModalComponent implements OnInit {

  @Output() pagoActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private pagosService = inject(PagosService);
  private departamentosService = inject(DepartamentosService);
  private usuariosService = inject(UsuariosService);
  private notificationService = inject(NotificationService);
  private dashboardDataService = inject(DashboardDataService);

  isOpen = signal(false);
  pagoActual = signal<PagoGrid | null>(null);

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

  editForm = this.fb.group({
    idTipoPago: [0, Validators.required],
    idDep: [0, Validators.required],
    monto: [0, [Validators.required, Validators.min(0)]],
    fecha: ['', Validators.required],
    observaciones: [''],
    idEmpleado: [0] // NUEVO: Campo de empleado
  });

  ngOnInit(): void {
    // Escuchar cambios en idTipoPago
    this.editForm.get('idTipoPago')?.valueChanges.subscribe(idTipoPago => {
      this.actualizarRequiereEmpleado(idTipoPago);
    });
  }

  private actualizarRequiereEmpleado(idTipoPago: number | null) {
    const tipos = this.tipoPagos();

    if (idTipoPago && tipos.length > 0) {
      const tipoSeleccionado = tipos.find(t => Number(t.id) === Number(idTipoPago));
      const requiere = tipoSeleccionado?.requiere_empleado === 1;

      this.requiereEmpleado.set(requiere);

      // Actualizar validación del campo idEmpleado
      const empleadoControl = this.editForm.get('idEmpleado');
      if (requiere) {
        empleadoControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        empleadoControl?.clearValidators();
      }
      empleadoControl?.updateValueAndValidity();
    }
  }

  open(pago: PagoGrid) {
    this.pagoActual.set(pago);

    // Convertir fecha de formato dd/mm/yyyy a yyyy-mm-dd para el input
    let fechaFormateada = '';
    if (pago.fecha) {
      const fecha = new Date(pago.fecha);
      fechaFormateada = fecha.toISOString().split('T')[0];
    }

    this.editForm.patchValue({
      idTipoPago: pago.idTipoPago,
      idDep: pago.idDep,
      monto: pago.monto,
      fecha: fechaFormateada,
      observaciones: pago.observaciones || '',
      idEmpleado: pago.idEmpleado || 0 // NUEVO: Cargar empleado actual
    });

    this.isOpen.set(true);

    // Abrir modal usando DaisyUI
    const modal = document.getElementById('edit_pago_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }

    // Inicializar validación del tipo de pago cargado
    this.actualizarRequiereEmpleado(pago.idTipoPago);
  }

  close() {
    this.isOpen.set(false);
    this.pagoActual.set(null);
    this.editForm.reset();

    const modal = document.getElementById('edit_pago_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  async onSubmit() {
    const isValid = this.editForm.valid;
    this.editForm.markAllAsTouched();

    if (!isValid) {
      this.notificationService.mostrarNotificacion('Complete todos los campos requeridos', 'error');
      return;
    }

    const pagoActual = this.pagoActual();
    if (!pagoActual) return;

    const formValue = this.editForm.value;

    // Obtener nombres para mostrar en el diálogo
    const tipoPago = this.tipoPagos().find(t => Number(t.id) === Number(formValue.idTipoPago));
    const departamento = this.departamentos().find(d => Number(d.id) === Number(formValue.idDep));
    const empleado = this.empleados().find(e => Number(e.id) === Number(formValue.idEmpleado));

    // Obtener info del empleado si aplica
    let empleadoInfo = '';
    if (this.requiereEmpleado() && formValue.idEmpleado) {
      empleadoInfo = `<p><strong>Empleado:</strong> ${empleado?.nombreCompleto || 'N/A'}</p>`;
    }

    // IMPORTANTE: Cerrar temporalmente el modal de DaisyUI antes de mostrar SweetAlert
    const modal = document.getElementById('edit_pago_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }

    // Remover aria-hidden del app-root para evitar warning
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      appRoot.removeAttribute('aria-hidden');
    }

    // Esperar un pequeño delay para que el modal se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mostrar confirmación con SweetAlert2 - VERSIÓN COMPACTA
    const result = await Swal.fire({
      title: '¿Confirmar cambios?',
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>Tipo:</strong> ${tipoPago?.descripcion || 'N/A'}</p>
          <p><strong>Depto:</strong> ${departamento?.nombre || 'N/A'}</p>
          <p><strong>Monto:</strong> $${formValue.monto?.toLocaleString()}</p>
          <p><strong>Fecha:</strong> ${this.formatFecha(formValue.fecha!)}</p>
          ${empleadoInfo}
          ${formValue.observaciones ? `<p><strong>Obs:</strong> ${formValue.observaciones}</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      customClass: {
        popup: 'swal-compact'
      }
    });

    // Si el usuario canceló, reabrir el modal
    if (!result.isConfirmed) {
      if (modal) {
        modal.showModal();
      }
      return;
    }

    // Actualizar el pago
    const pagoActualizado = {
      idTipoPago: formValue.idTipoPago!,
      idDep: formValue.idDep!,
      monto: formValue.monto!,
      fecha: formValue.fecha!,
      observaciones: formValue.observaciones || '',
      idEmpleado: this.requiereEmpleado() && formValue.idEmpleado ? formValue.idEmpleado : undefined
    };

    this.pagosService.updatePago(pagoActual.id, pagoActualizado).subscribe({
      next: () => {
        this.notificationService.mostrarNotificacion('Pago/Ingreso actualizado exitosamente', 'success');
        this.pagoActualizado.emit();

        // Disparar actualización del dashboard
        this.dashboardDataService.triggerRefresh();

        this.close();
      },
      error: (error) => {
        console.error('Error al actualizar pago:', error);
        this.notificationService.mostrarNotificacion(
          'Error al actualizar el pago/ingreso',
          'error',
          error.error?.msg || 'Verifique los datos ingresados'
        );
        // Reabrir el modal en caso de error
        if (modal) {
          modal.showModal();
        }
      }
    });
  }

  // Helper para formatear fecha en formato legible
  private formatFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    const date = new Date(fecha + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-AR', options);
  }
}
