import { Component, computed, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { Gasto } from '../../../../gastos/interfaces/gasto.interface';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';

@Component({
  selector: 'app-form',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent
  ],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {

  // NUEVO: Output para notificar cuando se crea un gasto
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
    idDep:        [0, Validators.required],
    idTipoGasto:  [1, Validators.required],
    monto:        [0, Validators.required],
    fecha:        [''],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.setFormValue(this.gasto);
  }

  setFormValue(formLike: Partial<Gasto>) {
    this.gastosForm.patchValue(formLike);
  }

  limpiarForm() {
    this.gastosForm.reset({
      idDep: 0,
      idTipoGasto: 1,
      monto: 0
    });
    this.gastosForm.markAsUntouched();
    this.gastosForm.markAsPristine();

    // console.log('Formulario limpiado');
  }

  onSubmit() {
    const isValid = this.gastosForm.valid;
    this.gastosForm.markAllAsTouched();

    // console.log('Formulario válido:', isValid);
    // console.log('Valores del formulario:', this.gastosForm.value);

    if (!isValid) return;

    const formValue = this.gastosForm.value;

    this.gastosService.createGasto(formValue as Gasto).subscribe({
      next: (gasto) => {
        // console.log('Gasto creado:', gasto);

        // Resetear el formulario
        this.gastosForm.reset({
          idDep: 0,
          idTipoGasto: 1,
          monto: 0
        });
        this.gastosForm.markAsUntouched();
        this.gastosForm.markAsPristine();

        // NUEVO: Emitir evento para refrescar la lista
        this.gastoCreado.emit();

        // Mostrar mensaje de éxito
        this.showSuccessToast('Gasto creado exitosamente');
      },
      error: (error) => {
        // console.error('Error al crear gasto:', error);
        this.showErrorToast('Error al crear el gasto');
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
