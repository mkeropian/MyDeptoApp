// src/app/shared/interfaces/rendicion-automatica.interface.ts

/**
 * Configuración de rendición automática
 */
export interface RendicionAutomaticaConfig {
  id: number;
  idPropietario: number;
  idDepartamento: number | null; // null = todos los departamentos del propietario
  frecuencia: 'diaria' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral';
  dia_envio: number; // Día del mes o día de semana según frecuencia
  hora_envio: string; // Formato HH:mm
  agrupar_departamentos: number; // 1/0 - Un Excel con todos o separados
  email_destino: string;
  email_cc: string | null; // Emails en copia, separados por coma
  asunto_personalizado: string | null;
  mensaje_personalizado: string | null;
  formato_archivo: 'excel' | 'csv' | 'ambos';
  incluir_resumen_email: number; // 1/0 - Incluir resumen en el cuerpo del email
  enviar_si_sin_movimientos: number; // 1/0
  activo: number; // 1/0 - Pausar/activar sin eliminar
  fecha_creacion: string;
  fecha_modificacion: string;
  ultimo_envio: string | null;
  ultimo_envio_exitoso: string | null;
  proximo_envio_calculado: string;
  usuario_creacion: number;

  // Datos JOIN del backend
  propietarioNombre?: string;
  propietarioDni?: string;
  departamentoNombre?: string;
  usuarioCreadorNombre?: string;
}

/**
 * Request para crear nueva configuración
 */
export interface CreateRendicionAutomaticaRequest {
  idPropietario: number;
  idDepartamento?: number | null;
  frecuencia: 'diaria' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral';
  dia_envio: number | null;
  hora_envio: string;
  agrupar_departamentos: number;
  email_destino: string;
  email_cc?: string | null;
  asunto_personalizado?: string | null;
  mensaje_personalizado?: string | null;
  formato_archivo: 'excel' | 'csv' | 'ambos';
  incluir_resumen_email: number;
  enviar_si_sin_movimientos: number;
  activo: number;
}

/**
 * Request para actualizar configuración
 */
export interface UpdateRendicionAutomaticaRequest extends CreateRendicionAutomaticaRequest {}

/**
 * Log de envío de rendición
 */
export interface RendicionEnvioLog {
  id: number;
  idConfig: number;
  idPropietario: number;
  fecha_envio: string;
  exitoso: number; // 1/0
  email_destino: string;
  periodo_inicio: string;
  periodo_fin: string;
  total_registros: number;
  error_mensaje: string | null;
  archivo_generado: string | null;

  // Datos JOIN del backend
  propietarioNombre?: string;
  configFrecuencia?: string;
}

/**
 * Respuesta del backend para operaciones con configuraciones
 */
export interface RendicionConfigResponse {
  ok: boolean;
  msg: string;
  config?: RendicionAutomaticaConfig;
  proximoEnvio?: string;
}

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse {
  ok: boolean;
  msg: string;
  data?: any;
}

/**
 * Formulario de configuración - Datos del wizard
 */
export interface RendicionFormData {
  // Paso 1: Propietario + Alcance
  idPropietario: number | null;
  alcance: 'todos' | 'especifico';
  idDepartamento: number | null;

  // Paso 2: Frecuencia + Timing
  frecuencia: 'diaria' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | null;
  dia_envio: number | null;
  hora_envio: string;

  // Paso 3: Email + Formato + Opciones
  email_destino: string;
  email_cc: string;
  formato_archivo: 'excel' | 'csv' | 'ambos';
  agrupar_departamentos: boolean;
  incluir_resumen_email: boolean;
  enviar_si_sin_movimientos: boolean;

  // Paso 4: Personalización
  asunto_personalizado: string;
  mensaje_personalizado: string;
}

/**
 * Estado del wizard
 */
export interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;
  isValid: boolean;
  proximoEnvio: Date | null;
}

/**
 * Opciones de frecuencia para el selector
 */
export interface FrecuenciaOption {
  value: 'diaria' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral';
  label: string;
  descripcion: string;
}

/**
 * Opciones de formato de archivo
 */
export interface FormatoOption {
  value: 'excel' | 'csv' | 'ambos';
  label: string;
  descripcion: string;
  icono: string;
}

/**
 * Propietario con departamentos para el selector
 */
export interface PropietarioConDepartamentos {
  id: number;
  nombreApellido: string;
  dni: string;
  email: string;
  departamentos: DepartamentoBasico[];
}

/**
 * Departamento básico para selectores
 */
export interface DepartamentoBasico {
  id: number;
  nombre: string;
}

/**
 * Estado de una configuración para la UI
 */
export interface ConfigEstado {
  id: number;
  activo: boolean;
  proximoEnvio: Date;
  ultimoEnvio: Date | null;
  ultimoExitoso: boolean | null;
  tiempoRestante: string;
  estado: 'activo' | 'pausado' | 'error' | 'pendiente';
}

/**
 * Filtros para la lista de configuraciones
 */
export interface ConfigFiltros {
  propietario: string;
  frecuencia: string;
  estado: 'todos' | 'activos' | 'pausados' | 'error';
  departamento: string;
}

/**
 * Estadísticas de configuraciones para el dashboard
 */
export interface ConfigEstadisticas {
  totalConfigs: number;
  activasCount: number;
  pausadasCount: number;
  errorCount: number;
  proximosEnvios24h: number;
  ultimosEnviosExitosos: number;
  ultimosEnviosFallidos: number;
}

/**
 * Constantes del sistema
 */
export const FRECUENCIAS: FrecuenciaOption[] = [
  {
    value: 'diaria',
    label: 'Diaria',
    descripcion: 'Cada día a la hora especificada'
  },
  {
    value: 'semanal',
    label: 'Semanal',
    descripcion: 'Cada semana en el día especificado'
  },
  {
    value: 'quincenal',
    label: 'Quincenal',
    descripcion: 'Cada 15 días'
  },
  {
    value: 'mensual',
    label: 'Mensual',
    descripcion: 'Cada mes en el día especificado'
  },
  {
    value: 'trimestral',
    label: 'Trimestral',
    descripcion: 'Cada trimestre en el día especificado'
  }
];

export const FORMATOS_ARCHIVO: FormatoOption[] = [
  {
    value: 'excel',
    label: 'Excel (.xlsx)',
    descripcion: 'Archivo Excel con formato y estilos',
    icono: 'fas fa-file-excel'
  },
  {
    value: 'csv',
    label: 'CSV (.csv)',
    descripcion: 'Archivo de texto separado por comas',
    icono: 'fas fa-file-csv'
  },
  {
    value: 'ambos',
    label: 'Ambos formatos',
    descripcion: 'Excel y CSV en el mismo envío',
    icono: 'fas fa-files'
  }
];

/**
 * Días de la semana para selector semanal
 */
export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

/**
 * Horas predefinidas para selector rápido
 */
export const HORAS_PREDEFINIDAS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];
