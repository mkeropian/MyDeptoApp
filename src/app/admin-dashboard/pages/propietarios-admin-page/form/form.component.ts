import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
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
export class FormComponent implements OnInit {

  // NUEVO: Output para notificar cuando se crea un propietario
  @Output() propietarioCreado = new EventEmitter<void>();

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

  // ✅ Esta es la propiedad que estaba faltando
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

  setFormValue(formLike: Partial<Propietario>) {
    this.propietarioForm.patchValue(formLike);
  }

  // ✅ Este es el método que estaba faltando
  limpiarForm() {
    this.propietarioForm.reset({
      activo: 0
    });
    this.propietarioForm.markAsUntouched();
    this.propietarioForm.markAsPristine();

    console.log('Formulario limpiado');
  }

  onSubmit() {
    const isValid = this.propietarioForm.valid;
    this.propietarioForm.markAllAsTouched();

    if (!isValid) return;

    const formValue = this.propietarioForm.value;

    this.propietariosService.createPropietario(formValue as Propietario).subscribe({
      next: (propietario) => {

        // console.log('Propietario creado:', propietario);

        // Resetear el formulario
        this.propietarioForm.reset({
          activo: 0
        });
        this.propietarioForm.markAsUntouched();
        this.propietarioForm.markAsPristine();

        // NUEVO: Emitir evento para refrescar la lista
        this.propietarioCreado.emit();

        // Mostrar mensaje de éxito
        this.showSuccessToast('Propietario creado exitosamente');
      },
      error: (error) => {
        console.error('Error al crear propietario:', error);
        this.showErrorToast('Error al crear el propietario');
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
