
import { Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Propietario } from '../../../../propietarios/interfaces/propietario.interface';
import { Router } from '@angular/router';
import { PropietariosService } from '../../../../propietarios/services/propietarios.service';

@Component({
  selector: 'app-form',
  imports: [],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit{
  // propietario = input.required<Propietario>();
  propietario = new Propietario();

  router = inject(Router);
  fb = inject(FormBuilder);

  propietariosService = inject(PropietariosService);

  propietarioForm = this.fb.group({
    nombreApellido: ['', Validators.required, Validators.minLength(3)],
    direccion: ['', Validators.required, Validators.minLength(3)],
    telefono: ['', Validators.required, Validators.minLength(3)],
    email: ['', [Validators.required, Validators.email]],
    activo: [0, Validators.required],
    dni: ['', Validators.required, Validators.minLength(9)],
    ciudad: [''],
    provincia: ['',],
    codigoPostal: [''],
    cuentaNro: [''],
  });

  ngOnInit(): void {
    this.setFormValue(this.propietario());
  }

  setFormValue( formLike: Partial<Propietario>) {
    this.propietarioForm.reset(this.propietario as any);
  }

  onSubmit(){
    const isValid = this.propietarioForm.valid;
    this.propietarioForm.markAllAsTouched();

    console.log(isValid);
  }
}
