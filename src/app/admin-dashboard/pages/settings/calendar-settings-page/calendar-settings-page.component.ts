import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarioService, CalendarioUsuario, TipoCalendario, TipoEventoCalendario, Usuario, TipoCampoDisponible, CampoFormularioDetalle } from '../../../../calendario-empleados/services/calendario.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import Swal from 'sweetalert2';

interface PermisoUsuario {
  id: number;
  idCalendario: number;
  idUsuario: number;
  nombreUsuario: string;
  nombreCalendario: string;
}

interface Formulario {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  cantidadCampos?: number;
}

type TabType = 'calendars' | 'events' | 'forms' | 'permissions';

@Component({
  selector: 'app-calendar-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-settings-page.component.html',
  styleUrls: ['./calendar-settings-page.component.css']
})
export class CalendarSettingsPageComponent implements OnInit {
  activeTab: TabType = 'calendars';

  // Estados para tipos de calendario
  calendarTypes: TipoCalendario[] = [];
  editingCalendar: TipoCalendario | null = null;
  newCalendar: Partial<TipoCalendario> = { descripcion: '', activo: true };
  showCalendarForm = false;

  // Estados para tipos de evento
  eventTypes: TipoEventoCalendario[] = [];
  editingEvent: TipoEventoCalendario | null = null;
  newEvent: Partial<TipoEventoCalendario> = {
    descripcion: '',
    duracionMinutos: 60,
    color: '#6366f1',
    activo: true,
    id_formulario: null
  };
  showEventForm = false;

  // Estados para permisos de usuario
  userPermissions: PermisoUsuario[] = [];
  showPermissionForm = false;
  newPermission = { idCalendario: 0, idUsuario: 0 };
  users: Usuario[] = [];

  // Estados para formularios
  formularios: Formulario[] = [];
  editingFormulario: Formulario | null = null;
  newFormulario: Partial<Formulario> = { nombre: '', descripcion: '', activo: true };
  showFormularioForm = false;

  // Propiedades computadas para formularios
  get formularioNombre(): string {
    return this.editingFormulario ? this.editingFormulario.nombre : this.newFormulario.nombre || '';
  }
  set formularioNombre(value: string) {
    if (this.editingFormulario) {
      this.editingFormulario.nombre = value;
    } else {
      this.newFormulario.nombre = value;
    }
  }

  get formularioDescripcion(): string {
    return this.editingFormulario ? this.editingFormulario.descripcion : this.newFormulario.descripcion || '';
  }
  set formularioDescripcion(value: string) {
    if (this.editingFormulario) {
      this.editingFormulario.descripcion = value;
    } else {
      this.newFormulario.descripcion = value;
    }
  }

  get formularioActivo(): boolean {
    return this.editingFormulario ? this.editingFormulario.activo : this.newFormulario.activo ?? true;
  }
  set formularioActivo(value: boolean) {
    if (this.editingFormulario) {
      this.editingFormulario.activo = value;
    } else {
      this.newFormulario.activo = value;
    }
  }

  toggleCalendario(idCalendario: number): void {
    const index = this.calendariosSeleccionados.indexOf(idCalendario);
    if (index > -1) {
      this.calendariosSeleccionados.splice(index, 1);
    } else {
      this.calendariosSeleccionados.push(idCalendario);
    }
  }

  isCalendarioSeleccionado(idCalendario: number): boolean {
    return this.calendariosSeleccionados.includes(idCalendario);
  }

  // Estados para tipos de campo y gestión de campos
  tiposCampoDisponibles: TipoCampoDisponible[] = [];
  formularioSeleccionado: Formulario | null = null;
  camposFormulario: CampoFormularioDetalle[] = [];
  editingCampo: CampoFormularioDetalle | null = null;
  newCampo: Partial<CampoFormularioDetalle> = {};
  showCampoForm = false;
  showCamposManager = false;

  calendariosSeleccionados: number[] = [];

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private calendarioService: CalendarioService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      console.log('🔵 Iniciando carga de datos...');

