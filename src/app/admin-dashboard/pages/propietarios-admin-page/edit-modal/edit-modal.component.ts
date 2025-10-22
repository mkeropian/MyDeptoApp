import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PropietariosService } from '../../../../propietarios/services/propietarios.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import Swal from 'sweetalert2';
import { Propietario } from '../../../../propietarios/interfaces/propietario.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-modal-propietario',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent,
    CommonModule
  ],
  templateUrl: './edit-modal.component.html',
})
export class EditModalComponent implements OnInit {

  @Output() propietarioActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private propietariosService = inject(PropietariosService);

  isOpen = signal(false);
  propietarioActual = signal<Propietario | null>(null);

  editForm = this.fb.group({
    nombreApellido: ['', [Validators.required, Validators.minLength(3)]],
    dni: ['', [Validators.required, Validators.minLength(8)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.minLength(3)]],
    direccion: ['', [Validators.required, Validators.minLength(3)]],
    ciudad: [''],
    provincia: [''],
    codigoPostal: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(6)]],
    cuenta_nro: [''],
  });

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  open(propietario: Propietario) {
    this.propietarioActual.set(propietario);

    this.editForm.patchValue({
      nombreApellido: propietario.nombreApellido,
      dni: propietario.dni,
      email: propietario.email || '',
      telefono: propietario.telefono || '',
      direccion: propietario.direccion || '',
      ciudad: propietario.ciudad || '',
      provincia: propietario.provincia || '',
      codigoPostal: propietario.codigoPostal || '',
      cuenta_nro: propietario.cuenta_nro || ''
    });

    this.isOpen.set(true);

    const modal = document.getElementById('edit_propietario_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  close() {
    this.isOpen.set(false);
    this.propietarioActual.set(null);
    this.editForm.reset();

    const modal = document.getElementById('edit_propietario_modal') as HTMLDialogElement;
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

    const propietarioActual = this.propietarioActual();
    if (!propietarioActual) return;

    const formValue = this.editForm.value;

    const modal = document.getElementById('edit_propietario_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }

    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      appRoot.removeAttribute('aria-hidden');
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await Swal.fire({
      title: '¿Confirmar cambios?',
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>Nombre:</strong> ${formValue.nombreApellido}</p>
          <p><strong>DNI:</strong> ${formValue.dni}</p>
          <p><strong>Email:</strong> ${formValue.email}</p>
          <p><strong>Teléfono:</strong> ${formValue.telefono}</p>
          <p><strong>Ciudad:</strong> ${formValue.ciudad || 'N/A'}</p>
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

    if (!result.isConfirmed) {
      if (modal) {
        modal.showModal();
      }
      return;
    }

    // MODIFICADO: Incluir TODOS los campos en la actualización
    const propietarioActualizado: Partial<Propietario> = {
      nombreApellido: formValue.nombreApellido!,
      dni: formValue.dni!,
      direccion: formValue.direccion!,
      ciudad: formValue.ciudad || '',
      provincia: formValue.provincia || '',
      codigoPostal: formValue.codigoPostal || '',
      telefono: formValue.telefono!,
      email: formValue.email!,
      cuenta_nro: formValue.cuenta_nro || '',
      avatarUrl: propietarioActual.avatarUrl || '',
      activo: propietarioActual.activo
    };

    this.propietariosService.updatePropietario(propietarioActual.id, propietarioActualizado).subscribe({
      next: (response) => {
        this.showSuccessToast('Propietario actualizado exitosamente');
        this.propietarioActualizado.emit();
        this.close();
      },
      error: (error) => {
        this.showErrorToast('Error al actualizar el propietario');
        if (modal) {
          modal.showModal();
        }
      }
    });
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
