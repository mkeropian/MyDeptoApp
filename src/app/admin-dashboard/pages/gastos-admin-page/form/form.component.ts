import { Component, computed, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { Gasto } from '../../../../gastos/interfaces/gasto.interface';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
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

  gastosForm = this.fb.group({
    idsDep: [[] as number[], Validators.required], // Cambiado a array
    idTipoGasto: [1, Validators.required],
    monto: [0, Validators.required],
    fecha: [''],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.setFormValue(this.gasto);
  }

  setFormValue(formLike: Partial<Gasto>) {
    this.gastosForm.patchValue(formLike as any);
  }

  limpiarForm() {
    this.gastosForm.reset({
      idsDep: [],
      idTipoGasto: 1,
      monto: 0
    });
    this.gastosForm.markAsUntouched();
    this.gastosForm.markAsPristine();
  }

  async onSubmit() {
    const isValid = this.gastosForm.valid;
    this.gastosForm.markAllAsTouched();

    if (!isValid) return;

    const formValue = this.gastosForm.value;
    const selectedDepartments = formValue.idsDep || [];
    const totalMonto = formValue.monto || 0;

    // Validar que haya al menos 1 departamento seleccionado
    if (selectedDepartments.length === 0) {
      this.showErrorToast('Debe seleccionar al menos un departamento');
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

    // Mostrar confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Confirmar distribución de gasto?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Monto total:</strong> $${totalMonto.toLocaleString()}</p>
          <p class="mb-2"><strong>Departamentos seleccionados:</strong> ${selectedDepartments.length}</p>
          <p class="mb-2"><strong>Monto por departamento:</strong> $${montoPorDepartamento.toLocaleString()}</p>
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
        observaciones: formValue.observaciones || ''
      };
      return this.gastosService.createGasto(gastoIndividual);
    });

    // Ejecutar todos los requests en paralelo
    forkJoin(requests).subscribe({
      next: (resultados) => {
        // Resetear el formulario
        this.gastosForm.reset({
          idsDep: [],
          idTipoGasto: 1,
          monto: 0
        });
        this.gastosForm.markAsUntouched();
        this.gastosForm.markAsPristine();

        // Emitir evento para refrescar la lista
        this.gastoCreado.emit();

        // Mostrar mensaje de éxito
        this.showSuccessToast(
          `${resultados.length} gasto(s) creado(s) exitosamente ($${montoPorDepartamento.toLocaleString()} c/u)`
        );
      },
      error: (error) => {
        console.error('Error al crear gastos:', error);
        this.showErrorToast(
          `Error al crear los gastos. Algunos registros pueden no haberse guardado.`
        );
      }
    });
  }

  /**
   * Muestra un toast de éxito
   */
  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 70; max-width: 24rem;';
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

  /**
   * Muestra un toast de error
   */
  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 70; max-width: 24rem;';
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
