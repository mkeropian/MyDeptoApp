import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces alineadas con el backend
export interface EventoCalendario {
  id?: number;
  idTipoCalendario: number;
  idTipoEventoCalendario: number;
  idDep: number;
  idUser: number;
  fecha: string; // formato YYYY-MM-DD
  horaInicio: string; // formato HH:MM:SS o HH:MM
  horaFin: string; // formato HH:MM:SS o HH:MM
  observaciones?: string;
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
  idUsuario: number;
  codUsuario: string;
  nombreCompletoUsuario: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  observaciones: string;
}

export interface TipoCalendario {
  id: number;
  descripcion: string;
  activo: boolean;
}

export interface TipoEventoCalendario {
  id: number;
  descripcion: string;
  duracionMinutos: number;
  color: string;
  activo: boolean;
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

export type VistaCalendario = 'dia' | 'semana' | 'mes';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private apiUrl = `${environment.baseUrl}/calendar`;
  private usuariosUrl = `${environment.baseUrl}/usuarios`;
  private departamentosUrl = `${environment.baseUrl}/departamentos`;

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


// ==================== FILTROS ====================

  filtrarEventos(
    eventos: EventoCalendarioExtendido[],
    filtros: FiltrosCalendario
  ): EventoCalendarioExtendido[] {
    let eventosFiltrados = [...eventos];

    // ✅ NUEVO - Filtrar por tipos de calendario permitidos
    if (filtros.idsTipoCalendario && filtros.idsTipoCalendario.length > 0) {
      eventosFiltrados = eventosFiltrados.filter(
        evento => filtros.idsTipoCalendario!.includes(evento.idTipoCalendario)
      );
    }

    if (filtros.idUsuario) {
      eventosFiltrados = eventosFiltrados.filter(
        evento => Number(evento.idUsuario) === Number(filtros.idUsuario)
      );
    }

    if (filtros.idDepartamento) {
      eventosFiltrados = eventosFiltrados.filter(
        evento => Number(evento.idDepartamento) === Number(filtros.idDepartamento)
      );
    }

    if (filtros.fechaInicio) {
      eventosFiltrados = eventosFiltrados.filter(evento => {
        const fechaEvento = evento.fecha.split('T')[0];
        return fechaEvento >= filtros.fechaInicio!;
      });
    }

    if (filtros.fechaFin) {
      eventosFiltrados = eventosFiltrados.filter(evento => {
        const fechaEvento = evento.fecha.split('T')[0];
        return fechaEvento <= filtros.fechaFin!;
      });
    }

    return eventosFiltrados;
  }

  obtenerEventosPorFecha(
    eventos: EventoCalendarioExtendido[],
    fecha: Date
  ): EventoCalendarioExtendido[] {
    const fechaStr = this.formatearFechaParaBackend(fecha);
    const eventosDia = eventos.filter(evento => {
      const fechaEvento = evento.fecha.split('T')[0];
      return fechaEvento === fechaStr;
    });

    // Ordenar por hora de inicio
    return eventosDia.sort((a, b) => {
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }

  obtenerEventosPorRango(
    eventos: EventoCalendarioExtendido[],
    fechaInicio: Date,
    fechaFin: Date
  ): EventoCalendarioExtendido[] {
    const fechaInicioStr = this.formatearFechaParaBackend(fechaInicio);
    const fechaFinStr = this.formatearFechaParaBackend(fechaFin);

    return eventos.filter(evento => {
      const fechaEvento = evento.fecha.split('T')[0];
      return fechaEvento >= fechaInicioStr && fechaEvento <= fechaFinStr;
    });
  }

  // ==================== UTILIDADES ====================

  formatearFechaParaBackend(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  convertirFechaDesdeBackend(fechaStr: string): Date {
    return new Date(fechaStr + 'T00:00:00');
  }

  formatearHora(hora: string): string {
    // Convertir HH:MM:SS a HH:MM
    if (hora && hora.length >= 5) {
      return hora.substring(0, 5);
    }
    return hora;
  }

  validarEvento(evento: Partial<EventoCalendario>): string[] {
    const errores: string[] = [];

    if (!evento.idTipoCalendario) {
      errores.push('El tipo de calendario es requerido');
    }

    if (!evento.idTipoEventoCalendario) {
      errores.push('El tipo de evento es requerido');
    }

    if (!evento.idDep) {
      errores.push('El departamento es requerido');
    }

    if (!evento.idUser) {
      errores.push('El usuario es requerido');
    }

    if (!evento.fecha) {
      errores.push('La fecha es requerida');
    }

    if (!evento.horaInicio) {
      errores.push('La hora de inicio es requerida');
    }

    if (!evento.horaFin) {
      errores.push('La hora de fin es requerida');
    }

    if (evento.horaInicio && evento.horaFin && evento.horaInicio >= evento.horaFin) {
      errores.push('La hora de fin debe ser posterior a la hora de inicio');
    }

    return errores;
  }

  obtenerEstadisticas(eventos: EventoCalendarioExtendido[]): {
    totalEventos: number;
    eventosPorTipo: { [tipo: string]: number };
    eventosPorUsuario: { [usuario: string]: number };
    eventosPorDepartamento: { [departamento: string]: number };
  } {
    const stats = {
      totalEventos: eventos.length,
      eventosPorTipo: {} as { [tipo: string]: number },
      eventosPorUsuario: {} as { [usuario: string]: number },
      eventosPorDepartamento: {} as { [departamento: string]: number }
    };

    eventos.forEach(evento => {
      const tipo = evento.descripcionTipoEventoCalendario;
      stats.eventosPorTipo[tipo] = (stats.eventosPorTipo[tipo] || 0) + 1;

      const usuario = evento.nombreCompletoUsuario;
      stats.eventosPorUsuario[usuario] = (stats.eventosPorUsuario[usuario] || 0) + 1;

      const depto = evento.nombreDepartamento;
      stats.eventosPorDepartamento[depto] = (stats.eventosPorDepartamento[depto] || 0) + 1;
    });

    return stats;
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

}
