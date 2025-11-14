import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../auth/services/users.service';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Vinculacion, DepartamentoSimple } from '../../interfaces/vinculacion.interface';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import { getRoleBadgeColor, formatRoleName } from '../../utils/role-colors.util';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ViewChild } from '@angular/core';
import { NuevaVinculacionModalComponent } from '../nueva-vinculacion-modal/nueva-vinculacion-modal.component';

const baseUrl = environment.baseUrl;

@Component({
  selector: 'app-vinculaciones-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NuevaVinculacionModalComponent],
  templateUrl: './vinculaciones-modal.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class VinculacionesModalComponent implements OnInit {

  private usuariosService = inject(UsuariosService);
  private propietariosService = inject(PropietariosService);
  private departamentosService = inject(DepartamentosService);

  @ViewChild(NuevaVinculacionModalComponent) nuevaVinculacionModal?: NuevaVinculacionModalComponent;

  vinculaciones = signal<Vinculacion[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadVinculaciones();
  }

  // Computed para filtrar vinculaciones
  filteredVinculaciones = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const vincs = this.vinculaciones();

    if (!term) return vincs;

    return vincs.filter(v =>
      v.usuarioNombre.toLowerCase().includes(term) ||
      v.usuarioCodigo.toLowerCase().includes(term) ||
      v.propietarioNombre.toLowerCase().includes(term) ||
      v.propietarioDni.includes(term)
    );
  });

  // Abrir modal
  open() {
    this.loadVinculaciones();
    const modal = document.getElementById('vinculaciones_modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  // Cerrar modal
  close() {
    this.searchTerm.set('');
    const modal = document.getElementById('vinculaciones_modal') as HTMLDialogElement;
    if (modal) modal.close();
  }

  // CORREGIDO: Cargar vinculaciones con manejo correcto de la respuesta
  loadVinculaciones() {
    this.isLoading.set(true);

    this.usuariosService.getVinculaciones().subscribe({
      next: (response) => {
        console.log('📥 Respuesta de getVinculaciones:', response);

        // CRÍTICO: El backend retorna un array directo, NO un objeto {ok, data}
        // Verificar que la respuesta sea un array
        if (!Array.isArray(response)) {
          console.error('❌ La respuesta del servicio no es un array:', response);
          this.showErrorToast('Error: formato de datos incorrecto');
          this.vinculaciones.set([]);
          this.isLoading.set(false);
          return;
        }

        const vinculaciones = response;

        // Si no hay vinculaciones, terminar aquí
        if (!vinculaciones || vinculaciones.length === 0) {
          console.log('ℹ️ No hay vinculaciones registradas');
          this.vinculaciones.set([]);
          this.isLoading.set(false);
          return;
        }

        console.log(`✅ ${vinculaciones.length} vinculaciones obtenidas`);

        // Cargar departamentos para cada vinculación
        const departamentosRequests = vinculaciones.map((v: Vinculacion) =>
          this.departamentosService.getDepartamentosByPropietario(v.propietarioId)
        );

        forkJoin<Departamento[][]>(departamentosRequests).subscribe({
          next: (departamentosArrays: Departamento[][]) => {
            const vinculacionesConDeptos = vinculaciones.map((v: Vinculacion, index: number) => ({
              ...v,
              departamentos: departamentosArrays[index].map(d => ({
                id: d.id,
                nombre: d.nombre,
                activo: d.activo
              }))
            }));

            console.log('✅ Vinculaciones con departamentos cargadas:', vinculacionesConDeptos.length);
            this.vinculaciones.set(vinculacionesConDeptos);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('⚠️ Error cargando departamentos:', error);
            // Si falla la carga de departamentos, mostrar vinculaciones sin departamentos
            const vinculacionesSinDeptos = vinculaciones.map((v: Vinculacion) => ({
              ...v,
              departamentos: []
            }));
            this.vinculaciones.set(vinculacionesSinDeptos);
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('❌ Error cargando vinculaciones:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });

        this.isLoading.set(false);

        // Mostrar mensaje más descriptivo según el tipo de error
        if (error.status === 500) {
          this.showErrorToast('Error en el servidor al cargar vinculaciones');
        } else if (error.status === 0) {
          this.showErrorToast('No se puede conectar con el servidor');
        } else {
          this.showErrorToast('Error al cargar vinculaciones');
        }

        this.vinculaciones.set([]);
      }
    });
  }

  // Nueva vinculación
  nuevaVinculacion() {
    // Cerrar el modal principal primero
    this.close();

    // Pequeño delay antes de abrir el nuevo modal
    setTimeout(() => {
      if (this.nuevaVinculacionModal) {
        this.nuevaVinculacionModal.open();
      }
    }, 100);
  }

  // Callback cuando se crea una vinculación
  onVinculacionCreada(): void {
    this.loadVinculaciones();

    // Reabrir el modal principal después de crear vinculación
    setTimeout(() => {
      this.open();
    }, 300);
  }

  // Cambiar vinculación
  async cambiarVinculacion(vinculacion: Vinculacion) {
    const modal = document.getElementById('vinculaciones_modal') as HTMLDialogElement;
    if (modal) modal.close();

    await new Promise(resolve => setTimeout(resolve, 100));

    this.propietariosService.getPropietariosActivos().subscribe({
      next: async (propietarios) => {
        // Obtener lista de propietarios ya vinculados (excepto el actual)
        const propietariosVinculados = this.vinculaciones()
          .filter(v => v.usuarioId !== vinculacion.usuarioId)
          .map(v => v.propietarioId);

        // Filtrar propietarios disponibles (no vinculados + el actual)
        const propietariosDisponibles = propietarios.filter(p =>
          !propietariosVinculados.includes(p.id) || p.id === vinculacion.propietarioId
        );

        if (propietariosDisponibles.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'No hay propietarios disponibles',
            html: `
              <div class="text-left space-y-2 px-2">
                <p class="text-sm text-gray-700">
                  Todos los propietarios activos ya están vinculados a otros usuarios.
                </p>
                <p class="text-xs text-gray-500 mt-3">
                  Desvincule primero algún propietario para poder asignarlo a este usuario.
                </p>
              </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#6b7280',
            customClass: {
              popup: 'rounded-2xl shadow-2xl'
            }
          });
          if (modal) modal.showModal();
          return;
        }

        const inputOptions: { [key: string]: string } = {};
        propietariosDisponibles.forEach(p => {
          inputOptions[p.id.toString()] = `${p.nombreApellido} - DNI: ${p.dni}`;
        });

        const result = await Swal.fire({
          title: 'Cambiar Propietario Vinculado',
          html: `
            <div class="text-left space-y-3 px-2">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-user text-blue-500 mr-2"></i>
                  <strong>Usuario:</strong> ${vinculacion.usuarioNombre}
                </p>
                <p class="text-sm text-gray-700 mt-1">
                  <i class="fas fa-id-badge text-blue-500 mr-2"></i>
                  <strong>Código:</strong> ${vinculacion.usuarioCodigo}
                </p>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-user-tie text-amber-600 mr-2"></i>
                  <strong>Propietario actual:</strong> ${vinculacion.propietarioNombre}
                </p>
              </div>

              <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                <p class="text-sm text-gray-700 font-medium mb-2">
                  <i class="fas fa-arrow-right text-green-600 mr-2"></i>
                  Seleccione el nuevo propietario:
                </p>
              </div>
            </div>
          `,
          input: 'select',
          inputOptions: inputOptions,
          inputPlaceholder: 'Seleccione un propietario',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-check mr-2"></i>Confirmar Cambio',
          cancelButtonText: '<i class="fas fa-times mr-2"></i>Cancelar',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280',
          width: '700px',
          padding: '2rem',
          inputValidator: (value) => {
            if (!value) {
              return 'Debe seleccionar un propietario';
            }
            return null;
          },
          customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-2xl font-bold text-gray-800',
            confirmButton: 'px-6 py-3 rounded-lg font-semibold',
            cancelButton: 'px-6 py-3 rounded-lg font-semibold'
          }
        });

        if (result.isConfirmed && result.value) {
          const nuevoPropietarioId = parseInt(result.value);
          const nuevoPropietario = propietariosDisponibles.find(p => p.id === nuevoPropietarioId);

          Swal.fire({
            title: 'Procesando...',
            html: '<div class="flex flex-col items-center"><div class="loading loading-spinner loading-lg text-primary"></div><p class="mt-4 text-sm">Actualizando vinculación...</p></div>',
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false
          });

          this.usuariosService.desvincularPropietario(vinculacion.usuarioId).subscribe({
            next: () => {
              this.usuariosService.vincularPropietario(vinculacion.usuarioId, nuevoPropietarioId).subscribe({
                next: () => {
                  Swal.close();
                  this.loadVinculaciones();
                  this.showSuccessToast(`Vinculación actualizada a ${nuevoPropietario?.nombreApellido}`);
                  setTimeout(() => {
                    if (modal) modal.showModal();
                  }, 300);
                },
                error: (error) => {
                  console.error('Error vinculando nuevo propietario:', error);
                  Swal.close();
                  Swal.fire({
                    icon: 'error',
                    title: 'Error al vincular',
                    text: error.error?.msg || 'No se pudo crear la nueva vinculación',
                    confirmButtonText: 'Cerrar',
                    confirmButtonColor: '#ef4444'
                  }).then(() => {
                    if (modal) modal.showModal();
                  });
                }
              });
            },
            error: (error) => {
              console.error('Error desvinculando propietario anterior:', error);
              Swal.close();
              Swal.fire({
                icon: 'error',
                title: 'Error al desvincular',
                text: error.error?.msg || 'No se pudo eliminar la vinculación anterior',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#ef4444'
              }).then(() => {
                if (modal) modal.showModal();
              });
            }
          });
        } else {
          if (modal) modal.showModal();
        }
      },
      error: (error) => {
        console.error('Error cargando propietarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos',
          html: `
            <div class="text-left space-y-2 px-2">
              <p class="text-sm text-gray-700">
                No se pudieron cargar los propietarios disponibles.
              </p>
              <p class="text-xs text-gray-500">
                Por favor, intente nuevamente.
              </p>
            </div>
          `,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#6b7280',
          customClass: {
            popup: 'rounded-2xl shadow-2xl'
          }
        });
        if (modal) modal.showModal();
      }
    });
  }

  // Eliminar vinculación
  async eliminarVinculacion(vinculacion: Vinculacion) {
    const modal = document.getElementById('vinculaciones_modal') as HTMLDialogElement;
    if (modal) modal.close();

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar vinculación?',
      html: `
        <div class="text-left space-y-3 px-2">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-gray-700">
              <i class="fas fa-user text-blue-500 mr-2"></i>
              <strong>Usuario:</strong> ${vinculacion.usuarioNombre}
            </p>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-sm text-gray-700">
              <i class="fas fa-user-tie text-green-600 mr-2"></i>
              <strong>Propietario:</strong> ${vinculacion.propietarioNombre}
            </p>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-xs text-amber-800">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              <strong>Advertencia:</strong> El usuario ya no tendrá acceso a los departamentos del propietario en "Mis Rendiciones".
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-trash mr-2"></i>Eliminar Vinculación',
      cancelButtonText: '<i class="fas fa-times mr-2"></i>Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      width: '600px',
      padding: '2rem',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-2xl font-bold text-gray-800',
        confirmButton: 'px-6 py-3 rounded-lg font-semibold',
        cancelButton: 'px-6 py-3 rounded-lg font-semibold'
      }
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Procesando...',
        html: '<div class="flex flex-col items-center"><div class="loading loading-spinner loading-lg text-error"></div><p class="mt-4 text-sm">Eliminando vinculación...</p></div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      });

      this.usuariosService.desvincularPropietario(vinculacion.usuarioId).subscribe({
        next: (response) => {
          Swal.close();
          this.loadVinculaciones();
          this.showSuccessToast('Vinculación eliminada exitosamente');
          setTimeout(() => {
            if (modal) modal.showModal();
          }, 300);
        },
        error: (error) => {
          console.error('Error eliminando vinculación:', error);
          Swal.close();

          Swal.fire({
            icon: 'error',
            title: 'No se pudo eliminar',
            html: `
              <div class="text-left space-y-2 px-2">
                <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-800">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    ${error.error?.msg || 'Error al eliminar la vinculación'}
                  </p>
                </div>
              </div>
            `,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#ef4444',
            width: '600px',
            customClass: {
              popup: 'rounded-2xl shadow-2xl',
              title: 'text-xl font-bold text-red-700'
            }
          }).then(() => {
            if (modal) modal.showModal();
          });
        }
      });
    } else {
      if (modal) modal.showModal();
    }
  }

  // Helpers
  getRoleBadgeColor = getRoleBadgeColor;
  formatRoleName = formatRoleName;

  getUsuarioAvatar(vinculacion: Vinculacion): string {
    if (!vinculacion.usuarioAvatar || vinculacion.usuarioAvatar.trim() === '') {
      return 'assets/images/default-avatar.png';
    }

    const cleanUrl = vinculacion.usuarioAvatar.trim();

    if (this.isValidHttpUrl(cleanUrl)) {
      return cleanUrl;
    }

    if (cleanUrl.startsWith('assets/') || cleanUrl.startsWith('/assets/')) {
      return cleanUrl;
    }

    return `${baseUrl}/archivos/avatar/${cleanUrl}`;
  }

  getPropietarioAvatar(vinculacion: Vinculacion): string {
    return this.propietariosService.getAvatarUrl(vinculacion.propietarioAvatar);
  }

  private isValidHttpUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-avatar.png';
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

  private showInfoToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 9999; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-info shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">${message}</span>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.parentNode?.removeChild(toast), 4000);
  }
}
