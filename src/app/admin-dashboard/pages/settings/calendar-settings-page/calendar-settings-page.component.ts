import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarioService, CalendarioUsuario, TipoCalendario, TipoEventoCalendario, Usuario } from '../../../../calendario-empleados/services/calendario.service';


interface PermisoUsuario {
  id: number;
  idCalendario: number;
  idUsuario: number;
  nombreUsuario: string;
  nombreCalendario: string;
}

type TabType = 'calendars' | 'events' | 'permissions';

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
    activo: true
  };
  showEventForm = false;

  // Estados para permisos de usuario
  userPermissions: PermisoUsuario[] = [];
  showPermissionForm = false;
  newPermission = { idCalendario: 0, idUsuario: 0 };
  users: Usuario[] = [];

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private calendarioService: CalendarioService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // PRIMERO: Cargar usuarios y calendarios
      await Promise.all([
        this.cargarTiposCalendario(),
        this.cargarTiposEvento(),
        this.cargarUsuarios()
      ]);

      // DESPUÉS: Cargar permisos (necesita que users ya esté cargado)
      await this.cargarPermisos();

    } catch (error) {
      console.error('Error al cargar datos:', error);
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
          const index = this.eventTypes.findIndex(e => e.id === this.editingEvent!.id);
          if (index !== -1) {
            this.eventTypes[index] = { ...this.editingEvent! };
          }
          this.editingEvent = null;
          this.showSuccess('Tipo de evento actualizado correctamente');
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
          this.eventTypes.push({
            id: response.id,
            descripcion: this.newEvent.descripcion!,
            duracionMinutos: this.newEvent.duracionMinutos ?? 60,
            color: this.newEvent.color ?? '#6366f1',
            activo: this.newEvent.activo ?? true
          });
          this.newEvent = { descripcion: '', duracionMinutos: 60, color: '#6366f1', activo: true };
          this.showEventForm = false;
          this.showSuccess('Tipo de evento creado correctamente');
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
  }

  cancelNewEvent(): void {
    this.showEventForm = false;
    this.newEvent = { descripcion: '', duracionMinutos: 60, color: '#6366f1', activo: true };
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
    if (!this.newPermission.idUsuario || !this.newPermission.idCalendario) {
      this.showError('Por favor seleccione un usuario y un calendario');
      return;
    }

    const usuario = this.users.find(u => u.id === this.newPermission.idUsuario);
    const calendario = this.calendarTypes.find(c => c.id === this.newPermission.idCalendario);

    if (!usuario || !calendario) {
      this.showError('Usuario o calendario no encontrado');
      return;
    }

    // Verificar si ya existe el permiso
    const exists = this.userPermissions.some(p =>
      p.idUsuario === usuario.id && p.idCalendario === calendario.id
    );

    if (exists) {
      this.showError('Este usuario ya tiene acceso a este calendario');
      return;
    }

    this.calendarioService.asignarCalendarioAUsuario(this.newPermission.idUsuario, this.newPermission.idCalendario).subscribe({
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
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  private showError(message: string): void {
    this.error = message;
    this.successMessage = null;
    setTimeout(() => {
      this.error = null;
    }, 5000);
  }

  startEditCalendar(calendar: TipoCalendario): void {
    this.editingCalendar = { ...calendar };
  }

  startEditEvent(event: TipoEventoCalendario): void {
    this.editingEvent = { ...event };
  }

}