      // PRIMERO: Cargar usuarios, calendarios, formularios y tipos de campo
      await Promise.all([
        this.cargarTiposCalendario().catch(err => {
          console.error('❌ Error en cargarTiposCalendario:', err);
          throw err;
        }),
        this.cargarTiposEvento().catch(err => {
          console.error('❌ Error en cargarTiposEvento:', err);
          throw err;
        }),
        this.cargarUsuarios().catch(err => {
          console.error('❌ Error en cargarUsuarios:', err);
          throw err;
        }),
        this.cargarFormularios().catch(err => {
          console.error('❌ Error en cargarFormularios:', err);
          throw err;
        }),
        this.cargarTiposCampoDisponibles().catch(err => {
          console.error('❌ Error en cargarTiposCampoDisponibles:', err);
          throw err;
        })
      ]);

      console.log('🟢 Datos base cargados correctamente');

      // DESPUÉS: Cargar permisos (necesita que users ya esté cargado)
      await this.cargarPermisos();

      console.log('🟢 Todos los datos cargados correctamente');

    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      this.error = 'Error al cargar la configuración. Por favor, intente nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  // ==================== TIPOS DE CALENDARIO ====================

  async cargarTiposCalendario(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.calendarioService.obtenerTiposCalendario().subscribe({
        next: (tipos) => {
          this.calendarTypes = tipos;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar tipos de calendario:', error);
          reject(error);
        }
      });
    });
  }

  handleSaveCalendar(): void {
    if (this.editingCalendar) {
      // Actualizar calendario existente
      this.calendarioService.actualizarTipoCalendario(this.editingCalendar.id, this.editingCalendar).subscribe({
        next: () => {
          const index = this.calendarTypes.findIndex(c => c.id === this.editingCalendar!.id);
          if (index !== -1) {
            this.calendarTypes[index] = { ...this.editingCalendar! };
          }
          this.editingCalendar = null;
          this.showSuccess('Tipo de calendario actualizado correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar calendario:', error);
          this.showError('Error al actualizar el tipo de calendario');
        }
      });
    } else {
      // Crear nuevo calendario
      if (!this.newCalendar.descripcion) {
        this.showError('La descripción es requerida');
        return;
      }

      this.calendarioService.crearTipoCalendario(this.newCalendar as TipoCalendario).subscribe({
        next: (response) => {
          this.calendarTypes.push({
            id: response.id,
            descripcion: this.newCalendar.descripcion!,
            activo: this.newCalendar.activo ?? true
          });
          this.newCalendar = { descripcion: '', activo: true };
          this.showCalendarForm = false;
          this.showSuccess('Tipo de calendario creado correctamente');
        },
        error: (error) => {
          console.error('Error al crear calendario:', error);
          this.showError('Error al crear el tipo de calendario');
        }
      });
    }
  }

  handleDeleteCalendar(id: number): void {
    if (!confirm('¿Está seguro de desactivar este tipo de calendario? Los eventos existentes seguirán asociados a este tipo.')) {
      return;
    }

    this.calendarioService.eliminarTipoCalendario(id).subscribe({
      next: () => {
        // Actualizar el estado local a inactivo en lugar de eliminarlo del array
        const index = this.calendarTypes.findIndex(c => c.id === id);
        if (index !== -1) {
          this.calendarTypes[index].activo = false;
        }
        this.showSuccess('Tipo de calendario desactivado correctamente');
      },
      error: (error) => {
        console.error('Error al desactivar calendario:', error);
        this.showError('Error al desactivar el tipo de calendario');
      }
    });
  }

  cancelEditCalendar(): void {
    this.editingCalendar = null;
  }

  cancelNewCalendar(): void {
    this.showCalendarForm = false;
    this.newCalendar = { descripcion: '', activo: true };
  }

  // ==================== TIPOS DE EVENTO ====================

  async cargarTiposEvento(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.calendarioService.obtenerTiposEventoCalendario().subscribe({
        next: (tipos) => {
          this.eventTypes = tipos;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar tipos de evento:', error);
          reject(error);
        }
      });
    });
  }

  handleSaveEvent(): void {
    if (this.editingEvent) {
      // Actualizar evento existente
      this.calendarioService.actualizarTipoEvento(this.editingEvent.id, this.editingEvent).subscribe({
        next: () => {
          // Actualizar vinculaciones con calendarios
          this.calendarioService.asignarEventoACalendarios(
            this.editingEvent!.id,
            this.calendariosSeleccionados
          ).subscribe({
            next: () => {
              const index = this.eventTypes.findIndex(e => e.id === this.editingEvent!.id);
              if (index !== -1) {
                this.eventTypes[index] = { ...this.editingEvent! };
              }
              this.editingEvent = null;
              this.calendariosSeleccionados = [];
              this.showSuccess('Tipo de evento actualizado correctamente');
            },
            error: (error) => {
              console.error('Error al actualizar vinculaciones:', error);
              this.showError('Evento actualizado pero error al vincular calendarios');
            }
          });
        },
        error: (error) => {
          console.error('Error al actualizar evento:', error);
          this.showError('Error al actualizar el tipo de evento');
        }
      });
    } else {
      // Crear nuevo evento
      if (!this.newEvent.descripcion) {
        this.showError('La descripción es requerida');
        return;
      }

      this.calendarioService.crearTipoEvento(this.newEvent as TipoEventoCalendario).subscribe({
        next: (response) => {
          // Asignar vinculaciones con calendarios
          this.calendarioService.asignarEventoACalendarios(
            response.id,
            this.calendariosSeleccionados
          ).subscribe({
            next: () => {
              this.eventTypes.push({
                id: response.id,
                descripcion: this.newEvent.descripcion!,
                duracionMinutos: this.newEvent.duracionMinutos ?? 60,
                color: this.newEvent.color ?? '#6366f1',
                activo: this.newEvent.activo ?? true,
                id_formulario: this.newEvent.id_formulario ?? null
              });
              this.newEvent = { descripcion: '', duracionMinutos: 60, color: '#6366f1', activo: true, id_formulario: null };
              this.calendariosSeleccionados = [];
              this.showEventForm = false;
              this.showSuccess('Tipo de evento creado correctamente');
            },
            error: (error) => {
              console.error('Error al vincular calendarios:', error);
              this.showError('Evento creado pero error al vincular calendarios');
            }
          });
        },
        error: (error) => {
          console.error('Error al crear evento:', error);
          this.showError('Error al crear el tipo de evento');
        }
      });
    }
  }

  handleDeleteEvent(id: number): void {
    if (!confirm('¿Está seguro de desactivar este tipo de evento? Los eventos existentes seguirán asociados a este tipo.')) {
      return;
    }

    this.calendarioService.eliminarTipoEvento(id).subscribe({
      next: () => {
        // Actualizar el estado local a inactivo en lugar de eliminarlo del array
        const index = this.eventTypes.findIndex(e => e.id === id);
        if (index !== -1) {
          this.eventTypes[index].activo = false;
        }
        this.showSuccess('Tipo de evento desactivado correctamente');
      },
      error: (error) => {
        console.error('Error al desactivar evento:', error);
        this.showError('Error al desactivar el tipo de evento');
      }
    });
  }

  cancelEditEvent(): void {
    this.editingEvent = null;
    this.calendariosSeleccionados = [];
  }

  cancelNewEvent(): void {
    this.showEventForm = false;
    this.newEvent = { descripcion: '', duracionMinutos: 60, color: '#6366f1', activo: true };
    this.calendariosSeleccionados = [];
  }

  // ==================== PERMISOS DE USUARIO ====================

  async cargarUsuarios(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.calendarioService.obtenerUsuariosActivos().subscribe({
        next: (usuarios) => {
          this.users = usuarios;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          reject(error);
        }
      });
    });
  }

  async cargarPermisos(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.users.length === 0) {
        console.warn('No hay usuarios cargados aún');
        resolve();
        return;
      }

      // Cargar permisos de todos los usuarios
      const permisosPromises = this.users.map(user =>
        this.calendarioService.obtenerCalendariosPorUsuario(user.id).toPromise()
      );

      Promise.all(permisosPromises).then((resultados) => {
        this.userPermissions = [];
        resultados.forEach((calendarios) => {
          if (calendarios) {
            calendarios.forEach((cal: CalendarioUsuario) => {
              this.userPermissions.push({
                id: cal.id,
                idCalendario: cal.idCalendar,
                idUsuario: cal.idUser,
                nombreUsuario: cal.nameUser,
                nombreCalendario: cal.descCalendar
              });
            });
          }
        });
        resolve();
      }).catch(error => {
        console.error('Error al cargar permisos:', error);
        reject(error);
      });
    });
  }

  handleSavePermission(): void {
    // ✅ Convertir a números PRIMERO
    const idUsuario = Number(this.newPermission.idUsuario);
    const idCalendario = Number(this.newPermission.idCalendario);

    if (!idUsuario || !idCalendario) {
      this.showError('Por favor seleccione un usuario y un calendario');
      return;
    }

    const usuario = this.users.find(u => u.id === idUsuario);
    const calendario = this.calendarTypes.find(c => c.id === idCalendario);

    if (!usuario || !calendario) {
      this.showError('Usuario o calendario no encontrado');
      return;
    }

    // Verificar si ya existe el permiso
    const exists = this.userPermissions.some(p =>
      p.idUsuario === idUsuario && p.idCalendario === idCalendario
    );

    if (exists) {
      this.showError('Este usuario ya tiene acceso a este calendario');
      return;
    }

    // ✅ Usar los valores convertidos
    this.calendarioService.asignarCalendarioAUsuario(idUsuario, idCalendario).subscribe({
      next: (response) => {
        this.userPermissions.push({
          id: response.id,
          idCalendario: calendario.id,
          idUsuario: usuario.id,
          nombreUsuario: usuario.nombreCompleto,
          nombreCalendario: calendario.descripcion
        });

        this.newPermission = { idCalendario: 0, idUsuario: 0 };
        this.showPermissionForm = false;
        this.showSuccess('Permiso asignado correctamente');
      },
      error: (error) => {
        console.error('Error al asignar permiso:', error);
        this.showError('Error al asignar el permiso');
      }
    });
  }

  handleDeletePermission(id: number): void {
    if (!confirm('¿Está seguro de revocar este permiso?')) {
      return;
    }

    this.calendarioService.revocarCalendarioDeUsuario(id).subscribe({
      next: () => {
        this.userPermissions = this.userPermissions.filter(p => p.id !== id);
        this.showSuccess('Permiso revocado correctamente');
      },
      error: (error) => {
        console.error('Error al revocar permiso:', error);
        this.showError('Error al revocar el permiso');
      }
    });
  }

  cancelNewPermission(): void {
    this.showPermissionForm = false;
    this.newPermission = { idCalendario: 0, idUsuario: 0 };
  }

  // ==================== UTILIDADES ====================

  getCalendariosPorUsuario(userId: number): string[] {
    return this.userPermissions
      .filter(p => p.idUsuario === userId)
      .map(p => p.nombreCalendario);
  }

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.error = null;
    // También mostrar toast unificado
    this.notificationService.mostrarNotificacion(message, 'success');
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  private showError(message: string): void {
    this.error = message;
    this.successMessage = null;
    // También mostrar toast unificado
    this.notificationService.mostrarNotificacion(message, 'error');
    setTimeout(() => {
      this.error = null;
    }, 5000);
  }

  startEditCalendar(calendar: TipoCalendario): void {
    this.editingCalendar = { ...calendar };
  }

  startEditEvent(event: TipoEventoCalendario): void {
    this.editingEvent = { ...event };
    this.showEventForm = true;


    // Cargar calendarios permitidos para este evento
    this.calendarioService.obtenerCalendariosPermitidosPorEvento(event.id).subscribe({
      next: (calendarios) => {
        this.calendariosSeleccionados = calendarios.map(c => c.id);
      },
      error: (error) => {
        console.error('Error al cargar calendarios del evento:', error);
        this.calendariosSeleccionados = [];
      }
    });
  }

  // ==================== FORMULARIOS ====================

  async cargarFormularios(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.calendarioService.obtenerFormularios().subscribe({
        next: async (formularios) => {
          // Cargar cantidad de campos para cada formulario
          const formulariosConCampos = await Promise.all(
            formularios.map(async (form) => {
              try {
                const campos = await this.calendarioService.obtenerCamposFormulario(form.id).toPromise();
                return {
                  ...form,
                  cantidadCampos: campos ? campos.length : 0
                };
              } catch (error) {
                console.error(`Error al cargar campos del formulario ${form.id}:`, error);
                return { ...form, cantidadCampos: 0 };
              }
            })
          );
          this.formularios = formulariosConCampos;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar formularios:', error);
          reject(error);
        }
      });
    });
  }

  async cargarTiposCampoDisponibles(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.calendarioService.obtenerTiposCampoDisponibles().subscribe({
        next: (tipos) => {
          this.tiposCampoDisponibles = tipos;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar tipos de campo:', error);
          reject(error);
        }
      });
    });
  }

  handleSaveFormulario(): void {
    if (this.editingFormulario) {
      // Actualizar formulario existente
      this.calendarioService.actualizarFormulario(this.editingFormulario.id, this.editingFormulario).subscribe({
        next: () => {
          const index = this.formularios.findIndex(f => f.id === this.editingFormulario!.id);
          if (index !== -1) {
            this.formularios[index] = { ...this.editingFormulario! };
          }
          this.editingFormulario = null;
          this.showSuccess('Formulario actualizado correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar formulario:', error);
          this.showError('Error al actualizar el formulario');
        }
      });
    } else {
      // Crear nuevo formulario
      if (!this.newFormulario.nombre) {
        this.showError('El nombre es requerido');
        return;
      }

      this.calendarioService.crearFormulario(this.newFormulario as any).subscribe({
        next: (response) => {
          this.formularios.push({
            id: response.id,
            nombre: this.newFormulario.nombre!,
            descripcion: this.newFormulario.descripcion || '',
            activo: this.newFormulario.activo ?? true,
            cantidadCampos: 0
          });
          this.newFormulario = { nombre: '', descripcion: '', activo: true };
          this.showFormularioForm = false;
          this.showSuccess('Formulario creado correctamente');
        },
        error: (error) => {
          console.error('Error al crear formulario:', error);
          this.showError('Error al crear el formulario');
        }
      });
    }
  }

  async handleDeleteFormulario(id: number): Promise<void> {
    const result = await Swal.fire({
      title: '¿Está seguro de desactivar este formulario?',
      text: 'Los eventos que lo usan seguirán funcionando.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.calendarioService.eliminarFormulario(id).subscribe({
      next: () => {
        const index = this.formularios.findIndex(f => f.id === id);
        if (index !== -1) {
          this.formularios[index].activo = false;
        }
        this.showSuccess('Formulario desactivado correctamente');
      },
      error: (error) => {
        console.error('Error al desactivar formulario:', error);
        this.showError('Error al desactivar el formulario');
      }
    });
  }

  async handleReactivarFormulario(id: number): Promise<void> {
    const result = await Swal.fire({
      title: '¿Está seguro de reactivar este formulario?',
      text: 'Volverá a estar disponible para asignar a eventos.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.calendarioService.reactivarFormulario(id).subscribe({
      next: () => {
        const index = this.formularios.findIndex(f => f.id === id);
        if (index !== -1) {
          this.formularios[index].activo = true;
        }
        this.showSuccess('Formulario reactivado correctamente');
      },
      error: (error) => {
        console.error('Error al reactivar formulario:', error);
        this.showError('Error al reactivar el formulario');
      }
    });
  }

  startEditFormulario(formulario: Formulario): void {
    this.editingFormulario = { ...formulario };
    this.showFormularioForm = true;
  }

  cancelEditFormulario(): void {
    this.editingFormulario = null;
    this.showFormularioForm = false;
  }

  cancelNewFormulario(): void {
    this.showFormularioForm = false;
    this.newFormulario = { nombre: '', descripcion: '', activo: true };
  }

  // ==================== GESTIÓN DE CAMPOS DEL FORMULARIO ====================

  abrirGestionCampos(formulario: Formulario): void {
    this.formularioSeleccionado = formulario;
    this.showCamposManager = true;
    this.cargarCamposFormulario(formulario.id);
  }

  cerrarGestionCampos(): void {
    this.showCamposManager = false;
    this.formularioSeleccionado = null;
    this.camposFormulario = [];
    this.editingCampo = null;
    this.newCampo = {};
    this.showCampoForm = false;
  }

  cargarCamposFormulario(idFormulario: number): void {
    this.calendarioService.obtenerCamposFormulario(idFormulario).subscribe({
      next: (campos) => {
        this.camposFormulario = campos as any[];
      },
      error: (error) => {
        console.error('Error al cargar campos:', error);
        this.showError('Error al cargar los campos del formulario');
      }
    });
  }

  seleccionarTipoCampo(tipo: TipoCampoDisponible): void {
    this.newCampo = {
      id_formulario: this.formularioSeleccionado!.id,
      nombre_campo: '',
      tipo_campo: tipo.codigo,
      label: '',
      placeholder: '',
      requerido: false,
      orden: this.camposFormulario.length + 1,
      opciones: tipo.codigo === 'select' || tipo.codigo === 'radio' ? [] : undefined
    };
    this.showCampoForm = true;
  }

  handleSaveCampo(): void {
    if (!this.newCampo.nombre_campo || !this.newCampo.label) {
      this.showError('Nombre de campo y etiqueta son requeridos');
      return;
    }

    if (this.editingCampo) {
      // Actualizar campo existente
      this.calendarioService.actualizarCampoFormulario(this.editingCampo.id!, this.newCampo as any).subscribe({
        next: () => {
          this.cargarCamposFormulario(this.formularioSeleccionado!.id);
          this.showCampoForm = false;
          this.editingCampo = null;
          this.newCampo = {};
          this.showSuccess('Campo actualizado correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar campo:', error);
          this.showError('Error al actualizar el campo');
        }
      });
    } else {
      // Crear nuevo campo
      this.calendarioService.crearCampoFormulario(this.newCampo as any).subscribe({
        next: () => {
          this.cargarCamposFormulario(this.formularioSeleccionado!.id);
          this.showCampoForm = false;
          this.newCampo = {};
          this.showSuccess('Campo agregado correctamente');

          // Actualizar contador de campos
          const form = this.formularios.find(f => f.id === this.formularioSeleccionado!.id);
          if (form) {
            form.cantidadCampos = (form.cantidadCampos || 0) + 1;
          }
        },
        error: (error) => {
          console.error('Error al crear campo:', error);
          this.showError('Error al agregar el campo');
        }
      });
    }
  }

  startEditCampo(campo: CampoFormularioDetalle): void {
    this.editingCampo = { ...campo };
    this.newCampo = { ...campo };
    this.showCampoForm = true;
  }

  handleDeleteCampo(idCampo: number): void {
    if (!confirm('¿Está seguro de eliminar este campo?')) {
      return;
    }

    this.calendarioService.eliminarCampoFormulario(idCampo).subscribe({
      next: () => {
        this.cargarCamposFormulario(this.formularioSeleccionado!.id);
        this.showSuccess('Campo eliminado correctamente');

        // Actualizar contador de campos
        const form = this.formularios.find(f => f.id === this.formularioSeleccionado!.id);
        if (form && form.cantidadCampos) {
          form.cantidadCampos--;
        }
      },
      error: (error) => {
        console.error('Error al eliminar campo:', error);
        this.showError('Error al eliminar el campo');
      }
    });
  }

  cancelNewCampo(): void {
    this.showCampoForm = false;
    this.editingCampo = null;
    this.newCampo = {};
  }

  getTipoCampoNombre(codigo: string): string {
    const tipo = this.tiposCampoDisponibles.find(t => t.codigo === codigo);
    return tipo ? tipo.nombre_display : codigo;
  }

  getNombreFormulario(idFormulario: number): string {
    const formulario = this.formularios.find(f => f.id === idFormulario);
    return formulario ? formulario.nombre : 'Desconocido';
  }

  // Propiedades computadas para eventos (crear/editar)
  get eventoDescripcion(): string {
    return this.editingEvent ? this.editingEvent.descripcion : this.newEvent.descripcion || '';
  }
  set eventoDescripcion(value: string) {
    if (this.editingEvent) {
      this.editingEvent.descripcion = value;
    } else {
      this.newEvent.descripcion = value;
    }
  }

  get eventoDuracion(): number {
    return this.editingEvent ? this.editingEvent.duracionMinutos : this.newEvent.duracionMinutos || 60;
  }
  set eventoDuracion(value: number) {
    if (this.editingEvent) {
      this.editingEvent.duracionMinutos = value;
    } else {
      this.newEvent.duracionMinutos = value;
    }
  }

  get eventoColor(): string {
    return this.editingEvent ? this.editingEvent.color : this.newEvent.color || '#6366f1';
  }
  set eventoColor(value: string) {
    if (this.editingEvent) {
      this.editingEvent.color = value;
    } else {
      this.newEvent.color = value;
    }
  }

  get eventoFormulario(): number | null {
    return this.editingEvent ? (this.editingEvent.id_formulario ?? null) : (this.newEvent.id_formulario ?? null);
  }
  set eventoFormulario(value: number | null) {
    if (this.editingEvent) {
      this.editingEvent.id_formulario = value;
    } else {
      this.newEvent.id_formulario = value;
    }
  }

  get eventoActivo(): boolean {
    return this.editingEvent ? this.editingEvent.activo : (this.newEvent.activo ?? true);
  }
  set eventoActivo(value: boolean) {
    if (this.editingEvent) {
      this.editingEvent.activo = value;
    } else {
      this.newEvent.activo = value;
    }
  }

}
