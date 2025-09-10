import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { Pago } from '../../../../incomes/interfaces/incomes.interface';
import { Router } from '@angular/router';
import { PagosService } from '../../../../incomes/services/incomes.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-form',
  imports: [ ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './form.component.html',
})
export class FormComponent {

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

  tipoPagos = computed (() => this.tipoPagoResource.value() || []);
  departamentos = computed(() => this.departamentosResource.value() || []);

  pagosForm = this.fb.group({
    idDep:        [0, Validators.required],
    idTipoPago:  [1, Validators.required],
    monto:        [0, Validators.required],
    fecha:        [''],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.setFormValue(this.pago);
  }

  setFormValue( formLike: Partial<Pago>) {
    this.pagosForm.patchValue(formLike);
  }

  limpiarForm(){
    this.pagosForm.reset();
    this.pagosForm.markAsUntouched();
    this.pagosForm.markAsPristine();

    console.log('Formulario limpiado');
  }

  onSubmit(){
    const isValid = this.pagosForm.valid;
    this.pagosForm.markAllAsTouched();

    console.log(isValid);
    console.log(this.pagosForm.value);

    if (!isValid) return ;

    const formValue = this.pagosForm.value;
    console.log('Datos del formulario:', formValue);

    this.pagosService.createPago(formValue as Pago).subscribe(
      pago => {
        console.log('Pago creado:', pago);
        this.pagosForm.reset();
        this.pagosForm.markAsUntouched();
        this.pagosForm.markAsPristine();
        this.router.navigate(['/admin/admin-ingresos']);
      });
  }


}
