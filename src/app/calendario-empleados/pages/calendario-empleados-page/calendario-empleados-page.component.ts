import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

export interface Evento {
  id: string;
  empleado: string;
  fecha: Date;
  hora: string;
  tipoEvento: string;
  observaciones: string;
  fechaCompleta: Date;
}

export type VistaCalendario = 'dia' | 'semana' | 'mes' | 'año';

@Component({
  selector: 'app-calendario-empleados-page',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './calendario-empleados-page.component.html',
  styleUrls: ['./calendario-empleados-page.component.css']
})
export class CalendarioEmpleadosPageComponent implements OnInit {
  fechaActual = new Date();
  fechaSeleccionada = new Date();
  vistaActualString: string = 'mes'; // Usamos string directamente para evitar problemas de tipos

  eventos: Evento[] = [];
  eventoForm: FormGroup;

  // Estados del modal
  mostrarModalEvento = false;
  mostrarModalDetalles = false;
  eventoEditando: Evento | null = null;

  // Datos del tooltip
  tooltipVisible = false;
  tooltipEvento: Evento | null = null;
  tooltipPosicion = { x: 0, y: 0 };

  // Configuración del calendario
  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  tiposEvento = [
    'Reunión',
    'Capacitación',
    'Entrevista',
    'Evento de Equipo',
    'Vacaciones',
    'Licencia Médica',
    'Otro'
  ];

  empleados = [
    'Juan Pérez',
    'María García',
    'Carlos López',
    'Ana Martínez',
    'Luis Rodríguez',
    'Sofia Fernández'
  ];

  constructor(private fb: FormBuilder) {
    this.eventoForm = this.fb.group({
      empleado: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      tipoEvento: ['', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.cargarEventosEjemplo();
  }

  // Getter para obtener la vista actual como tipo VistaCalendario
  get vistaActual(): VistaCalendario {
    return this.vistaActualString as VistaCalendario;
  }

  // Métodos de navegación del calendario
  get tituloCalendario(): string {
    switch (this.vistaActual) {
      case 'dia':
        return this.fechaSeleccionada.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'semana':
        const inicioSemana = this.obtenerInicioSemana(this.fechaSeleccionada);
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        return `${inicioSemana.getDate()} - ${finSemana.getDate()} de ${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
      case 'mes':
        return `${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
      case 'año':
        return this.fechaSeleccionada.getFullYear().toString();
    }
  }

  mesAnterior() {
    const nuevaFecha = new Date(this.fechaSeleccionada);
    switch (this.vistaActual) {
      case 'dia':
        nuevaFecha.setDate(nuevaFecha.getDate() - 1);
        break;
      case 'semana':
        nuevaFecha.setDate(nuevaFecha.getDate() - 7);
        break;
      case 'mes':
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
        break;
      case 'año':
        nuevaFecha.setFullYear(nuevaFecha.getFullYear() - 1);
        break;
    }
    this.fechaSeleccionada = nuevaFecha;
  }

  mesSiguiente() {
    const nuevaFecha = new Date(this.fechaSeleccionada);
    switch (this.vistaActual) {
      case 'dia':
        nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        break;
      case 'semana':
        nuevaFecha.setDate(nuevaFecha.getDate() + 7);
        break;
      case 'mes':
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
        break;
      case 'año':
        nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
        break;
    }
    this.fechaSeleccionada = nuevaFecha;
  }

  irAHoy() {
    this.fechaSeleccionada = new Date();
  }

  cambiarVista(vista: string) {
    this.vistaActualString = vista;
  }

  // Métodos del calendario mensual
  get diasDelMes(): Date[] {
    const primerDia = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), 1);
    const ultimoDia = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, 0);

    // Ajustar para que la semana empiece en lunes (1) en lugar de domingo (0)
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
      dias.push(new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), dia));
    }

    // Agregar días del mes siguiente hasta completar 42 días (6 semanas)
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const siguienteMes = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, dia);
      dias.push(siguienteMes);
    }

    return dias;
  }

  esMesActual(fecha: Date): boolean {
    return fecha.getMonth() === this.fechaSeleccionada.getMonth();
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  // Métodos para eventos
  obtenerEventosPorFecha(fecha: Date): Evento[] {
    return this.eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      return fechaEvento.toDateString() === fecha.toDateString();
    });
  }

  abrirModalEvento(fecha?: Date) {
    this.eventoEditando = null;
    this.eventoForm.reset();

    if (fecha) {
      const fechaFormateada = fecha.toISOString().split('T')[0];
      this.eventoForm.patchValue({ fecha: fechaFormateada });
    }

    this.mostrarModalEvento = true;
  }

  abrirModalDetalles(evento: Evento) {
    this.eventoEditando = evento;
    this.mostrarModalDetalles = true;
  }

  editarEvento(evento: Evento) {
    this.eventoEditando = evento;
    const fechaFormateada = new Date(evento.fecha).toISOString().split('T')[0];

    this.eventoForm.patchValue({
      empleado: evento.empleado,
      fecha: fechaFormateada,
      hora: evento.hora,
      tipoEvento: evento.tipoEvento,
      observaciones: evento.observaciones
    });

    this.mostrarModalDetalles = false;
    this.mostrarModalEvento = true;
  }

  guardarEvento() {
    if (this.eventoForm.valid) {
      const formValue = this.eventoForm.value;
      const fechaHora = new Date(`${formValue.fecha}T${formValue.hora}`);

      const evento: Evento = {
        id: this.eventoEditando?.id || this.generarId(),
        empleado: formValue.empleado,
        fecha: new Date(formValue.fecha),
        hora: formValue.hora,
        tipoEvento: formValue.tipoEvento,
        observaciones: formValue.observaciones,
        fechaCompleta: fechaHora
      };

      if (this.eventoEditando) {
        const index = this.eventos.findIndex(e => e.id === this.eventoEditando!.id);
        this.eventos[index] = evento;
      } else {
        this.eventos.push(evento);
      }

      this.cerrarModal();
    }
  }

  eliminarEvento(eventoId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      this.eventos = this.eventos.filter(e => e.id !== eventoId);
      this.cerrarModal();
    }
  }

  cerrarModal() {
    this.mostrarModalEvento = false;
    this.mostrarModalDetalles = false;
    this.eventoEditando = null;
    this.eventoForm.reset();
  }

  // Métodos del tooltip
  mostrarTooltip(evento: Evento, event: MouseEvent) {
    this.tooltipEvento = evento;
    this.tooltipPosicion = { x: event.clientX + 10, y: event.clientY + 10 };
    this.tooltipVisible = true;
  }

  ocultarTooltip() {
    this.tooltipVisible = false;
    this.tooltipEvento = null;
  }

  // Métodos auxiliares
  private generarId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private obtenerInicioSemana(fecha: Date): Date {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const diasHastaLunes = (diaSemana === 0) ? 6 : diaSemana - 1;
    dia.setDate(dia.getDate() - diasHastaLunes);
    return dia;
  }

  private cargarEventosEjemplo() {
    // Algunos eventos de ejemplo
    this.eventos = [
      {
        id: '1',
        empleado: 'Juan Pérez',
        fecha: new Date(),
        hora: '10:00',
        tipoEvento: 'Reunión',
        observaciones: 'Reunión de planificación mensual',
        fechaCompleta: new Date()
      },
      {
        id: '2',
        empleado: 'María García',
        fecha: new Date(Date.now() + 86400000), // Mañana
        hora: '14:00',
        tipoEvento: 'Capacitación',
        observaciones: 'Curso de nuevas tecnologías',
        fechaCompleta: new Date(Date.now() + 86400000)
      }
    ];
  }
}
