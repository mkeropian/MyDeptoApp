import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../../auth/services/users.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import Swal from 'sweetalert2';
import { User } from '../../../../auth/interfaces/user.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-modal-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent,
    CommonModule
  ],
  templateUrl: './edit-modal.component.html',
})
export class EditModalComponent implements OnInit {

  @Output() usuarioActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private notificationService = inject(NotificationService);

  isOpen = signal(false);
  usuarioActual = signal<User | null>(null);

  // Signals para manejo de avatar
  selectedFile = signal<File | null>(null);
  avatarPreview = signal<string>('');
  isUploading = signal<boolean>(false);

  // Resource para roles
  rolesResource = rxResource({
    request: () => ({}),
    loader: () => this.usuariosService.getRoles()
  });

  roles = computed(() => this.rolesResource.value() || []);

  editForm = this.fb.group({
    usuario: ['', [Validators.required, Validators.minLength(2)]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    rolId: [0, [Validators.required, Validators.min(1)]],
    tema: ['light'],
  });

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  open(usuario: User) {
    this.usuarioActual.set(usuario);

    this.editForm.patchValue({
      usuario: usuario.usuario,
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      rolId: usuario.rolId || 0,
      tema: usuario.tema || 'light'
    });

    // Establecer preview del avatar actual
    if (usuario.avatarUrl) {
      this.avatarPreview.set(usuario.avatarUrl);
    } else {
      this.avatarPreview.set('');
    }

    // Limpiar archivo seleccionado
    this.selectedFile.set(null);

    this.isOpen.set(true);

    const modal = document.getElementById('edit_usuario_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  close() {
    this.isOpen.set(false);
    this.usuarioActual.set(null);
    this.editForm.reset();
    this.selectedFile.set(null);
    this.avatarPreview.set('');

    const modal = document.getElementById('edit_usuario_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  /**
   * Maneja la selección de archivo para el avatar
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.notificationService.mostrarNotificacion(
          'Tipo de archivo no permitido. Use JPG, PNG o GIF.',
          'error'
        );
        input.value = '';
        return;
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.notificationService.mostrarNotificacion(
          'El archivo es demasiado grande. Máximo 5MB permitido.',
          'error'
        );
        input.value = '';
        return;
      }

      // Guardar archivo y crear preview
      this.selectedFile.set(file);

      // Crear URL temporal para la preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.avatarPreview.set(result);
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Elimina el avatar seleccionado
   */
  removeAvatar(): void {
    this.selectedFile.set(null);

    // Restaurar preview del avatar original
    const usuario = this.usuarioActual();
    if (usuario?.avatarUrl) {
      this.avatarPreview.set(usuario.avatarUrl);
    } else {
      this.avatarPreview.set('');
    }

    // Resetear el input file
    const fileInput = document.getElementById('avatarEditInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA3NEM2MS4wNDU3IDc0IDcwIDY1LjA0NTcgNzAgNTRDNzAgNDIuOTU0MyA2MS4wNDU3IDM0IDUwIDM0QzM4Ljk1NDMgMzQgMzAgNDIuOTU0MyAzMCA1NEMzMCA2NS4wNDU3IDM4Ljk1NDMgNzQgNTAgNzRaIiBmaWxsPSIjOUI5REEwIi8+CjxwYXRoIGQ9Ik01MCA0OEM1My4zMTM3IDQ4IDU2IDQ1LjMxMzcgNTYgNDJDNTYgMzguNjg2MyA1My4zMTM3IDM2IDUwIDM2QzQ2LjY4NjMgMzYgNDQgMzguNjg2MyA0NCA0MkM0NCA0NS4zMTM3IDQ2LjY4NjMgNDggNTAgNDhaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
  }

  async onSubmit() {
    const isValid = this.editForm.valid;
    this.editForm.markAllAsTouched();

    if (!isValid) {
      this.notificationService.mostrarNotificacion('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    const usuarioActual = this.usuarioActual();
    if (!usuarioActual) return;

    const formValue = this.editForm.value;

    // Cerrar el modal antes de mostrar SweetAlert
    const modal = document.getElementById('edit_usuario_modal') as HTMLDialogElement;
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
          <p><strong>Usuario:</strong> ${formValue.usuario}</p>
          <p><strong>Nombre:</strong> ${formValue.nombreCompleto}</p>
          <p><strong>Email:</strong> ${formValue.email}</p>
          <p><strong>Rol:</strong> ${this.roles().find(r => r.id === Number(formValue.rolId))?.nombre || 'Sin rol'}</p>
          <p><strong>Tema:</strong> ${formValue.tema}</p>
          ${this.selectedFile() ? '<p class="text-info"><i class="fas fa-image mr-2"></i>Se actualizará el avatar</p>' : ''}
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

    this.isUploading.set(true);

    // Preparar datos de actualización
    const usuarioActualizado: Partial<User> = {
      usuario: formValue.usuario!,
      nombreCompleto: formValue.nombreCompleto!,
      email: formValue.email!,
      tema: formValue.tema || 'light',
    };

    // Actualizar usuario
    this.usuariosService.updateUsuario(usuarioActual.id, usuarioActualizado).subscribe({
      next: (response) => {
        console.log('Usuario actualizado:', response);

        // Actualizar rol si cambió
        const nuevoRolId = formValue.rolId;
        if (nuevoRolId && nuevoRolId !== usuarioActual.rolId) {
          this.actualizarRol(usuarioActual.id, nuevoRolId!);
        } else {
          // Si no cambia el rol, continuar con avatar
          this.procesarAvatar(usuarioActual.id);
        }
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        this.notificationService.mostrarNotificacion('Error al actualizar el usuario', 'error');
        this.isUploading.set(false);
        if (modal) {
          modal.showModal();
        }
      }
    });
  }

  /**
   * Actualiza el rol del usuario
   */
  private actualizarRol(usuarioId: number, nuevoRolId: number): void {
    // CAMBIO: Llamamos al servicio (asegurate de tener este método en tu UsersService)
    this.usuariosService.updateRol(usuarioId, nuevoRolId).subscribe({
      next: () => {
        console.log('Rol guardado en BD correctamente');
        // Una vez guardado el rol, seguimos con el avatar
        this.procesarAvatar(usuarioId);
      },
      error: (err) => {
        console.error('Error al guardar rol:', err);
        this.notificationService.mostrarNotificacion('Error al actualizar el rol', 'error');
        // Seguimos igual para no trabar la subida de imagen si el rol falla
        this.procesarAvatar(usuarioId);
      }
    });
  }

  /**
   * Procesa la actualización del avatar si hay archivo seleccionado
   */
  private procesarAvatar(usuarioId: number): void {
    const file = this.selectedFile();

    if (file) {
      // Si hay archivo seleccionado, subirlo
      this.usuariosService.uploadAvatar(file, usuarioId).subscribe({
        next: (response) => {
          console.log('Avatar actualizado:', response);
          this.finalizarActualizacion();
        },
        error: (error) => {
          console.error('Error al actualizar avatar:', error);
          this.notificationService.mostrarNotificacion('Usuario actualizado, pero hubo un error al actualizar el avatar', 'warning');
          this.finalizarActualizacion();
        }
      });
    } else {
      // Sin avatar nuevo, finalizar
      this.finalizarActualizacion();
    }
  }

  /**
   * Finaliza el proceso de actualización
   */
  private finalizarActualizacion(): void {
    this.isUploading.set(false);
    this.notificationService.mostrarNotificacion('Usuario actualizado exitosamente', 'success');
    this.usuarioActualizado.emit();
    this.close();
  }
}
