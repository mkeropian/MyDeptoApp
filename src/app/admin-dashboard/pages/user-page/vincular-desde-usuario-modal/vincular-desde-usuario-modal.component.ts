import { Component, inject, signal, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../../auth/services/users.service';
import { PropietariosService } from '../../../../propietarios/services/propietarios.service';
import { User } from '../../../../auth/interfaces/user.interface';
import { Propietario } from '../../../../propietarios/interfaces/propietario.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vincular-desde-usuario-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vincular-desde-usuario-modal.component.html',
})
export class VincularDesdeUsuarioModalComponent implements OnInit {

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private propietariosService = inject(PropietariosService);

  vinculacionRealizada = output<void>();

  // Señales
  usuarioSeleccionado = signal<User | null>(null);
  propietarios = signal<Propietario[]>([]);
  propietariosDisponibles = signal<Propietario[]>([]);
  propietariosVinculados = signal<number[]>([]); // IDs de propietarios ya vinculados
  isLoading = signal<boolean>(false);

  // Form
  vinculacionForm!: FormGroup;

  ngOnInit(): void {
    this.vinculacionForm = this.fb.group({
      idPropietario: ['', Validators.required]
    });

    this.cargarDatos();
  }

  // Cargar propietarios y determinar disponibilidad
  cargarDatos(): void {
    this.isLoading.set(true);

    this.propietariosService.getPropietarios().subscribe({
      next: (propietarios) => {
        this.propietarios.set(propietarios);

        // Obtener IDs de propietarios ya vinculados
        const vinculados = propietarios
          .filter(p => p.usuarioId !== null && p.usuarioId !== undefined)
          .map(p => p.id);
        this.propietariosVinculados.set(vinculados);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando propietarios:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Abrir modal desde usuario
  openFromUser(usuario: User): void {
    this.usuarioSeleccionado.set(usuario);

    // Verificar que el usuario tenga rol permitido
    const rolesPermitidos = ['admin', 'gerenciadora', 'prop'];
    if (!usuario.rolNombre || !rolesPermitidos.includes(usuario.rolNombre)) {
      Swal.fire({
        icon: 'warning',
        title: 'Rol no permitido',
        html: `
          <div class="text-left space-y-3 px-2">
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-sm text-amber-800">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Este usuario no tiene un rol permitido para vinculaciones.
              </p>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p class="text-xs text-blue-800">
                <i class="fas fa-info-circle mr-2"></i>
                <strong>Roles permitidos:</strong> Admin, Gerenciadora, Prop
              </p>
              <p class="text-xs text-blue-800 mt-2">
                <strong>Rol actual:</strong> ${usuario.rolNombre || 'Sin rol'}
              </p>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#f59e0b',
        width: '600px',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-amber-700'
        }
      });
      return;
    }

    // Filtrar propietarios disponibles (no vinculados o el actual vinculado a este usuario)
    const disponibles = this.propietarios().filter(p =>
      !this.propietariosVinculados().includes(p.id) ||
      (p.usuarioId === usuario.id)
    );

    this.propietariosDisponibles.set(disponibles);

    // Si el usuario ya tiene propietario vinculado, pre-seleccionarlo
    if (usuario.propietarioId) {
      this.vinculacionForm.patchValue({
        idPropietario: usuario.propietarioId
      });
    } else {
      this.vinculacionForm.reset();
    }

    const modal = document.getElementById('vincular_desde_usuario_modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  // Cerrar modal
  close(): void {
    this.vinculacionForm.reset();
    this.usuarioSeleccionado.set(null);
    const modal = document.getElementById('vincular_desde_usuario_modal') as HTMLDialogElement;
    if (modal) modal.close();
  }

  // Submit del formulario
  async onSubmit(): Promise<void> {
    if (this.vinculacionForm.invalid) {
      this.showErrorToast('Debe seleccionar un propietario');
      return;
    }

    const usuario = this.usuarioSeleccionado();
    if (!usuario) {
      this.showErrorToast('No hay usuario seleccionado');
      return;
    }

    const idPropietario = parseInt(this.vinculacionForm.value.idPropietario);
    const propietarioSeleccionado = this.propietarios().find(p => p.id === idPropietario);

    // CRÍTICO: Cerrar el modal ANTES de mostrar SweetAlert
    const modal = document.getElementById('vincular_desde_usuario_modal') as HTMLDialogElement;
    if (modal) modal.close();

    // Pequeño delay para que el modal se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 100));

    // Confirmación
    const result = await Swal.fire({
      title: '¿Confirmar vinculación?',
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
            <span class="badge badge-sm badge-info mt-2">
              ${usuario.rolNombre || 'Sin rol'}
            </span>
          </div>

          <div class="flex items-center justify-center">
            <i class="fas fa-arrows-left-right text-primary text-2xl"></i>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-sm text-gray-700">
              <i class="fas fa-user-tie text-green-600 mr-2"></i>
              <strong>Propietario:</strong> ${propietarioSeleccionado?.nombreApellido || 'Desconocido'}
            </p>
            <p class="text-sm text-gray-700 mt-1">
              <i class="fas fa-id-card text-green-600 mr-2"></i>
              <strong>DNI:</strong> ${propietarioSeleccionado?.dni || '-'}
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-check mr-2"></i>Confirmar',
      cancelButtonText: '<i class="fas fa-times mr-2"></i>Cancelar',
      confirmButtonColor: '#3b82f6',
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
      html: '<div class="flex flex-col items-center"><div class="loading loading-spinner loading-lg text-primary"></div><p class="mt-4 text-sm">Vinculando usuario a propietario...</p></div>',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    // Realizar vinculación
    this.usuariosService.vincularPropietario(usuario.id, idPropietario).subscribe({
      next: (response) => {
        Swal.close();
        this.showSuccessToast('Vinculación realizada exitosamente');
        this.close();
        this.vinculacionRealizada.emit();
        this.cargarDatos(); // Recargar para actualizar disponibilidad
      },
      error: (error) => {
        console.error('Error vinculando:', error);
        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'No se pudo vincular',
          html: `
            <div class="text-left space-y-3 px-2">
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm text-red-800 font-medium">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  ${error.error?.msg || error.message || 'Error desconocido'}
                </p>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-xs text-blue-800">
                  <i class="fas fa-info-circle mr-2"></i>
                  <strong>Posible causa:</strong> El propietario ya está vinculado a otro usuario.
                </p>
                <p class="text-xs text-blue-800 mt-2">
                  <strong>Solución:</strong> Primero desvincule el propietario desde la página de Propietarios.
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
      }
    });
  }

  // Desvincular propietario
  async desvincular(): Promise<void> {
    const usuario = this.usuarioSeleccionado();
    if (!usuario || !usuario.propietarioId) {
      this.showErrorToast('No hay propietario vinculado');
      return;
    }

    const propietarioVinculado = this.propietarios().find(p => p.id === usuario.propietarioId);

    // CRÍTICO: Cerrar el modal ANTES de mostrar SweetAlert
    const modal = document.getElementById('vincular_desde_usuario_modal') as HTMLDialogElement;
    if (modal) modal.close();

    // Pequeño delay para que el modal se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await Swal.fire({
      title: '¿Desvincular propietario?',
      html: `
        <div class="text-left space-y-3 px-2">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-gray-700">
              <i class="fas fa-user text-blue-500 mr-2"></i>
              <strong>Usuario:</strong> ${usuario.nombreCompleto}
            </p>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-sm text-gray-700">
              <i class="fas fa-user-tie text-green-600 mr-2"></i>
              <strong>Propietario:</strong> ${propietarioVinculado?.nombreApellido || 'Desconocido'}
            </p>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-xs text-amber-800">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              <strong>Advertencia:</strong> El usuario ya no tendrá acceso a los departamentos del propietario.
            </p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-unlink mr-2"></i>Desvincular',
      cancelButtonText: '<i class="fas fa-times mr-2"></i>Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      width: '600px',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-2xl font-bold text-gray-800'
      }
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Procesando...',
      html: '<div class="flex flex-col items-center"><div class="loading loading-spinner loading-lg text-error"></div><p class="mt-4 text-sm">Desvinculando...</p></div>',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    this.usuariosService.desvincularPropietario(usuario.id).subscribe({
      next: () => {
        Swal.close();
        this.showSuccessToast('Propietario desvinculado exitosamente');
        this.close();
        this.vinculacionRealizada.emit();
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error desvinculando:', error);
        Swal.close();
        this.showErrorToast(error.error?.msg || 'Error al desvincular');
      }
    });
  }

  // Toasts
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
    setTimeout(() => toast.parentNode?.removeChild(toast), 4000);
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
    setTimeout(() => toast.parentNode?.removeChild(toast), 4000);
  }
}
