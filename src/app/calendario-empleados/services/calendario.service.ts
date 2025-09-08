import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Evento {
  id: string;
  empleado: string;
  fecha: Date;
  hora: string;
  tipoEvento: string;
  observaciones: string;
  fechaCompleta: Date;
  color?: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  departamento: string;
  activo: boolean;
}

export interface TipoEvento {
  id: string;
  nombre: string;
  color: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private eventosSubject = new BehaviorSubject<Evento[]>([]);
  private empleadosSubject = new BehaviorSubject<Empleado[]>([]);
  private tiposEventoSubject = new BehaviorSubject<TipoEvento[]>([]);

  public eventos$ = this.eventosSubject.asObservable();
  public empleados$ = this.empleadosSubject.asObservable();
  public tiposEvento$ = this.tiposEventoSubject.asObservable();

  constructor() {
    this.inicializarDatos();
  }

  // Métodos para eventos
  obtenerEventos(): Observable<Evento[]> {
    return this.eventos$;
  }

  obtenerEventoPorId(id: string): Evento | undefined {
    return this.eventosSubject.value.find(evento => evento.id === id);
  }

  obtenerEventosPorFecha(fecha: Date): Evento[] {
    return this.eventosSubject.value.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      return fechaEvento.toDateString() === fecha.toDateString();
    });
  }

  obtenerEventosPorEmpleado(empleadoId: string): Evento[] {
    return this.eventosSubject.value.filter(evento => evento.empleado === empleadoId);
  }

  obtenerEventosPorRango(fechaInicio: Date, fechaFin: Date): Evento[] {
    return this.eventosSubject.value.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      return fechaEvento >= fechaInicio && fechaEvento <= fechaFin;
    });
  }

  crearEvento(evento: Omit<Evento, 'id'>): string {
    const nuevoEvento: Evento = {
      ...evento,
      id: this.generarId(),
      color: this.obtenerColorPorTipo(evento.tipoEvento)
    };

    const eventosActuales = this.eventosSubject.value;
    this.eventosSubject.next([...eventosActuales, nuevoEvento]);

    return nuevoEvento.id;
  }

  actualizarEvento(id: string, datosEvento: Partial<Evento>): boolean {
    const eventosActuales = this.eventosSubject.value;
    const indice = eventosActuales.findIndex(evento => evento.id === id);

    if (indice === -1) {
      return false;
    }

    const eventoActualizado = {
      ...eventosActuales[indice],
      ...datosEvento,
      color: datosEvento.tipoEvento ? this.obtenerColorPorTipo(datosEvento.tipoEvento) : eventosActuales[indice].color
    };

    eventosActuales[indice] = eventoActualizado;
    this.eventosSubject.next([...eventosActuales]);

    return true;
  }

  eliminarEvento(id: string): boolean {
    const eventosActuales = this.eventosSubject.value;
    const eventosFiltrados = eventosActuales.filter(evento => evento.id !== id);

    if (eventosFiltrados.length === eventosActuales.length) {
      return false; // No se encontró el evento
    }

    this.eventosSubject.next(eventosFiltrados);
    return true;
  }

  // Métodos para empleados
  obtenerEmpleados(): Observable<Empleado[]> {
    return this.empleados$;
  }

  obtenerEmpleadoActivos(): Empleado[] {
    return this.empleadosSubject.value.filter(empleado => empleado.activo);
  }

  crearEmpleado(empleado: Omit<Empleado, 'id'>): string {
    const nuevoEmpleado: Empleado = {
      ...empleado,
      id: this.generarId()
    };

    const empleadosActuales = this.empleadosSubject.value;
    this.empleadosSubject.next([...empleadosActuales, nuevoEmpleado]);

    return nuevoEmpleado.id;
  }

  // Métodos para tipos de evento
  obtenerTiposEvento(): Observable<TipoEvento[]> {
    return this.tiposEvento$;
  }

  obtenerColorPorTipo(tipoEvento: string): string {
    const tipo = this.tiposEventoSubject.value.find(t => t.nombre === tipoEvento);
    return tipo?.color || '#6366f1'; // Color por defecto (indigo)
  }

  // Métodos de utilidad
  validarEvento(evento: Partial<Evento>): string[] {
    const errores: string[] = [];

    if (!evento.empleado) {
      errores.push('El empleado es requerido');
    }

    if (!evento.fecha) {
      errores.push('La fecha es requerida');
    }

    if (!evento.hora) {
      errores.push('La hora es requerida');
    }

    if (!evento.tipoEvento) {
      errores.push('El tipo de evento es requerido');
    }

    // Validar que la fecha no sea en el pasado (opcional)
    if (evento.fecha && new Date(evento.fecha) < new Date()) {
      // errores.push('La fecha no puede ser en el pasado');
    }

    // Validar conflictos de horario para el mismo empleado
    if (evento.empleado && evento.fecha && evento.hora) {
      const eventosConflicto = this.verificarConflictoHorario(
        evento.empleado,
        new Date(evento.fecha),
        evento.hora,
        evento.id
      );

      if (eventosConflicto.length > 0) {
        errores.push('El empleado ya tiene un evento programado en esta fecha y hora');
      }
    }

    return errores;
  }

  verificarConflictoHorario(
    empleado: string,
    fecha: Date,
    hora: string,
    eventoIdExcluir?: string
  ): Evento[] {
    return this.eventosSubject.value.filter(evento => {
      if (eventoIdExcluir && evento.id === eventoIdExcluir) {
        return false;
      }

      const fechaEvento = new Date(evento.fecha);
      return evento.empleado === empleado &&
             fechaEvento.toDateString() === fecha.toDateString() &&
             evento.hora === hora;
    });
  }

  // Exportar/Importar datos
  exportarEventos(): string {
    return JSON.stringify(this.eventosSubject.value, null, 2);
  }

  importarEventos(datosJson: string): boolean {
    try {
      const eventos = JSON.parse(datosJson) as Evento[];

      // Validar estructura básica
      const eventosValidos = eventos.filter(evento =>
        evento.id && evento.empleado && evento.fecha && evento.hora && evento.tipoEvento
      );

      this.eventosSubject.next(eventosValidos);
      return true;
    } catch (error) {
      console.error('Error al importar eventos:', error);
      return false;
    }
  }

  // Métodos privados
  private generarId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private inicializarDatos(): void {
    // Empleados de ejemplo
    const empleadosIniciales: Empleado[] = [
      {
        id: '1',
        nombre: 'Juan Pérez',
        departamento: 'Desarrollo',
        activo: true
      },
      {
        id: '2',
        nombre: 'María García',
        departamento: 'Recursos Humanos',
        activo: true
      },
      {
        id: '3',
        nombre: 'Carlos López',
        departamento: 'Ventas',
        activo: true
      },
      {
        id: '4',
        nombre: 'Ana Martínez',
        departamento: 'Marketing',
        activo: true
      },
      {
        id: '5',
        nombre: 'Luis Rodríguez',
        departamento: 'Soporte',
        activo: true
      },
      {
        id: '6',
        nombre: 'Sofia Fernández',
        departamento: 'Finanzas',
        activo: true
      }
    ];

    // Tipos de evento
    const tiposEventoIniciales: TipoEvento[] = [
      {
        id: '1',
        nombre: 'Reunión',
        color: '#3b82f6',
        descripcion: 'Reuniones de trabajo y coordinación'
      },
      {
        id: '2',
        nombre: 'Capacitación',
        color: '#10b981',
        descripcion: 'Sesiones de entrenamiento y desarrollo'
      },
      {
        id: '3',
        nombre: 'Entrevista',
        color: '#8b5cf6',
        descripcion: 'Entrevistas de trabajo'
      },
      {
        id: '4',
        nombre: 'Evento de Equipo',
        color: '#f59e0b',
        descripcion: 'Actividades de integración del equipo'
      },
      {
        id: '5',
        nombre: 'Vacaciones',
        color: '#eab308',
        descripcion: 'Períodos de descanso'
      },
      {
        id: '6',
        nombre: 'Licencia Médica',
        color: '#ef4444',
        descripcion: 'Ausencias por motivos de salud'
      },
      {
        id: '7',
        nombre: 'Otro',
        color: '#6b7280',
        descripcion: 'Otros tipos de eventos'
      }
    ];

    // Eventos de ejemplo
    const eventosIniciales: Evento[] = [
      {
        id: '1',
        empleado: 'Juan Pérez',
        fecha: new Date(),
        hora: '10:00',
        tipoEvento: 'Reunión',
        observaciones: 'Reunión de planificación del sprint',
        fechaCompleta: new Date(),
        color: '#3b82f6'
      },
      {
        id: '2',
        empleado: 'María García',
        fecha: new Date(Date.now() + 86400000), // Mañana
        hora: '14:00',
        tipoEvento: 'Capacitación',
        observaciones: 'Curso de nuevas políticas de RRHH',
        fechaCompleta: new Date(Date.now() + 86400000),
        color: '#10b981'
      }
    ];

    this.empleadosSubject.next(empleadosIniciales);
    this.tiposEventoSubject.next(tiposEventoIniciales);
    this.eventosSubject.next(eventosIniciales);
  }

  // Métodos para estadísticas y reportes
  obtenerEstadisticasPorEmpleado(): { [empleado: string]: number } {
    const estadisticas: { [empleado: string]: number } = {};

    this.eventosSubject.value.forEach(evento => {
      if (estadisticas[evento.empleado]) {
        estadisticas[evento.empleado]++;
      } else {
        estadisticas[evento.empleado] = 1;
      }
    });

    return estadisticas;
  }

  obtenerEstadisticasPorTipo(): { [tipo: string]: number } {
    const estadisticas: { [tipo: string]: number } = {};

    this.eventosSubject.value.forEach(evento => {
      if (estadisticas[evento.tipoEvento]) {
        estadisticas[evento.tipoEvento]++;
      } else {
        estadisticas[evento.tipoEvento] = 1;
      }
    });

    return estadisticas;
  }
}
