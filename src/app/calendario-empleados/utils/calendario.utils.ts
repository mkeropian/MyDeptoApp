// Utilidades para el calendario de empleados

import { Evento, VistaCalendario, DiaSemana } from './calendario.types';

export class CalendarioUtils {

  /**
   * Obtiene los días del mes para la vista del calendario
   */
  static obtenerDiasDelMes(fecha: Date): Date[] {
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

    // Ajustar para que la semana empiece en lunes
    const primerDiaSemana = (primerDia.getDay() === 0) ? 6 : primerDia.getDay() - 1;

    const dias: Date[] = [];

    // Agregar días del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = new Date(primerDia);
      dia.setDate(dia.getDate() - (i + 1));
      dias.push(dia);
    }

    // Agregar días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), dia));
    }

    // Agregar días del mes siguiente hasta completar 42 días (6 semanas)
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const siguienteMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, dia);
      dias.push(siguienteMes);
    }

    return dias;
  }

  /**
   * Obtiene el rango de fechas para la vista semanal
   */
  static obtenerRangoSemana(fecha: Date): { inicio: Date; fin: Date; dias: Date[] } {
    const inicioSemana = this.obtenerInicioSemana(fecha);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      dias.push(dia);
    }

    return { inicio: inicioSemana, fin: finSemana, dias };
  }

  /**
   * Obtiene el primer día de la semana (lunes)
   */
  static obtenerInicioSemana(fecha: Date): Date {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const diasHastaLunes = (diaSemana === 0) ? 6 : diaSemana - 1;
    dia.setDate(dia.getDate() - diasHastaLunes);
    dia.setHours(0, 0, 0, 0);
    return dia;
  }

  /**
   * Verifica si una fecha es hoy
   */
  static esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  /**
   * Verifica si una fecha pertenece al mes actual
   */
  static esMesActual(fecha: Date, mesReferencia: Date): boolean {
    return fecha.getMonth() === mesReferencia.getMonth() &&
           fecha.getFullYear() === mesReferencia.getFullYear();
  }

  /**
   * Obtiene el nombre del mes en español
   */
  static obtenerNombreMes(fecha: Date): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[fecha.getMonth()];
  }

  /**
   * Obtiene el nombre del día de la semana en español
   */
  static obtenerNombreDia(fecha: Date): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
  }

  /**
   * Formatea una fecha para mostrar en el calendario
   */
  static formatearFecha(fecha: Date, formato: 'corto' | 'largo' | 'completo' = 'corto'): string {
    switch (formato) {
      case 'corto':
        return fecha.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'numeric'
        });
      case 'largo':
        return fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
      case 'completo':
        return fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      default:
        return fecha.toLocaleDateString('es-ES');
    }
  }

  /**
   * Formatea una hora para mostrar
   */
  static formatearHora(hora: string, formato24h: boolean = true): string {
    if (!formato24h) {
      const [hours, minutes] = hora.split(':');
      const hoursNum = parseInt(hours);
      const ampm = hoursNum >= 12 ? 'PM' : 'AM';
      const hours12 = hoursNum % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    }
    return hora;
  }

  /**
   * Calcula la duración entre dos horas
   */
  static calcularDuracion(horaInicio: string, horaFin: string): number {
    const [startHours, startMinutes] = horaInicio.split(':').map(Number);
    const [endHours, endMinutes] = horaFin.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return endTotalMinutes - startTotalMinutes;
  }

  /**
   * Genera intervalos de hora para seleccionar
   */
  static generarIntervalosHora(
    horaInicio: string = '08:00',
    horaFin: string = '18:00',
    intervalo: number = 30
  ): string[] {
    const intervalos: string[] = [];
    const [startHours, startMinutes] = horaInicio.split(':').map(Number);
    const [endHours, endMinutes] = horaFin.split(':').map(Number);

    let currentMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    while (currentMinutes <= endTotalMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      intervalos.push(timeString);
      currentMinutes += intervalo;
    }

    return intervalos;
  }

  /**
   * Verifica si hay conflicto de horarios entre eventos
   */
  static hayConflictoHorario(evento1: Evento, evento2: Evento): boolean {
    // Si son fechas diferentes, no hay conflicto
    if (evento1.fecha.toDateString() !== evento2.fecha.toDateString()) {
      return false;
    }

    // Si son el mismo evento, no hay conflicto
    if (evento1.id === evento2.id) {
      return false;
    }

    // Si no son el mismo empleado, no hay conflicto
    if (evento1.empleado !== evento2.empleado) {
      return false;
    }

    const hora1 = this.convertirHoraAMinutos(evento1.hora);
    const hora2 = this.convertirHoraAMinutos(evento2.hora);
    const duracion1 = evento1.duracion || 60;
    const duracion2 = evento2.duracion || 60;

    const fin1 = hora1 + duracion1;
    const fin2 = hora2 + duracion2;

    // Verificar solapamiento
    return hora1 < fin2 && hora2 < fin1;
  }

  /**
   * Convierte hora en formato HH:mm a minutos desde medianoche
   */
  static convertirHoraAMinutos(hora: string): number {
    const [hours, minutes] = hora.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convierte minutos desde medianoche a formato HH:mm
   */
  static convertirMinutosAHora(minutos: number): string {
    const hours = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene las iniciales de un nombre
   */
  static obtenerIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  /**
   * Genera un ID único
   */
  static generarId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Valida formato de hora
   */
  static validarFormatoHora(hora: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(hora);
  }

  /**
   * Valida formato de fecha
   */
  static validarFormatoFecha(fecha: string): boolean {
    const fechaObj = new Date(fecha);
    return !isNaN(fechaObj.getTime()) && fecha === fechaObj.toISOString().split('T')[0];
  }

  /**
   * Obtiene el color por defecto para un tipo de evento
   */
  static obtenerColorEvento(tipoEvento: string): string {
    const colores: { [key: string]: string } = {
      'Reunión': '#3b82f6',
      'Capacitación': '#10b981',
      'Entrevista': '#8b5cf6',
      'Evento de Equipo': '#f59e0b',
      'Vacaciones': '#eab308',
      'Licencia Médica': '#ef4444',
      'Otro': '#6b7280'
    };

    return colores[tipoEvento] || '#6366f1';
  }

  /**
   * Calcula estadísticas de eventos
   */
  static calcularEstadisticas(eventos: Evento[]): {
    totalEventos: number;
    eventosPorTipo: { [tipo: string]: number };
    eventosPorEmpleado: { [empleado: string]: number };
    eventosPorMes: { [mes: string]: number };
  } {
    const estadisticas = {
      totalEventos: eventos.length,
      eventosPorTipo: {} as { [tipo: string]: number },
      eventosPorEmpleado: {} as { [empleado: string]: number },
      eventosPorMes: {} as { [mes: string]: number }
    };

    eventos.forEach(evento => {
      // Por tipo
      estadisticas.eventosPorTipo[evento.tipoEvento] =
        (estadisticas.eventosPorTipo[evento.tipoEvento] || 0) + 1;

      // Por empleado
      estadisticas.eventosPorEmpleado[evento.empleado] =
        (estadisticas.eventosPorEmpleado[evento.empleado] || 0) + 1;

      // Por mes
      const mesKey = `${evento.fecha.getFullYear()}-${evento.fecha.getMonth() + 1}`;
      estadisticas.eventosPorMes[mesKey] =
        (estadisticas.eventosPorMes[mesKey] || 0) + 1;
    });

    return estadisticas;
  }

  /**
   * Exporta eventos a formato CSV
   */
  static exportarACSV(eventos: Evento[]): string {
    const encabezados = [
      'ID',
      'Empleado',
      'Fecha',
      'Hora',
      'Tipo de Evento',
      'Observaciones',
      'Duración (min)',
      'Ubicación'
    ];

    const filas = eventos.map(evento => [
      evento.id,
      evento.empleado,
      evento.fecha.toLocaleDateString('es-ES'),
      evento.hora,
      evento.tipoEvento,
      evento.observaciones || '',
      evento.duracion?.toString() || '60',
      evento.ubicacion || ''
    ]);

    const csvContent = [encabezados, ...filas]
      .map(fila => fila.map(campo => `"${campo}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Importa eventos desde formato CSV
   */
  static importarDesdeCSV(csvContent: string): Evento[] {
    const lineas = csvContent.split('\n');
    const encabezados = lineas[0].split(',').map(h => h.replace(/"/g, ''));

    const eventos: Evento[] = [];

    for (let i = 1; i < lineas.length; i++) {
      if (lineas[i].trim() === '') continue;

      const valores = lineas[i].split(',').map(v => v.replace(/"/g, ''));

      try {
        const evento: Evento = {
          id: valores[0] || this.generarId(),
          empleado: valores[1],
          fecha: new Date(valores[2]),
          hora: valores[3],
          tipoEvento: valores[4],
          observaciones: valores[5] || '',
          fechaCompleta: new Date(`${valores[2]}T${valores[3]}`),
          duracion: parseInt(valores[6]) || 60,
          ubicacion: valores[7] || ''
        };

        eventos.push(evento);
      } catch (error) {
        console.warn(`Error al procesar fila ${i + 1}:`, error);
      }
    }

    return eventos;
  }

  /**
   * Filtra eventos según criterios
   */
  static filtrarEventos(
    eventos: Evento[],
    filtros: {
      fechaInicio?: Date;
      fechaFin?: Date;
      empleados?: string[];
      tiposEvento?: string[];
      textoBusqueda?: string;
    }
  ): Evento[] {
    return eventos.filter(evento => {
      // Filtro por rango de fechas
      if (filtros.fechaInicio && evento.fecha < filtros.fechaInicio) {
        return false;
      }

      if (filtros.fechaFin && evento.fecha > filtros.fechaFin) {
        return false;
      }

      // Filtro por empleados
      if (filtros.empleados && filtros.empleados.length > 0) {
        if (!filtros.empleados.includes(evento.empleado)) {
          return false;
        }
      }

      // Filtro por tipos de evento
      if (filtros.tiposEvento && filtros.tiposEvento.length > 0) {
        if (!filtros.tiposEvento.includes(evento.tipoEvento)) {
          return false;
        }
      }

      // Filtro por texto de búsqueda
      if (filtros.textoBusqueda && filtros.textoBusqueda.trim() !== '') {
        const texto = filtros.textoBusqueda.toLowerCase();
        const buscarEn = [
          evento.empleado,
          evento.tipoEvento,
          evento.observaciones || '',
          evento.ubicacion || ''
        ].join(' ').toLowerCase();

        if (!buscarEn.includes(texto)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Ordena eventos por fecha y hora
   */
  static ordenarEventos(eventos: Evento[], orden: 'asc' | 'desc' = 'asc'): Evento[] {
    return [...eventos].sort((a, b) => {
      const fechaA = new Date(`${a.fecha.toDateString()} ${a.hora}`).getTime();
      const fechaB = new Date(`${b.fecha.toDateString()} ${b.hora}`).getTime();

      return orden === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
  }

  /**
   * Agrupa eventos por criterio
   */
  static agruparEventos(
    eventos: Evento[],
    criterio: 'fecha' | 'empleado' | 'tipo' | 'mes'
  ): { [key: string]: Evento[] } {
    const grupos: { [key: string]: Evento[] } = {};

    eventos.forEach(evento => {
      let clave: string;

      switch (criterio) {
        case 'fecha':
          clave = evento.fecha.toDateString();
          break;
        case 'empleado':
          clave = evento.empleado;
          break;
        case 'tipo':
          clave = evento.tipoEvento;
          break;
        case 'mes':
          clave = `${this.obtenerNombreMes(evento.fecha)} ${evento.fecha.getFullYear()}`;
          break;
        default:
          clave = 'otros';
      }

      if (!grupos[clave]) {
        grupos[clave] = [];
      }
      grupos[clave].push(evento);
    });

    return grupos;
  }

  /**
   * Calcula la carga de trabajo por empleado
   */
  static calcularCargaTrabajo(
    eventos: Evento[],
    fechaInicio: Date,
    fechaFin: Date
  ): { [empleado: string]: { eventos: number; horas: number } } {
    const carga: { [empleado: string]: { eventos: number; horas: number } } = {};

    const eventosFiltrados = this.filtrarEventos(eventos, { fechaInicio, fechaFin });

    eventosFiltrados.forEach(evento => {
      if (!carga[evento.empleado]) {
        carga[evento.empleado] = { eventos: 0, horas: 0 };
      }

      carga[evento.empleado].eventos++;
      carga[evento.empleado].horas += (evento.duracion || 60) / 60;
    });

    return carga;
  }

  /**
   * Encuentra slots libres para un empleado en un día
   */
  static encontrarSlotsLibres(
    eventos: Evento[],
    empleado: string,
    fecha: Date,
    horaInicio: string = '08:00',
    horaFin: string = '18:00',
    duracionMinima: number = 60
  ): { inicio: string; fin: string }[] {
    const eventosDelDia = eventos.filter(evento =>
      evento.empleado === empleado &&
      evento.fecha.toDateString() === fecha.toDateString()
    ).sort((a, b) => this.convertirHoraAMinutos(a.hora) - this.convertirHoraAMinutos(b.hora));

    const slots: { inicio: string; fin: string }[] = [];
    const inicioMinutos = this.convertirHoraAMinutos(horaInicio);
    const finMinutos = this.convertirHoraAMinutos(horaFin);

    let minutoActual = inicioMinutos;

    for (const evento of eventosDelDia) {
      const inicioEvento = this.convertirHoraAMinutos(evento.hora);
      const finEvento = inicioEvento + (evento.duracion || 60);

      // Si hay tiempo libre antes del evento
      if (inicioEvento - minutoActual >= duracionMinima) {
        slots.push({
          inicio: this.convertirMinutosAHora(minutoActual),
          fin: this.convertirMinutosAHora(inicioEvento)
        });
      }

      minutoActual = Math.max(minutoActual, finEvento);
    }

    // Verificar si hay tiempo libre al final del día
    if (finMinutos - minutoActual >= duracionMinima) {
      slots.push({
        inicio: this.convertirMinutosAHora(minutoActual),
        fin: this.convertirMinutosAHora(finMinutos)
      });
    }

    return slots;
  }

  /**
   * Genera notificaciones para eventos próximos
   */
  static generarNotificaciones(
    eventos: Evento[],
    minutosAnticipacion: number = 30
  ): { evento: Evento; mensaje: string }[] {
    const ahora = new Date();
    const tiempoLimite = new Date(ahora.getTime() + minutosAnticipacion * 60000);

    return eventos
      .filter(evento => {
        const fechaEvento = new Date(`${evento.fecha.toDateString()} ${evento.hora}`);
        return fechaEvento > ahora && fechaEvento <= tiempoLimite;
      })
      .map(evento => ({
        evento,
        mensaje: `Recordatorio: ${evento.tipoEvento} con ${evento.empleado} en ${minutosAnticipacion} minutos`
      }));
  }

  /**
   * Valida que un evento sea válido
   */
  static validarEvento(evento: Partial<Evento>): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!evento.empleado) {
      errores.push('El empleado es requerido');
    }

    if (!evento.fecha) {
      errores.push('La fecha es requerida');
    }

    if (!evento.hora) {
      errores.push('La hora es requerida');
    } else if (!this.validarFormatoHora(evento.hora)) {
      errores.push('El formato de hora no es válido (HH:mm)');
    }

    if (!evento.tipoEvento) {
      errores.push('El tipo de evento es requerido');
    }

    if (evento.duracion && (evento.duracion < 15 || evento.duracion > 480)) {
      errores.push('La duración debe estar entre 15 minutos y 8 horas');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Calcula el próximo día hábil
   */
  static obtenerProximoDiaHabil(fecha: Date): Date {
    const proximaFecha = new Date(fecha);
    proximaFecha.setDate(proximaFecha.getDate() + 1);

    // Si es sábado (6) o domingo (0), avanzar al lunes
    while (proximaFecha.getDay() === 0 || proximaFecha.getDay() === 6) {
      proximaFecha.setDate(proximaFecha.getDate() + 1);
    }

    return proximaFecha;
  }

  /**
   * Cuenta días hábiles entre dos fechas
   */
  static contarDiasHabiles(fechaInicio: Date, fechaFin: Date): number {
    let contador = 0;
    const fechaActual = new Date(fechaInicio);

    while (fechaActual <= fechaFin) {
      const diaSemana = fechaActual.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // No es domingo ni sábado
        contador++;
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return contador;
  }
}
