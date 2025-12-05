import { Component, inject, signal, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuariosService } from '../../../../auth/services/users.service';
import { User } from '../../../../auth/interfaces/user.interface';
import { NotificationService } from '../../../../shared/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cambiar-clave-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cambiar-clave-modal.component.html',
})
export class CambiarClaveModalComponent implements OnInit {

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private notificationService = inject(NotificationService);

  claveActualizada = output<void>();

  // Señales
  usuarioSeleccionado = signal<User | null>(null);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Form
  claveForm!: FormGroup;

  ngOnInit(): void {
    this.claveForm = this.fb.group({
      claveNueva: ['', [Validators.required, Validators.minLength(6)]],
      claveConfirmar: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const claveNueva = control.get('claveNueva');
    const claveConfirmar = control.get('claveConfirmar');

    if (!claveNueva || !claveConfirmar) {
      return null;
    }

    if (claveConfirmar.value === '') {
      return null;
    }

    return claveNueva.value === claveConfirmar.value ? null : { passwordMismatch: true };
  }

  /**
   * Alterna visibilidad de la contraseña nueva
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Alterna visibilidad de la confirmación de contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  /**
   * Abre el modal
   */
  open(usuario: User): void {
    this.usuarioSeleccionado.set(usuario);
    this.claveForm.reset();

    const modal = document.getElementById('cambiar_clave_modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.claveForm.reset();
    this.usuarioSeleccionado.set(null);
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);

    const modal = document.getElementById('cambiar_clave_modal') as HTMLDialogElement;
    if (modal) modal.close();
  }

  /**
   * Submit del formulario
   */
  async onSubmit(): Promise<void> {
    if (this.claveForm.invalid) {
      this.claveForm.markAllAsTouched();
      this.notificationService.mostrarNotificacion('Por favor complete todos los campos correctamente', 'error');
      return;
    }

    const usuario = this.usuarioSeleccionado();
    if (!usuario) {
      this.notificationService.mostrarNotificacion('No hay usuario seleccionado', 'error');
      return;
    }

    const claveNueva = this.claveForm.value.claveNueva;

    // Cerrar el modal antes de mostrar SweetAlert
    const modal = document.getElementById('cambiar_clave_modal') as HTMLDialogElement;
    if (modal) modal.close();

    // Pequeño delay para que el modal se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 100));

    // Confirmación
    const result = await Swal.fire({
      title: '¿Cambiar contraseña?',
      html: `
        <div class="text-left space-y-3 px-2">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-gray-700">
              <i class="fas fa-user text-blue-500 mr-2"></i>
              <strong>Usuario:</strong> ${usuario.nombreCompleto}
            </p>
            <p class="text-sm text-gray-700 mt-1">
              <i class="fas fa-id-badge text-blue-500 mr-2"></i>
              <strong>Código:</strong> ${usuario.usuario}
            </p>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-xs text-amber-800">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              <strong>Advertencia:</strong> La contraseña actual del usuario será reemplazada.
            </p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-key mr-2"></i>Cambiar Contraseña',
      cancelButtonText: '<i class="fas fa-times mr-2"></i>Cancelar',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      width: '600px',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-2xl font-bold text-gray-800'
      }
    });

    if (!result.isConfirmed) {
      // Si cancela, reabrir el modal
      if (modal) modal.showModal();
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Procesando...',
      html: '<div class="flex flex-col items-center"><div class="loading loading-spinner loading-lg text-warning"></div><p class="mt-4 text-sm">Cambiando contraseña...</p></div>',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    this.isSubmitting.set(true);

    // Realizar cambio de contraseña
    this.usuariosService.updateClave(usuario.id, { clave: claveNueva }).subscribe({
      next: (response) => {
        Swal.close();
        this.isSubmitting.set(false);
        this.notificationService.mostrarNotificacion('Contraseña cambiada exitosamente', 'success');
        this.close();
        this.claveActualizada.emit();
      },
      error: (error) => {
        console.error('Error cambiando contraseña:', error);
        Swal.close();
        this.isSubmitting.set(false);

        Swal.fire({
          icon: 'error',
          title: 'No se pudo cambiar la contraseña',
          html: `
            <div class="text-left space-y-3 px-2">
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm text-red-800 font-medium">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  ${error.error?.msg || error.message || 'Error desconocido'}
                </p>
              </div>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#ef4444',
          width: '600px',
          customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-xl font-bold text-red-700'
          }
        });

        // Reabrir el modal para que pueda intentar de nuevo
        if (modal) modal.showModal();
      }
    });
  }
}
