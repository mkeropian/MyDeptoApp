
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Propietario } from '../../../../propietarios/interfaces/propietario.interface';
import { Router } from '@angular/router';
import { PropietariosService } from '../../../../propietarios/services/propietarios.service';
import { FormErrorLabelComponent } from "../../../../shared/components/form-error-label/form-error-label.component";

@Component({
  selector: 'app-form',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent
],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit{
  propietario: Propietario = {
    id: 0,
    nombreApellido: '',
    direccion: '',
    telefono: '',
    email: '',
    activo: 0,
    dni: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    cuenta_nro: '',
    avatarUrl: ''
  };

  router = inject(Router);
  fb = inject(FormBuilder);
  propietariosService = inject(PropietariosService);

  propietarioForm = this.fb.group({
    nombreApellido: ['', [Validators.required, Validators.minLength(3)]],
    direccion: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    activo: [0, Validators.required],
    dni: ['', [Validators.required, Validators.minLength(8)]],
    ciudad: [''],
    provincia: [''],
    codigoPostal: [''],
    cuenta_nro: [''],
    avatarUrl: [''],
  });

  ngOnInit(): void {
    this.setFormValue(this.propietario);
  }

  setFormValue( formLike: Partial<Propietario>) {
    this.propietarioForm.patchValue(formLike);
  }

  limpiarForm(){
    this.propietarioForm.reset();
    this.propietarioForm.markAsUntouched();
    this.propietarioForm.markAsPristine();

    console.log('Formulario limpiado');
  }

  onSubmit(){
    const isValid = this.propietarioForm.valid;
    this.propietarioForm.markAllAsTouched();

    // console.log(isValid);
    // console.log(this.propietarioForm.value);

    if (!isValid) return ;

    const formValue = this.propietarioForm.value;
    // console.log('Datos del formulario:', formValue);

      this.propietariosService.createPropietario(formValue as Propietario).subscribe(
        propietario => {
          console.log('Propietario creado:', propietario);
          this.propietarioForm.reset();
          this.propietarioForm.markAsUntouched();
          this.propietarioForm.markAsPristine();
          this.router.navigate(['/admin/admin-propietarios']);
        });
  }

}
