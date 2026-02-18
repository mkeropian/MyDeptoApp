import { Component, computed, EventEmitter, inject, Output, signal, effect, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { UsuariosService } from '../../../../auth/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DashboardDataService } from '../../../../shared/services/dashboard-data.service';
import Swal from 'sweetalert2';
import { GastoGrid, Empleado } from '../../../../gastos/interfaces/gasto.interface';

@Component({
  selector: 'app-edit-modal',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent
  ],
  templateUrl: './edit-modal.component.html',
})
export class EditModalComponent implements OnInit {

  @Output() gastoActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private gastosService = inject(GastosService);
  private departamentosService = inject(DepartamentosService);
  private usuariosService = inject(UsuariosService);
  private notificationService = inject(NotificationService);
  private dashboardDataService = inject(DashboardDataService);

  ngOnInit(): void {
    // Escuchar cambios en idTipoGasto
    this.editForm.get('idTipoGasto')?.valueChanges.subscribe(idTipoGasto => {
      this.actualizarRequiereEmpleado(idTipoGasto);
    });
  }

  private actualizarRequiereEmpleado(idTipoGasto: number | null) {
    const tipos = this.tipoGastos();

    if (idTipoGasto && tipos.length > 0) {
      // CORRECCIÓN: Convertir ambos a número para comparar
      const tipoSeleccionado = tipos.find(t => Number(t.id) === Number(idTipoGasto));
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

  isOpen = signal(false);
  gastoActual = signal<GastoGrid | null>(null);

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

  empleados = computed(() => {
    const value = this.empleadosResource.value();
    return (Array.isArray(value) ? value : []) as Empleado[];
  });

  editForm = this.fb.group({
    idTipoGasto: [0, Validators.required],
    idDep: [0, Validators.required],
    monto: [0, [Validators.required, Validators.min(0)]],
    fecha: ['', Validators.required],
    observaciones: [''],
    idEmpleado: [0] // NUEVO: Campo de empleado
  });

  open(gasto: GastoGrid) {
    this.gastoActual.set(gasto);

    // Convertir fecha de formato dd/mm/yyyy a yyyy-mm-dd para el input
    let fechaFormateada = '';
    if (gasto.fecha) {
      const fecha = new Date(gasto.fecha);
      fechaFormateada = fecha.toISOString().split('T')[0];
    }

    this.editForm.patchValue({
      idTipoGasto: gasto.idTipoGasto,
      idDep: gasto.idDep,
      monto: gasto.monto,
      fecha: fechaFormateada,
      observaciones: gasto.observaciones || '',
      idEmpleado: gasto.idEmpleado || 0 // NUEVO: Cargar empleado actual
    });

    this.isOpen.set(true);

    // Abrir modal usando DaisyUI
    const modal = document.getElementById('edit_gasto_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }

    this.actualizarRequiereEmpleado(gasto.idTipoGasto);
  }

  close() {
    this.isOpen.set(false);
    this.gastoActual.set(null);
    this.editForm.reset();

    const modal = document.getElementById('edit_gasto_modal') as HTMLDialogElement;
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

    const gastoActual = this.gastoActual();
    if (!gastoActual) return;

    const formValue = this.editForm.value;

    // Obtener nombres para mostrar en el diálogo
    const tipoGasto = this.tipoGastos().find(t => Number(t.id) === Number(formValue.idTipoGasto));
    const departamento = this.departamentos().find(d => Number(d.id) === Number(formValue.idDep));
    const empleado = this.empleados().find(e => Number(e.id) === Number(formValue.idEmpleado));

    // Obtener info del empleado si aplica
    let empleadoInfo = '';
    if (this.requiereEmpleado() && formValue.idEmpleado) {
      empleadoInfo = `<p><strong>Empleado:</strong> ${empleado?.nombreCompleto || 'N/A'}</p>`;
    }

    // IMPORTANTE: Cerrar temporalmente el modal de DaisyUI antes de mostrar SweetAlert
    const modal = document.getElementById('edit_gasto_modal') as HTMLDialogElement;
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
      title: '¿Confirmar actualización del gasto?',
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>Tipo:</strong> ${tipoGasto?.descripcion || 'N/A'}</p>
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

    // Actualizar el gasto
    const gastoActualizado = {
      idTipoGasto: formValue.idTipoGasto!,
      idDep: formValue.idDep!,
      monto: formValue.monto!,
      fecha: formValue.fecha!,
      observaciones: formValue.observaciones || '',
      idEmpleado: this.requiereEmpleado() && formValue.idEmpleado ? formValue.idEmpleado : undefined
    };

    this.gastosService.updateGasto(gastoActual.id, gastoActualizado).subscribe({
      next: () => {
        this.notificationService.mostrarNotificacion('Gasto actualizado exitosamente', 'success');
        this.gastoActualizado.emit();

        // Disparar actualización del dashboard
        this.dashboardDataService.triggerRefresh();

        this.close();
      },
      error: (error) => {
        console.error('Error al actualizar gasto:', error);
        this.notificationService.mostrarNotificacion(
          'Error al actualizar el gasto',
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
    const date = new Date(fecha + 'T00:00:00'); // Agregar hora para evitar problemas de zona horaria
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-AR', options);
  }
}
