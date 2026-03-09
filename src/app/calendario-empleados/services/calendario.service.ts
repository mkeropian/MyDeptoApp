// calendario-empleados/services/calendario.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ==================== INTERFACES ACTUALIZADAS ====================

export interface EventoCalendario {
  id?: number;
  idTipoCalendario: number;
  idTipoEventoCalendario: number;
  idDep?: number | null;
  idUser?: number | null;
  fecha_inicio: string; // formato YYYY-MM-DD
  fecha_fin?: string | null; // formato YYYY-MM-DD
  horaInicio: string; // formato HH:MM:SS o HH:MM
  horaFin: string; // formato HH:MM:SS o HH:MM
  observaciones?: string | null;
  // Campos nuevos para estadías
  nombre_huesped?: string | null;
  telefono_huesped?: string | null;
  email_huesped?: string | null;
  cantidad_personas?: number | null;
  monto?: number | null;
}

export interface EventoCalendarioExtendido {
  id: number;
  idTipoCalendario: number;
  descripcionTipoCalendario: string;
  idTipoEventoCalendario: number;
  descripcionTipoEventoCalendario: string;
  duracionMinutos: number;
  colorTipoEvento: string;
  idDepartamento: number;
  nombreDepartamento: string;
  idUsuario: number | null;
  codUsuario: string | null;
  nombreCompletoUsuario: string | null;
  fecha: string;
  fechaFin: string | null;
  horaInicio: string;
  horaFin: string;
  observaciones: string | null;
  // Campos nuevos
  nombreHuesped: string | null;
  telefonoHuesped: string | null;
  emailHuesped: string | null;
  cantidadPersonas: number | null;
  monto: string | null;
}

export interface TipoCalendario {
  id: number;
  descripcion: string;
  activo: number;
}

export interface TipoEventoCalendario {
  id: number;
  descripcion: string;
  duracionMinutos: number;
  color: string;
  activo: boolean;
  id_formulario?: number | null;
}

export interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Usuario {
  id: number;
  usuario: string;
  nombreCompleto: string;
  email: string;
  activo: boolean;
  roles?: string[];
}

export interface FiltrosCalendario {
  idUsuario?: number;
  idDepartamento?: number;
  fechaInicio?: string;
  fechaFin?: string;
  idsTipoCalendario?: number[];
}
export interface UsuarioRol {
  id: number;
  idrol: number;
  nombre: string;
  idUsuario: number;
  usuario: string;
  nombreCompleto: string;
}
export interface CalendarioUsuario {
  id: number;
  idCalendar: number;
  descCalendar: string;
  idUser: number;
  codUser: string;
  nameUser: string;
}
export interface Formulario {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}
export interface CampoFormulario {
  id: number;
  id_formulario: number;
  nombre_campo: string;
  tipo_campo: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'email' | 'tel' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder: string;
  requerido: boolean;
  orden: number;
  opciones: any | null;
  activo: boolean;
}
export interface FormularioCompleto extends Formulario {
  campos: CampoFormulario[];
}
export interface TipoCampoDisponible {
  id: number;
  codigo: string;
  nombre_display: string;
  icono: string;
  descripcion: string;
  activo: number;
}
export interface CampoFormularioDetalle {
  id?: number;
  id_formulario: number;
  nombre_campo: string;
  tipo_campo: string;
  label: string;
  placeholder: string;
  requerido: boolean;
  orden: number;
  opciones?: any;
  activo?: number;
}

export interface CampoCalendarDisponible {
  id: number;
  nombre_columna: string;
  tipo_dato: string;
  etiqueta_sugerida: string;
  icono: string;
  descripcion: string;
  es_obligatorio: number;
  categoria: string;
  orden_display: number;
  activo: number;
}

