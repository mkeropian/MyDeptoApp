import { Component, computed, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { Pago } from '../../../../incomes/interfaces/incomes.interface';
import { Router } from '@angular/router';
import { PagosService } from '../../../../incomes/services/incomes.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {

  // NUEVO: Output para notificar cuando se crea un pago
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

  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosActivos()
  });

  tipoPagoResource = rxResource({
    request: () => ({}),
    loader: () => this.pagosService.getTipoPago()
  });

  tipoPagos = computed(() => this.tipoPagoResource.value() || []);
  departamentos = computed(() => this.departamentosResource.value() || []);

  pagosForm = this.fb.group({
    idDep:        [0, Validators.required],
    idTipoPago:   [1, Validators.required],
    monto:        [0, Validators.required],
    fecha:        [''],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.setFormValue(this.pago);
  }

  setFormValue(formLike: Partial<Pago>) {
    this.pagosForm.patchValue(formLike);
  }

  limpiarForm() {
    this.pagosForm.reset({
      idDep: 0,
      idTipoPago: 1,
      monto: 0
    });
    this.pagosForm.markAsUntouched();
    this.pagosForm.markAsPristine();

    // console.log('Formulario limpiado');
  }

  onSubmit() {
    const isValid = this.pagosForm.valid;
    this.pagosForm.markAllAsTouched();

    // console.log('Formulario válido:', isValid);
    // console.log('Valores del formulario:', this.pagosForm.value);

    if (!isValid) return;

    const formValue = this.pagosForm.value;

    this.pagosService.createPago(formValue as Pago).subscribe({
      next: (pago) => {
        // console.log('Pago creado:', pago);

        // Resetear el formulario
        this.pagosForm.reset({
          idDep: 0,
          idTipoPago: 1,
          monto: 0
        });
        this.pagosForm.markAsUntouched();
        this.pagosForm.markAsPristine();

        // NUEVO: Emitir evento para refrescar la lista
        this.pagoCreado.emit();

        // Mostrar mensaje de éxito
        this.showSuccessToast('Pago/Ingreso creado exitosamente');
      },
      error: (error) => {
        // console.error('Error al crear pago:', error);
        this.showErrorToast('Error al crear el pago/ingreso');
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
