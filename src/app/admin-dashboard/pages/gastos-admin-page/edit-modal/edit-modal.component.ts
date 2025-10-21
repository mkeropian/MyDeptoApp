import { Component, computed, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import Swal from 'sweetalert2';
import { GastoGrid } from '../../../../gastos/interfaces/gasto.interface';

@Component({
  selector: 'app-edit-modal',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent
  ],
  templateUrl: './edit-modal.component.html',
})
export class EditModalComponent {

  @Output() gastoActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private gastosService = inject(GastosService);
  private departamentosService = inject(DepartamentosService);

  isOpen = signal(false);
  gastoActual = signal<GastoGrid | null>(null);

  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosActivos()
  });

  tipoGastoResource = rxResource({
    request: () => ({}),
    loader: () => this.gastosService.getTipoGasto()
  });

  tipoGastos = computed(() => this.tipoGastoResource.value() || []);
  departamentos = computed(() => this.departamentosResource.value() || []);

  editForm = this.fb.group({
    idTipoGasto: [0, Validators.required],
    idDep: [0, Validators.required],
    monto: [0, [Validators.required, Validators.min(0)]],
    fecha: ['', Validators.required],
    observaciones: [''],
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
      observaciones: gasto.observaciones || ''
    });

    this.isOpen.set(true);

    // Abrir modal usando DaisyUI
    const modal = document.getElementById('edit_gasto_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
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
      this.showErrorToast('Por favor complete todos los campos requeridos');
      return;
    }

    const gastoActual = this.gastoActual();
    if (!gastoActual) return;

    const formValue = this.editForm.value;

    // Obtener nombres para mostrar en el diálogo
    const tipoGasto = this.tipoGastos().find(t => t.id === formValue.idTipoGasto);
    const departamento = this.departamentos().find(d => d.id === formValue.idDep);

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
      observaciones: formValue.observaciones || ''
    };

    this.gastosService.updateGasto(gastoActual.id, gastoActualizado).subscribe({
      next: () => {
        this.showSuccessToast('Gasto actualizado exitosamente');
        this.gastoActualizado.emit();
        this.close();
      },
      error: (error) => {
        console.error('Error al actualizar gasto:', error);
        this.showErrorToast('Error al actualizar el gasto');
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

  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 9999; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-success shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">${message}</span>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 9999; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-error shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">${message}</span>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
}