export type VistaCalendario = 'dia' | 'semana' | 'mes';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private apiUrl = `${environment.baseUrl}/calendar`;
  private usuariosUrl = `${environment.baseUrl}/usuarios`;
  private departamentosUrl = `${environment.baseUrl}/departamentos`;
  private formulariosUrl = `${environment.baseUrl}/formularios`;

  private eventosSubject = new BehaviorSubject<EventoCalendarioExtendido[]>([]);
  private cargandoSubject = new BehaviorSubject<boolean>(false);

  public eventos$ = this.eventosSubject.asObservable();
  public cargando$ = this.cargandoSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-token': token || ''
    });
  }

  // ==================== EVENTOS ====================

  obtenerEventosExtendidos(): Observable<EventoCalendarioExtendido[]> {
    this.cargandoSubject.next(true);

    return this.http.get<EventoCalendarioExtendido[]>(
      `${this.apiUrl}/allextendido`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(eventos => {
        this.eventosSubject.next(eventos);
        this.cargandoSubject.next(false);
      }),
      catchError(error => {
        this.cargandoSubject.next(false);
        console.error('Error al obtener eventos:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEventosPorUsuario(idUsuario: number): Observable<EventoCalendarioExtendido[]> {
    return this.http.get<EventoCalendarioExtendido[]>(
      `${this.apiUrl}/byUser/${idUsuario}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener eventos por usuario:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEventoPorId(id: number): Observable<EventoCalendarioExtendido> {
    return this.http.get<EventoCalendarioExtendido[]>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(eventos => eventos[0]),
      catchError(error => {
        console.error('Error al obtener evento:', error);
        return throwError(() => error);
      })
    );
  }

  crearEvento(evento: EventoCalendario): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(
      this.apiUrl,
      evento,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.obtenerEventosExtendidos().subscribe();
      }),
      catchError(error => {
        console.error('Error al crear evento:', error);
        return throwError(() => error);
      })
    );
  }

  actualizarEvento(id: number, evento: EventoCalendario): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.apiUrl}/${id}`,
      evento,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.obtenerEventosExtendidos().subscribe();
      }),
      catchError(error => {
        console.error('Error al actualizar evento:', error);
        return throwError(() => error);
      })
    );
  }

  eliminarEvento(id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.obtenerEventosExtendidos().subscribe();
      }),
      catchError(error => {
        console.error('Error al eliminar evento:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerTiposEventoCalendario(): Observable<TipoEventoCalendario[]> {
    return this.http.get<TipoEventoCalendario[]>(
      `${this.apiUrl}/tipos-evento`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener tipos de evento:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEventosPermitidosPorCalendario(idCalendario: number): Observable<TipoEventoCalendario[]> {
    return this.http.get<TipoEventoCalendario[]>(
      `${this.apiUrl}/calendarios/${idCalendario}/eventos-permitidos`
    );
  }

  // ==================== NUEVO: OBTENER FORMULARIO POR TIPO DE EVENTO ====================

  obtenerFormularioPorTipoEvento(idTipoEvento: number): Observable<FormularioCompleto | null> {
    return this.http.get<FormularioCompleto | null>(
      `${this.apiUrl}/tipos-evento/${idTipoEvento}/formulario`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener formulario por tipo de evento:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== USUARIOS ====================

  obtenerUsuariosActivos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.usuariosUrl}/allActives`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerRolesUsuarios(): Observable<UsuarioRol[]> {
    return this.http.get<UsuarioRol[]>(
      `${environment.baseUrl}/roles/getRolUser`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener roles de usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== CALENDARIOS POR USUARIO ====================

  obtenerCalendariosPorUsuario(idUsuario: number): Observable<CalendarioUsuario[]> {
    return this.http.get<CalendarioUsuario[]>(
      `${this.apiUrl}/calendariobyUser/${idUsuario}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener calendarios por usuario:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== DEPARTAMENTOS ====================

  obtenerDepartamentosActivos(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(
      `${this.departamentosUrl}/allActives`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener departamentos:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== UTILIDADES ====================

  formatearFechaParaBackend(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parsearFechaDesdeBackend(fechaString: string): Date {
    return new Date(fechaString);
  }

  filtrarEventos(eventos: EventoCalendarioExtendido[], filtros: FiltrosCalendario): EventoCalendarioExtendido[] {
    return eventos.filter(evento => {
      if (filtros.idUsuario && evento.idUsuario !== filtros.idUsuario) {
        return false;
      }

      if (filtros.idDepartamento && evento.idDepartamento !== filtros.idDepartamento) {
        return false;
      }

      if (filtros.idsTipoCalendario && filtros.idsTipoCalendario.length > 0) {
        if (!filtros.idsTipoCalendario.includes(evento.idTipoCalendario)) {
          return false;
        }
      }

      if (filtros.fechaInicio) {
        const fechaEvento = new Date(evento.fecha);
        const fechaInicio = new Date(filtros.fechaInicio);
        if (fechaEvento < fechaInicio) {
          return false;
        }
      }

      if (filtros.fechaFin) {
        const fechaEvento = new Date(evento.fecha);
        const fechaFin = new Date(filtros.fechaFin);
        if (fechaEvento > fechaFin) {
          return false;
        }
      }

      return true;
    });
  }

  limpiarCache(): void {
    this.eventosSubject.next([]);
  }

  // ==================== GESTIÓN DE TIPOS DE CALENDARIO ====================

  obtenerTiposCalendario(): Observable<TipoCalendario[]> {
    return this.http.get<TipoCalendario[]>(
      `${this.apiUrl}/tipos-calendario`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener tipos de calendario:', error);
        return throwError(() => error);
      })
    );
  }

  crearTipoCalendario(tipoCalendario: Partial<TipoCalendario>): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(
      `${this.apiUrl}/tipo-calendario`,
      tipoCalendario,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al crear tipo de calendario:', error);
        return throwError(() => error);
      })
    );
  }

  actualizarTipoCalendario(id: number, tipoCalendario: TipoCalendario): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.apiUrl}/tipo-calendario/${id}`,
      tipoCalendario,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar tipo de calendario:', error);
        return throwError(() => error);
      })
    );
  }

  eliminarTipoCalendario(id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(
      `${this.apiUrl}/tipo-calendario/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar tipo de calendario:', error);
        return throwError(() => error);
      })
    );
  }

  crearTipoEvento(tipoEvento: Partial<TipoEventoCalendario>): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(
      `${this.apiUrl}/tipo-evento`,
      tipoEvento,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al crear tipo de evento:', error);
        return throwError(() => error);
      })
    );
  }

  actualizarTipoEvento(id: number, tipoEvento: TipoEventoCalendario): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.apiUrl}/tipo-evento/${id}`,
      tipoEvento,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar tipo de evento:', error);
        return throwError(() => error);
      })
    );
  }

  eliminarTipoEvento(id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(
      `${this.apiUrl}/tipo-evento/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar tipo de evento:', error);
        return throwError(() => error);
      })
    );
  }

  asignarCalendarioAUsuario(idUsuario: number, idCalendario: number): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(
      `${this.apiUrl}/asignar-usuario-calendario`,
      { idUsuario, idCalendario },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al asignar calendario a usuario:', error);
        return throwError(() => error);
      })
    );
  }

  revocarCalendarioDeUsuario(id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(
      `${this.apiUrl}/revocar-usuario-calendario/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al revocar calendario de usuario:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== EXPORTACIÓN DE CALENDARIO ====================

  descargarCalendario(
    filtros: FiltrosCalendario,
    tipoArchivo: 'excel' | 'excel_timeline' | 'pdf' | 'imagen',
    userRole: string,
    userId: number,
    subtipoImagen?: 'lista' | 'calendario' | 'resumen'
  ): Observable<Blob> {
    const url = `${this.apiUrl}/export`;

    const body = {
      filtros,
      tipoArchivo,
      subtipoImagen,
      userRole,
      userId
    };

    return this.http.post(url, body, {
      responseType: 'blob',
      observe: 'response',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(response => {
        const blob = response.body;

        if (!blob || blob.size === 0) {
          throw new Error('No se recibieron datos del servidor');
        }

        if (blob.type === 'application/json') {
          throw new Error('CORRUPT_BLOB_FOR_JSON_ERROR');
        }

        return blob;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al descargar calendario:', error);

        if (error.error instanceof Blob && error.error.type === 'application/json') {
          return new Observable<never>(observer => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorResponse = JSON.parse(reader.result as string);
                observer.error(new Error(errorResponse.msg || 'Error desconocido'));
              } catch (e) {
                observer.error(new Error('Error al procesar respuesta del servidor'));
              }
            };
            reader.readAsText(error.error);
          });
        }

        const errorMessage = error.error?.msg || error.message || 'Error desconocido al descargar';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  downloadFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  enviarCalendarioPorEmail(
    filtros: FiltrosCalendario,
    tipoArchivo: 'excel' | 'excel_timeline' | 'pdf' | 'imagen',
    emailDestino: string,
    userRole: string,
    userId: number,
    subtipoImagen?: 'lista' | 'calendario' | 'resumen'
  ): Observable<any> {
    const url = `${this.apiUrl}/send-email`;

    const body = {
      filtros,
      tipoArchivo,
      subtipoImagen,
      emailDestino,
      userRole,
      userId
    };

    return this.http.post<any>(url, body, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('Email enviado:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al enviar email:', error);

        let errorMessage = 'Error al enviar calendario por email';

        if (error.error?.msg) {
          errorMessage = error.error.msg;
        } else if (error.message) {
          errorMessage = error.message;
        }

        return throwError(() => ({
          message: errorMessage,
          detalle: error.error?.detalle || error.message
        }));
      })
    );
  }

  // ==================== NUEVO: GESTIÓN DE FORMULARIOS ====================

  /**
   * Obtener todos los formularios
   */
  obtenerFormularios(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.formulariosUrl}/all`
    );
  }

  /**
   * Obtener formularios activos
   */
  obtenerFormulariosActivos(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.formulariosUrl}/activos`
    );
  }

  /**
   * Crear un nuevo formulario
   */
  crearFormulario(formulario: any): Observable<any> {
    return this.http.post(
      this.formulariosUrl,
      formulario
    );
  }

  /**
   * Actualizar un formulario existente
   */
  actualizarFormulario(id: number, formulario: any): Observable<any> {
    return this.http.put(
      `${this.formulariosUrl}/${id}`,
      formulario
    );
  }

  /**
   * Reactivar un formulario
   */
  reactivarFormulario(id: number): Observable<any> {
    return this.http.post(
      `${this.formulariosUrl}/${id}/reactivar`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar (desactivar) un formulario
   */
  eliminarFormulario(id: number): Observable<any> {
    return this.http.delete(
      `${this.formulariosUrl}/${id}`
    );
  }

  obtenerFormularioCompleto(idFormulario: number): Observable<FormularioCompleto> {
    return this.http.get<FormularioCompleto>(
      `${this.formulariosUrl}/${idFormulario}/completo`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener formulario completo:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== TIPOS DE CAMPO DISPONIBLES ====================

  /**
   * Obtener tipos de campo disponibles para formularios
   */
  obtenerTiposCampoDisponibles(): Observable<TipoCampoDisponible[]> {
    return this.http.get<TipoCampoDisponible[]>(
      `${this.formulariosUrl}/tipos-campo`
    );
  }

  /**
   * Obtener campos disponibles de la tabla calendar
   */
  obtenerCamposCalendarDisponibles(): Observable<CampoCalendarDisponible[]> {
    return this.http.get<CampoCalendarDisponible[]>(
      `${this.formulariosUrl}/campos-calendar-disponibles`,
      { headers: this.getHeaders() }
    );
  }

  // ==================== GESTIÓN DE CAMPOS DE FORMULARIO ====================

  /**
   * Crear un nuevo campo en un formulario
   */
  crearCampoFormulario(campo: CampoFormularioDetalle): Observable<any> {
    return this.http.post(
      `${this.formulariosUrl}/campos`,
      campo
    );
  }

  /**
   * Actualizar un campo existente
   */
  actualizarCampoFormulario(idCampo: number, campo: CampoFormularioDetalle): Observable<any> {
    return this.http.put(
      `${this.formulariosUrl}/campos/${idCampo}`,
      campo
    );
  }

  /**
   * Eliminar (desactivar) un campo
   */
  eliminarCampoFormulario(idCampo: number): Observable<any> {
    return this.http.delete(
      `${this.formulariosUrl}/campos/${idCampo}`
    );
  }

  /**
   * Obtener campos de un formulario específico
   */
  obtenerCamposFormulario(idFormulario: number): Observable<CampoFormulario[]> {
    return this.http.get<CampoFormulario[]>(
      `${this.formulariosUrl}/${idFormulario}/campos`
    );
  }

  // ==================== VINCULACIÓN EVENTOS-CALENDARIOS ====================

  /**
   * Obtener calendarios donde está permitido un evento
   */
  obtenerCalendariosPermitidosPorEvento(idEvento: number): Observable<TipoCalendario[]> {
    return this.http.get<TipoCalendario[]>(
      `${this.apiUrl}/eventos/${idEvento}/calendarios-permitidos`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Asignar evento a múltiples calendarios
   */
  asignarEventoACalendarios(idEvento: number, idsCalendarios: number[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/eventos/asignar-calendarios`,
      { idEvento, idsCalendarios },
      { headers: this.getHeaders() }
    );
  }

}
