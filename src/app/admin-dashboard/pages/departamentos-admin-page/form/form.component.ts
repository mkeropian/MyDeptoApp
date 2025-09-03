import { Component, inject, OnInit } from '@angular/core';
import { FormErrorLabelComponent } from "../../../../shared/components/form-error-label/form-error-label.component";
import { Departamento, DepartamentoBackend } from '../../../../departamentos/interfaces/departamento.interface';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {
  departamento: DepartamentoBackend = {
    id: 0,
    idProp: 0,
    nombre: '',
    descripcion: '',
    calle: '',
    barrio: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    lngLat: '',
    observaciones: '',
    activo: 0
  };

  router = inject(Router);
  fb = inject(FormBuilder);
  departamentosService = inject(DepartamentosService);

  departamentoForm = this.fb.group({
    idProp: [ 0, [Validators.required, Validators.min(1)]],  // Especificar el tipo explícitamente
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(3)]],
    calle: [''],
    barrio: [''],
    localidad: [''],
    provincia: [''],
    codigoPostal: [''],
    lngLat: [''],
    observaciones: [''],
    activo: [0, Validators.required],
  });

  ngOnInit(): void {
    this.setFormValue(this.departamento);
  }

  // Cambiar el tipo para que coincida con el formulario
  setFormValue(formLike: any) {
    this.departamentoForm.patchValue(formLike);
  }

  onSubmit() {
    const isValid = this.departamentoForm.valid;
    this.departamentoForm.markAllAsTouched();

    console.log(isValid);
    console.log(this.departamentoForm.value);

    if (!isValid) return;

    const formValue = this.departamentoForm.value;

    const departamentoData: DepartamentoBackend = {
      id: 0,
      idProp: formValue.idProp || 0,
      nombre: formValue.nombre || '',
      descripcion: formValue.descripcion || '',
      calle: formValue.calle || '',
      barrio: formValue.barrio || '',
      localidad: formValue.localidad || '',
      provincia: formValue.provincia || '',
      codigoPostal: formValue.codigoPostal || '',
      lngLat: formValue.lngLat || '',
      observaciones: formValue.observaciones || '',
      activo: formValue.activo || 0
    };

    this.departamentosService.createDepartamento(departamentoData).subscribe(
      departamento => {
        console.log('Departamento creado:', departamento);
        this.departamentoForm.reset();
        this.departamentoForm.markAsUntouched();
        this.departamentoForm.markAsPristine();
        this.router.navigate(['/admin/admin-departamentos']);
      }
    );
  }
}
