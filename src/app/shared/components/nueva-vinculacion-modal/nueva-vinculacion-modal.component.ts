import { Component, inject, signal, output, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../../auth/services/users.service';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { User } from '../../../auth/interfaces/user.interface';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import { getRoleBadgeColor, formatRoleName } from '../../utils/role-colors.util';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

interface PropietarioConDepartamentos extends Propietario {
  departamentos?: Departamento[];
}

@Component({
  selector: 'app-nueva-vinculacion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nueva-vinculacion-modal.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class NuevaVinculacionModalComponent implements OnInit, AfterViewInit {

  private usuariosService = inject(UsuariosService);
  private propietariosService = inject(PropietariosService);
  private departamentosService = inject(DepartamentosService);

  @ViewChild('canvasLine') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('usuariosContainer') usuariosContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('propietariosContainer') propietariosContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('dialogEl') dialogEl!: ElementRef<HTMLDialogElement>;

  vinculacionCreada = output<void>();

  // Señales
  usuariosDisponibles = signal<User[]>([]);
  propietariosDisponibles = signal<PropietarioConDepartamentos[]>([]);
  usuarioSeleccionado = signal<User | null>(null);
  propietarioSeleccionado = signal<PropietarioConDepartamentos | null>(null);
  isLoading = signal<boolean>(false);

  // Helpers
  getRoleBadgeColor = getRoleBadgeColor;
  formatRoleName = formatRoleName;

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    // Escuchar cambios en las selecciones para redibujar línea
    this.dibujarLinea();
  }

  // Cargar usuarios y propietarios disponibles
  cargarDatos(): void {
    this.isLoading.set(true);

    forkJoin({
      usuarios: this.usuariosService.getUsuarios(),
      propietarios: this.propietariosService.getPropietarios()
    }).subscribe({
      next: ({ usuarios, propietarios }) => {
        // Filtrar usuarios disponibles (con roles permitidos, sin vinculación, rol !== 'emp')
        const usuariosDisponibles = usuarios.filter(u =>
          u.rolNombre &&
          ['admin', 'gerenciadora', 'prop'].includes(u.rolNombre) &&
          (!u.propietarioId || u.propietarioId === null)
        );
        this.usuariosDisponibles.set(usuariosDisponibles);

        // Filtrar propietarios disponibles (sin vinculación)
        const propietariosDisponibles = propietarios.filter(p =>
          !p.usuarioId || p.usuarioId === null
        );

        // Cargar departamentos para cada propietario
        if (propietariosDisponibles.length > 0) {
          const departamentosRequests = propietariosDisponibles.map(p =>
            this.departamentosService.getDepartamentosByPropietario(p.id)
          );

          forkJoin(departamentosRequests).subscribe({
            next: (departamentosArrays) => {
              const propietariosConDeptos = propietariosDisponibles.map((p, index) => ({
                ...p,
                departamentos: departamentosArrays[index]
              }));
              this.propietariosDisponibles.set(propietariosConDeptos);
              this.isLoading.set(false);
            },
            error: (error) => {
              console.error('Error cargando departamentos:', error);
              this.propietariosDisponibles.set(propietariosDisponibles.map(p => ({ ...p, departamentos: [] })));
              this.isLoading.set(false);
            }
          });
        } else {
          this.propietariosDisponibles.set([]);
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.isLoading.set(false);
        this.showErrorToast('Error al cargar datos');
      }
    });
  }

  // Abrir modal
  open(): void {
    this.cargarDatos();

    // 💡 SOLUCIÓN: Usar setTimeout para asegurar que el DOM esté listo
    setTimeout(() => {
      if (this.dialogEl && this.dialogEl.nativeElement) {
        this.dialogEl.nativeElement.showModal();
      }
    }, 0); // Añadido un pequeño delay
  }

  // Cerrar modal
  close(): void {
    this.usuarioSeleccionado.set(null);
    this.propietarioSeleccionado.set(null);
    this.limpiarLinea();

    if (this.dialogEl && this.dialogEl.nativeElement) {
      this.dialogEl.nativeElement.close();
    }
  }

  // Seleccionar usuario
  seleccionarUsuario(usuario: User): void {
    this.usuarioSeleccionado.set(usuario);
    setTimeout(() => this.dibujarLinea(), 50);
  }

  // Seleccionar propietario
  seleccionarPropietario(propietario: PropietarioConDepartamentos): void {
    this.propietarioSeleccionado.set(propietario);
    setTimeout(() => this.dibujarLinea(), 50);
  }

  // Dibujar línea de conexión
  dibujarLinea(): void {
    if (!this.canvasRef || !this.usuariosContainer || !this.propietariosContainer) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const usuario = this.usuarioSeleccionado();
    const propietario = this.propietarioSeleccionado();

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Si no hay ambos seleccionados, no dibujar
    if (!usuario || !propietario) {
      return;
    }

    // Obtener elementos DOM
    const usuarioEl = document.getElementById(`usuario-${usuario.id}`);
    const propietarioEl = document.getElementById(`propietario-${propietario.id}`);

    if (!usuarioEl || !propietarioEl) return;

    // Obtener posiciones relativas al canvas
    const canvasRect = canvas.getBoundingClientRect();
    const usuarioRect = usuarioEl.getBoundingClientRect();
    const propietarioRect = propietarioEl.getBoundingClientRect();

    // Calcular puntos de conexión (centro del avatar)
    const startX = usuarioRect.right - canvasRect.left;
    const startY = usuarioRect.top + (usuarioRect.height / 2) - canvasRect.top;
    const endX = propietarioRect.left - canvasRect.left;
    const endY = propietarioRect.top + (propietarioRect.height / 2) - canvasRect.top;

    // Dibujar línea con estilo
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#3b82f6'; // Color primary
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]); // Línea punteada
    ctx.stroke();

    // Dibujar puntos en los extremos
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#10b981'; // Color success
    ctx.fill();
  }

  // Limpiar línea
  limpiarLinea(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Vincular
  async vincular(): Promise<void> {
    const usuario = this.usuarioSeleccionado();
    const propietario = this.propietarioSeleccionado();

    if (!usuario || !propietario) {
      this.showErrorToast('Debe seleccionar un usuario y un propietario');
      return;
    }

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
              <strong>Propietario:</strong> ${propietario.nombreApellido}
            </p>
            <p class="text-sm text-gray-700 mt-1">
              <i class="fas fa-id-card text-green-600 mr-2"></i>
              <strong>DNI:</strong> ${propietario.dni}
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

    if (!result.isConfirmed) return;

    // Mostrar loading
    Swal.fire({
      title: 'Procesando...',
      html: '<div class="flex flex-col items-center"><div class="loading loading-spinner loading-lg text-primary"></div><p class="mt-4 text-sm">Creando vinculación...</p></div>',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    // Realizar vinculación
    this.usuariosService.vincularPropietario(usuario.id, propietario.id).subscribe({
      next: (response) => {
        Swal.close();
        this.showSuccessToast('Vinculación creada exitosamente');
        this.close();
        this.vinculacionCreada.emit();
      },
      error: (error) => {
        console.error('Error vinculando:', error);
        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'No se pudo crear la vinculación',
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
      }
    });
  }

  // Método para obtener avatar de usuario
  getUsuarioAvatar(usuario: User): string {
    return this.usuariosService.getAvatarUrl(usuario.avatarUrl || null);
  }

  // Método para obtener avatar de propietario
  getPropietarioAvatar(propietario: Propietario): string {
    return this.propietariosService.getAvatarUrl(propietario.avatarUrl);
  }

  // Error en avatar
  onAvatarError(event: Event): void {
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
}
