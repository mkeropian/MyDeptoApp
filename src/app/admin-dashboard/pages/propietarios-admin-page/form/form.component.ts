import { Component, inject, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Propietario } from '../../../../propietarios/interfaces/propietario.interface';
import { Router } from '@angular/router';
import { PropietariosService } from '../../../../propietarios/services/propietarios.service';
import { FormErrorLabelComponent } from "../../../../shared/components/form-error-label/form-error-label.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent,
    CommonModule
  ],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {

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

  // NUEVO: Señales para manejo de avatar
  selectedFile = signal<File | null>(null);
  avatarPreview = signal<string>('');
  isUploadingAvatar = signal<boolean>(false);

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

  limpiarForm() {
    this.propietarioForm.reset({
      activo: 0
    });
    this.propietarioForm.markAsUntouched();
    this.propietarioForm.markAsPristine();

    // Limpiar avatar
    this.selectedFile.set(null);
    this.avatarPreview.set('');

    // console.log('Formulario limpiado');
  }

  /**
   * NUEVO: Maneja la selección de archivo para el avatar
   */
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.showErrorToast('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showErrorToast('El archivo no debe superar los 5MB');
      return;
    }

    // Guardar archivo y mostrar preview
    this.selectedFile.set(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * NUEVO: Elimina el avatar seleccionado
   */
  removeAvatar(): void {
    this.selectedFile.set(null);
    this.avatarPreview.set('');

    // Resetear el input file
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit() {
    const isValid = this.propietarioForm.valid;
    this.propietarioForm.markAllAsTouched();

    if (!isValid) return;

    const formValue = this.propietarioForm.value;

    this.propietariosService.createPropietario(formValue as Propietario).subscribe({
      next: (propietario) => {
        console.log('Propietario creado:', propietario);

        // Si hay un avatar seleccionado, subirlo
        const file = this.selectedFile();
        if (file && propietario.id) {
          this.uploadAvatar(file, propietario.id);
        } else {
          this.finalizarCreacion();
        }
      },
      error: (error) => {
        console.error('Error al crear propietario:', error);
        this.showErrorToast('Error al crear el propietario');
      }
    });
  }

  /**
   * NUEVO: Sube el avatar del propietario
   */
  private uploadAvatar(file: File, propietarioId: number): void {
    this.isUploadingAvatar.set(true);

    this.propietariosService.uploadAvatarPropietario(file, propietarioId).subscribe({
      next: (response: any) => {
        console.log('Avatar subido exitosamente:', response);
        this.finalizarCreacion();
      },
      error: (error: any) => {
        console.error('Error subiendo avatar:', error);
        this.showErrorToast('Propietario creado pero falló la carga del avatar');
        this.finalizarCreacion();
      }
    });
  }

  /**
   * NUEVO: Finaliza el proceso de creación
   */
  private finalizarCreacion(): void {
    this.isUploadingAvatar.set(false);

    // Resetear el formulario
    this.propietarioForm.reset({
      activo: 0
    });
    this.propietarioForm.markAsUntouched();
    this.propietarioForm.markAsPristine();

    // Limpiar avatar
    this.selectedFile.set(null);
    this.avatarPreview.set('');

    // Emitir evento para refrescar la lista
    this.propietarioCreado.emit();

    // Mostrar mensaje de éxito
    this.showSuccessToast('Propietario creado exitosamente');
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
