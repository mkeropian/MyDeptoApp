import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { map, forkJoin, Subject, takeUntil } from 'rxjs';
import {
  CalendarioService,
  EventoCalendarioExtendido,
  EventoCalendario,
  Usuario,
  Departamento,
  FiltrosCalendario,
  VistaCalendario,
  TipoEventoCalendario
} from '../../services/calendario.service';

@Component({
  selector: 'app-calendario-empleados-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './calendario-empleados-page.component.html',
  styleUrls: ['./calendario-empleados-page.component.css']
})
export class CalendarioEmpleadosPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  eventos: EventoCalendarioExtendido[] = [];
  eventosFiltrados: EventoCalendarioExtendido[] = [];
  usuarios: Usuario[] = [];
  departamentos: Departamento[] = [];

  cargando = false;
  vistaActual: VistaCalendario = 'mes';
  fechaSeleccionada = new Date();

  eventoForm: FormGroup;
  filtrosForm: FormGroup;

  mostrarModalEvento = false;
  mostrarModalDetalles = false;
  eventoEditando: EventoCalendarioExtendido | null = null;

  tooltipVisible = false;
  tooltipEvento: EventoCalendarioExtendido | null = null;
  tooltipPosicion = { x: 0, y: 0 };

  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Horarios para vista diaria
  horasDia: string[] = [];

  tiposCalendario = [
    { id: 6, descripcion: 'General' }
  ];

  tiposEvento: TipoEventoCalendario[] = [];

  constructor(
    private fb: FormBuilder,
    public calendarioService: CalendarioService,
    private cdr: ChangeDetectorRef
  ) {
    this.eventoForm = this.fb.group({
      idTipoCalendario: ['', Validators.required],
      idTipoEventoCalendario: ['', Validators.required],
      idDep: ['', Validators.required],
      idUser: ['', Validators.required],
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      observaciones: ['']
    });

    this.filtrosForm = this.fb.group({
      idUsuario: [''],
      idDepartamento: ['']
    });

    // Generar horas del día (00:00 a 23:00)
    for (let i = 0; i < 24; i++) {
      this.horasDia.push(`${String(i).padStart(2, '0')}:00`);
    }
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.suscribirAEventos();
    this.suscribirAFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CARGA DE DATOS ====================

  cargarDatos(): void {
    this.cargando = true;

    this.calendarioService.obtenerEventosExtendidos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar eventos:', error);
          this.cargando = false;
          this.mostrarNotificacion('Error al cargar eventos', 'error');
        }
      });

    forkJoin({
      usuarios: this.calendarioService.obtenerUsuariosActivos(),
      rolesUsuarios: this.calendarioService.obtenerRolesUsuarios(),
      departamentos: this.calendarioService.obtenerDepartamentosActivos(),
      tiposEvento: this.calendarioService.obtenerTiposEventoCalendario()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ usuarios, rolesUsuarios, departamentos, tiposEvento }) => {
          const empleadosIds = rolesUsuarios
            .filter(ur => ur.nombre === 'emp')
            .map(ur => ur.idUsuario);

          this.usuarios = usuarios.filter(u => empleadosIds.includes(u.id));
          this.departamentos = departamentos;
          this.tiposEvento = tiposEvento;
        },
        error: (error) => {
          console.error('Error al cargar datos:', error);
          this.mostrarNotificacion('Error al cargar datos', 'error');
        }
      });
  }

  suscribirAEventos(): void {
    this.calendarioService.eventos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(eventos => {
        this.eventos = eventos;
        this.aplicarFiltros();
      });

    this.calendarioService.cargando$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cargando => {
        this.cargando = cargando;
      });
  }

  suscribirAFiltros(): void {
    this.filtrosForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.aplicarFiltros();
      });
  }

  aplicarFiltros(): void {
    const filtros: FiltrosCalendario = {
      idUsuario: this.filtrosForm.get('idUsuario')?.value
        ? Number(this.filtrosForm.get('idUsuario')?.value)
        : undefined,
      idDepartamento: this.filtrosForm.get('idDepartamento')?.value
        ? Number(this.filtrosForm.get('idDepartamento')?.value)
        : undefined
    };

    const rangoFechas = this.obtenerRangoFechasVista();
    filtros.fechaInicio = this.calendarioService.formatearFechaParaBackend(rangoFechas.inicio);
    filtros.fechaFin = this.calendarioService.formatearFechaParaBackend(rangoFechas.fin);

    this.eventosFiltrados = this.calendarioService.filtrarEventos(this.eventos, filtros);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      idUsuario: '',
      idDepartamento: ''
    });
  }

  // ==================== NAVEGACIÓN DEL CALENDARIO ====================

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
        const rangoSemana = this.obtenerRangoSemana(this.fechaSeleccionada);
        return `${rangoSemana.inicio.getDate()} - ${rangoSemana.fin.getDate()} de ${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
      case 'mes':
        return `${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
    }
  }

  anteriorPeriodo(): void {
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
    }

    this.fechaSeleccionada = nuevaFecha;
    this.ocultarTooltip();
    this.aplicarFiltros();
  }

  siguientePeriodo(): void {
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
    }

    this.fechaSeleccionada = nuevaFecha;
    this.ocultarTooltip();
    this.aplicarFiltros();
  }

  irAHoy(): void {
    this.fechaSeleccionada = new Date();
    this.ocultarTooltip();
    this.aplicarFiltros();
  }

  cambiarVista(vista: VistaCalendario): void {
    this.vistaActual = vista;
    this.ocultarTooltip();
    this.aplicarFiltros();
  }

  // ==================== VISTA MENSUAL ====================

  get diasDelMes(): Date[] {
    const primerDia = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), 1);
    const ultimoDia = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, 0);

    const primerDiaSemana = (primerDia.getDay() === 0) ? 6 : primerDia.getDay() - 1;
    const dias: Date[] = [];

    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = new Date(primerDia);
      dia.setDate(dia.getDate() - (i + 1));
      dias.push(dia);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), dia));
    }

    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      dias.push(new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, dia));
    }

    return dias;
  }

  // ==================== VISTA SEMANAL ====================

  get diasDeLaSemana(): Date[] {
    const rango = this.obtenerRangoSemana(this.fechaSeleccionada);
    return rango.dias;
  }

  obtenerRangoSemana(fecha: Date): { inicio: Date; fin: Date; dias: Date[] } {
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

  obtenerInicioSemana(fecha: Date): Date {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const diasHastaLunes = (diaSemana === 0) ? 6 : diaSemana - 1;
    dia.setDate(dia.getDate() - diasHastaLunes);
    return dia;
  }

  // ==================== EVENTOS ====================

  obtenerEventosPorFecha(fecha: Date): EventoCalendarioExtendido[] {
    return this.calendarioService.obtenerEventosPorFecha(this.eventosFiltrados, fecha);
  }

  obtenerRangoFechasVista(): { inicio: Date; fin: Date } {
    switch (this.vistaActual) {
      case 'dia':
        const inicioDia = new Date(this.fechaSeleccionada);
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(this.fechaSeleccionada);
        finDia.setHours(23, 59, 59, 999);
        return { inicio: inicioDia, fin: finDia };

      case 'semana':
        return this.obtenerRangoSemana(this.fechaSeleccionada);

      case 'mes':
        const inicioMes = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), 1);
        const finMes = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, 0);
        return { inicio: inicioMes, fin: finMes };
    }
  }

  // ==================== VISTA DIARIA - POSICIONAMIENTO ====================

  obtenerPosicionEvento(evento: EventoCalendarioExtendido): { top: number; height: number } {
    const horaInicio = this.convertirHoraAMinutos(evento.horaInicio);
    const horaFin = this.convertirHoraAMinutos(evento.horaFin);

    // Cada hora tiene 60px de altura, y empezamos desde el padding-top (48px)
    const pixelesPorMinuto = 60 / 60; // 1px por minuto

    return {
      top: 48 + (horaInicio * pixelesPorMinuto), // Agregamos 48px del padding-top
      height: (horaFin - horaInicio) * pixelesPorMinuto
    };
  }

  convertirHoraAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  obtenerEventosEnHora(hora: string): EventoCalendarioExtendido[] {
    const eventosDelDia = this.obtenerEventosPorFecha(this.fechaSeleccionada);
    const horaNum = parseInt(hora.split(':')[0]);

    return eventosDelDia.filter(evento => {
      const horaInicioNum = parseInt(evento.horaInicio.split(':')[0]);
      const horaFinNum = parseInt(evento.horaFin.split(':')[0]);
      return horaInicioNum <= horaNum && horaFinNum > horaNum;
    });
  }

  // ==================== CRUD EVENTOS ====================

  abrirModalEvento(fecha?: Date): void {
    this.ocultarTooltip(); // ✅ Ocultar tooltip antes de abrir modal
    this.eventoEditando = null;
    this.eventoForm.reset();

    if (fecha) {
      const fechaStr = this.calendarioService.formatearFechaParaBackend(fecha);
      this.eventoForm.patchValue({
        fecha: fechaStr,
        horaInicio: '09:00',
        horaFin: '10:00'
      });
    }

    this.mostrarModalEvento = true;
  }

  editarEvento(evento: EventoCalendarioExtendido): void {
    this.ocultarTooltip(); // ✅ Ocultar tooltip antes de editar
    this.eventoEditando = evento;

    this.eventoForm.patchValue({
      idTipoCalendario: evento.idTipoCalendario,
      idTipoEventoCalendario: evento.idTipoEventoCalendario,
      idDep: evento.idDepartamento,
      idUser: evento.idUsuario,
      fecha: evento.fecha,
      horaInicio: this.calendarioService.formatearHora(evento.horaInicio),
      horaFin: this.calendarioService.formatearHora(evento.horaFin),
      observaciones: evento.observaciones
    });

    this.mostrarModalDetalles = false;
    this.mostrarModalEvento = true;
  }

  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const eventoData: EventoCalendario = {
      ...this.eventoForm.value,
      horaInicio: this.eventoForm.value.horaInicio + ':00',
      horaFin: this.eventoForm.value.horaFin + ':00'
    };

    if (this.eventoEditando) {
      this.calendarioService.actualizarEvento(this.eventoEditando.id, eventoData)
        .subscribe({
          next: () => {
            this.mostrarNotificacion('Evento actualizado correctamente', 'success');
            this.cerrarModal();
          },
          error: (error) => {
            console.error('Error al actualizar evento:', error);
            this.mostrarNotificacion('Error al actualizar el evento', 'error');
          }
        });
    } else {
      this.calendarioService.crearEvento(eventoData)
        .subscribe({
          next: () => {
            this.mostrarNotificacion('Evento creado correctamente', 'success');
            this.cerrarModal();
          },
          error: (error) => {
            console.error('Error al crear evento:', error);
            this.mostrarNotificacion('Error al crear el evento', 'error');
          }
        });
    }
  }

  eliminarEvento(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      return;
    }

    this.calendarioService.eliminarEvento(id)
      .subscribe({
        next: () => {
          this.mostrarNotificacion('Evento eliminado correctamente', 'success');
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al eliminar evento:', error);
          this.mostrarNotificacion('Error al eliminar el evento', 'error');
        }
      });
  }

  abrirModalDetalles(evento: EventoCalendarioExtendido): void {
    this.ocultarTooltip();
    this.mostrarModalEvento = false;
    this.eventoEditando = evento;
    this.mostrarModalDetalles = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.ocultarTooltip(); // Agregar esta línea
    this.mostrarModalEvento = false;
    this.mostrarModalDetalles = false;
    this.eventoEditando = null;
    this.eventoForm.reset();
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.eventoForm.controls).forEach(key => {
      this.eventoForm.get(key)?.markAsTouched();
    });
  }

  // ==================== TOOLTIP ====================

  mostrarTooltip(evento: EventoCalendarioExtendido, event: MouseEvent): void {
    this.tooltipEvento = evento;
    this.tooltipPosicion = {
      x: event.clientX + 10,
      y: event.clientY + 10
    };
    this.tooltipVisible = true;
  }

  ocultarTooltip(): void {
    this.tooltipVisible = false;
    this.tooltipEvento = null;
  }

  // ==================== UTILIDADES ====================

  esMesActual(fecha: Date): boolean {
    return fecha.getMonth() === this.fechaSeleccionada.getMonth() &&
      fecha.getFullYear() === this.fechaSeleccionada.getFullYear();
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  obtenerColorEvento(tipoEvento: string): string {
    const colores: { [key: string]: string } = {
      'Limpieza': 'border-indigo-500',
      'Mantenimiento': 'border-indigo-500'
    };
    return colores[tipoEvento] || 'border-indigo-500';
  }

  formatearFecha(fecha: string): string {
    // El backend puede enviar la fecha en formato 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'
    // Extraemos solo la parte de la fecha
    const fechaSolo = fecha.split('T')[0];
    const [year, month, day] = fechaSolo.split('-').map(Number);

    // Crear fecha con año, mes (0-indexed), día
    const fechaObj = new Date(year, month - 1, day);

    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearHora(hora: string): string {
    return this.calendarioService.formatearHora(hora);
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success'): void {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }
}
