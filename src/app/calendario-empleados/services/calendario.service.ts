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
  observaciones?: string;
}
export interface EventoCalendarioExtendido {
  id: number;
  idTipoCalendario: number;
  descripcionTipoCalendario: string;
  idTipoEventoCalendario: number;
  descripcionTipoEventoCalendario: string;
  idDepartamento: number;
  nombreDepartamento: string;
  idUsuario: number;
  codUsuario: string;
  nombreCompletoUsuario: string;
  fecha: string;
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
  roles?: string[];  // AGREGAR ESTO
}

export interface FiltrosCalendario {
  idUsuario?: number;
  idDepartamento?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface UsuarioRol {
  id: number;
  idrol: number;
  nombre: string;  // nombre del rol
  idUsuario: number;
  usuario: string;
  nombreCompleto: string;
}

export type VistaCalendario = 'dia' | 'semana' | 'mes';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private apiUrl = `${environment.baseUrl}/calendar`;
  private usuariosUrl = `${environment.baseUrl}/usuarios`;
  private departamentosUrl = `${environment.baseUrl}/departamentos`;

  // BehaviorSubjects para manejo de estado
  private eventosSubject = new BehaviorSubject<EventoCalendarioExtendido[]>([]);
  private cargandoSubject = new BehaviorSubject<boolean>(false);

  public eventos$ = this.eventosSubject.asObservable();
  public cargando$ = this.cargandoSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Headers con autenticación
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-token': token || ''
    });
  }

  // ==================== EVENTOS ====================

  /**
   * Obtiene todos los eventos extendidos
   */
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

  /**
   * Obtiene eventos por usuario
   */
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

  /**
   * Obtiene un evento por ID
   */
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

  /**
   * Crea un nuevo evento
   */
  crearEvento(evento: EventoCalendario): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(
      this.apiUrl,
      evento,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Recargar eventos después de crear
        this.obtenerEventosExtendidos().subscribe();
      }),
      catchError(error => {
        console.error('Error al crear evento:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza un evento existente
   */
  actualizarEvento(id: number, evento: EventoCalendario): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.apiUrl}/${id}`,
      evento,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Recargar eventos después de actualizar
        this.obtenerEventosExtendidos().subscribe();
      }),
      catchError(error => {
        console.error('Error al actualizar evento:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un evento
   */
  eliminarEvento(id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Recargar eventos después de eliminar
        this.obtenerEventosExtendidos().subscribe();
      }),
      catchError(error => {
        console.error('Error al eliminar evento:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== USUARIOS ====================

  /**
   * Obtiene todos los usuarios activos
   */
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

  /**
   * Obtiene todos los roles de todos los usuarios
   */
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

  // ==================== DEPARTAMENTOS ====================

  /**
   * Obtiene todos los departamentos activos
   */
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

  /**
   * Filtra eventos según criterios
   */
  filtrarEventos(
    eventos: EventoCalendarioExtendido[],
    filtros: FiltrosCalendario
  ): EventoCalendarioExtendido[] {
    let eventosFiltrados = [...eventos];

    // Filtrar por usuario
    if (filtros.idUsuario) {
      eventosFiltrados = eventosFiltrados.filter(
        evento => Number(evento.idUsuario) === Number(filtros.idUsuario)
      );
    }

    // Filtrar por departamento
    if (filtros.idDepartamento) {
      eventosFiltrados = eventosFiltrados.filter(
        evento => Number(evento.idDepartamento) === Number(filtros.idDepartamento)
      );
    }

    // Filtrar por rango de fechas
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

  /**
   * Obtiene eventos para una fecha específica
   */
  obtenerEventosPorFecha(
    eventos: EventoCalendarioExtendido[],
    fecha: Date
  ): EventoCalendarioExtendido[] {
    const fechaStr = this.formatearFechaParaBackend(fecha);
    return eventos.filter(evento => {
      // Extraer solo la parte de fecha (YYYY-MM-DD) del timestamp del backend
      const fechaEvento = evento.fecha.split('T')[0];
      return fechaEvento === fechaStr;
    });
  }

  /**
   * Obtiene eventos para un rango de fechas
   */
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

  /**
   * Formatea fecha para el backend (YYYY-MM-DD)
   */
  formatearFechaParaBackend(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convierte string de fecha del backend a Date
   */
  convertirFechaDesdeBackend(fechaStr: string): Date {
    return new Date(fechaStr + 'T00:00:00');
  }

  /**
   * Valida que un evento tenga todos los campos requeridos
   */
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

    return errores;
  }

  /**
   * Obtiene estadísticas de eventos
   */
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
      // Por tipo
      const tipo = evento.descripcionTipoEventoCalendario;
      stats.eventosPorTipo[tipo] = (stats.eventosPorTipo[tipo] || 0) + 1;

      // Por usuario
      const usuario = evento.nombreCompletoUsuario;
      stats.eventosPorUsuario[usuario] = (stats.eventosPorUsuario[usuario] || 0) + 1;

      // Por departamento
      const depto = evento.nombreDepartamento;
      stats.eventosPorDepartamento[depto] = (stats.eventosPorDepartamento[depto] || 0) + 1;
    });

    return stats;
  }

  /**
   * Limpia el cache de eventos
   */
  limpiarCache(): void {
    this.eventosSubject.next([]);
  }
}
