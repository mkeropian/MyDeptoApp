// Definiciones de tipos para el sistema de calendario

export interface Evento {
  id: string;
  empleado: string;
  fecha: Date;
  hora: string;
  tipoEvento: string;
  observaciones: string;
  fechaCompleta: Date;
  color?: string;
  duracion?: number; // en minutos
  ubicacion?: string;
  participantes?: string[];
  recordatorio?: number; // minutos antes del evento
  repetir?: ReglasRepeticion;
  estado?: EstadoEvento;
  creadoPor?: string;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}

export interface Empleado {
  id: string;
  nombre: string;
  departamento: string;
  activo: boolean;
  email?: string;
  telefono?: string;
  cargo?: string;
  fechaIngreso?: Date;
  supervisor?: string;
  horarioTrabajo?: HorarioTrabajo;
}

export interface TipoEvento {
  id: string;
  nombre: string;
  color: string;
  descripcion?: string;
  duracionDefault?: number;
  requiereAprobacion?: boolean;
  notificacionEmail?: boolean;
  categoria?: CategoriaEvento;
}

export interface Departamento {
  id: string;
  nombre: string;
  descripcion?: string;
  supervisor?: string;
  empleados?: string[];
  activo: boolean;
}

export interface HorarioTrabajo {
  lunes: RangoHorario;
  martes: RangoHorario;
  miercoles: RangoHorario;
  jueves: RangoHorario;
  viernes: RangoHorario;
  sabado?: RangoHorario;
  domingo?: RangoHorario;
}

export interface RangoHorario {
  inicio: string; // formato HH:mm
  fin: string;    // formato HH:mm
  activo: boolean;
}

export interface ReglasRepeticion {
  tipo: TipoRepeticion;
  intervalo: number;
  diasSemana?: DiaSemana[];
  fechaFin?: Date;
  cantidadRepeticiones?: number;
}

export interface ConfiguracionCalendario {
  vistaDefault: VistaCalendario;
  horaInicioJornada: string;
  horaFinJornada: string;
  mostrarFinesSemana: boolean;
  formatoHora: FormatoHora;
  idioma: string;
  zonaHoraria: string;
  colorTema: string;
  notificacionesEmail: boolean;
  notificacionesPush: boolean;
}

export interface FiltroEventos {
  fechaInicio?: Date;
  fechaFin?: Date;
  empleados?: string[];
  tiposEvento?: string[];
  departamentos?: string[];
  estados?: EstadoEvento[];
  textoBusqueda?: string;
}

export interface EstadisticasCalendario {
  totalEventos: number;
  eventosPorTipo: { [tipo: string]: number };
  eventosPorEmpleado: { [empleado: string]: number };
  eventosPorDepartamento: { [departamento: string]: number };
  promedioEventosPorDia: number;
  horasOcupadasPorSemana: number;
}

export interface NotificacionEvento {
  id: string;
  eventoId: string;
  tipo: TipoNotificacion;
  mensaje: string;
  fechaEnvio: Date;
  enviado: boolean;
  destinatarios: string[];
}

// Enums y tipos de unión

export type VistaCalendario = 'dia' | 'semana' | 'mes' | 'año' | 'agenda';

export type EstadoEvento = 'programado' | 'confirmado' | 'cancelado' | 'completado' | 'en_progreso';

export type TipoRepeticion = 'diario' | 'semanal' | 'mensual' | 'anual' | 'personalizado';

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export type FormatoHora = '12h' | '24h';

export type CategoriaEvento = 'trabajo' | 'personal' | 'administrativo' | 'capacitacion' | 'reunion' | 'otro';

export type TipoNotificacion = 'email' | 'push' | 'sms' | 'interno';

export type NivelPermiso = 'lectura' | 'escritura' | 'administrador' | 'propietario';

// Interfaces para formularios

export interface FormularioEvento {
  empleado: string;
  fecha: string;
  hora: string;
  tipoEvento: string;
  observaciones: string;
  duracion?: number;
  ubicacion?: string;
  participantes?: string[];
  recordatorio?: number;
  repetir?: boolean;
  reglasRepeticion?: ReglasRepeticion;
}

export interface FormularioEmpleado {
  nombre: string;
  departamento: string;
  activo: boolean;
  email?: string;
  telefono?: string;
  cargo?: string;
  fechaIngreso?: string;
  supervisor?: string;
}

export interface FormularioFiltro {
  fechaInicio?: string;
  fechaFin?: string;
  empleados?: string[];
  tiposEvento?: string[];
  departamentos?: string[];
  textoBusqueda?: string;
}

// Interfaces para respuestas de API (si usas un backend)

export interface RespuestaAPI<T> {
  exito: boolean;
  datos?: T;
  mensaje?: string;
  errores?: string[];
  codigo?: number;
}

export interface PaginacionRespuesta<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// Constantes útiles

export const TIPOS_EVENTO_DEFAULT: TipoEvento[] = [
  {
    id: '1',
    nombre: 'Reunión',
    color: '#3b82f6',
    descripcion: 'Reuniones de trabajo y coordinación',
    duracionDefault: 60,
    categoria: 'reunion'
  },
  {
    id: '2',
    nombre: 'Capacitación',
    color: '#10b981',
    descripcion: 'Sesiones de entrenamiento y desarrollo',
    duracionDefault: 120,
    categoria: 'capacitacion'
  },
  {
    id: '3',
    nombre: 'Entrevista',
    color: '#8b5cf6',
    descripcion: 'Entrevistas de trabajo',
    duracionDefault: 45,
    categoria: 'administrativo'
  },
  {
    id: '4',
    nombre: 'Evento de Equipo',
    color: '#f59e0b',
    descripcion: 'Actividades de integración del equipo',
    duracionDefault: 180,
    categoria: 'trabajo'
  },
  {
    id: '5',
    nombre: 'Vacaciones',
    color: '#eab308',
    descripcion: 'Períodos de descanso',
    duracionDefault: 480,
    categoria: 'personal'
  },
  {
    id: '6',
    nombre: 'Licencia Médica',
    color: '#ef4444',
    descripcion: 'Ausencias por motivos de salud',
    duracionDefault: 480,
    categoria: 'personal'
  }
];

export const DEPARTAMENTOS_DEFAULT = [
  'Desarrollo',
  'Recursos Humanos',
  'Ventas',
  'Marketing',
  'Soporte',
  'Finanzas',
  'Administración',
  'Operaciones',
  'Gerencia',
  'Calidad'
];

export const CONFIGURACION_DEFAULT: ConfiguracionCalendario = {
  vistaDefault: 'mes',
  horaInicioJornada: '08:00',
  horaFinJornada: '18:00',
  mostrarFinesSemana: true,
  formatoHora: '24h',
  idioma: 'es-ES',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  colorTema: '#6366f1',
  notificacionesEmail: true,
  notificacionesPush: true
};
