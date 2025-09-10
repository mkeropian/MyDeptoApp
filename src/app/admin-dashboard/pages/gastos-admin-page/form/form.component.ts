import { Component, computed, inject, OnInit } from '@angular/core';
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

  tipoGastos = computed (() => this.tipoGastoResource.value() || []);
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

  setFormValue( formLike: Partial<Gasto>) {
    this.gastosForm.patchValue(formLike);
  }

  limpiarForm(){
    this.gastosForm.reset();
    this.gastosForm.markAsUntouched();
    this.gastosForm.markAsPristine();

    console.log('Formulario limpiado');
  }

  onSubmit(){
    const isValid = this.gastosForm.valid;
    this.gastosForm.markAllAsTouched();

    console.log(isValid);
    console.log(this.gastosForm.value);

    if (!isValid) return ;

    const formValue = this.gastosForm.value;
    console.log('Datos del formulario:', formValue);

    this.gastosService.createGasto(formValue as Gasto).subscribe(
      gasto => {
        console.log('Gasto creado:', gasto);
        this.gastosForm.reset();
        this.gastosForm.markAsUntouched();
        this.gastosForm.markAsPristine();
        this.router.navigate(['/admin/admin-gastos']);
      });
  }


}
