import { Component, OnInit, OnDestroy } from '@angular/core';
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
  VistaCalendario
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

  // Datos
  eventos: EventoCalendarioExtendido[] = [];
  eventosFiltrados: EventoCalendarioExtendido[] = [];
  usuarios: Usuario[] = [];
  departamentos: Departamento[] = [];

  // Estados
  cargando = false;
  vistaActual: VistaCalendario = 'mes';
  fechaSeleccionada = new Date();

  // Formularios
  eventoForm: FormGroup;
  filtrosForm: FormGroup;

  // Modales
  mostrarModalEvento = false;
  mostrarModalDetalles = false;
  eventoEditando: EventoCalendarioExtendido | null = null;

  // Tooltip
  tooltipVisible = false;
  tooltipEvento: EventoCalendarioExtendido | null = null;
  tooltipPosicion = { x: 0, y: 0 };

  // Configuración
  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Datos para selects
  tiposCalendario = [
    { id: 1, descripcion: 'Administrativo' },
    { id: 2, descripcion: 'Operativo' },
    { id: 3, descripcion: 'Mantenimiento' }
  ];

  tiposEvento = [
    { id: 1, descripcion: 'Reunión' },
    { id: 2, descripcion: 'Capacitación' },
    { id: 3, descripcion: 'Entrevista' },
    { id: 4, descripcion: 'Evento de Equipo' },
    { id: 5, descripcion: 'Vacaciones' },
    { id: 6, descripcion: 'Licencia Médica' },
    { id: 7, descripcion: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    public calendarioService: CalendarioService  // IMPORTANTE: public para usar en template
  ) {
    this.eventoForm = this.fb.group({
      idTipoCalendario: ['', Validators.required],
      idTipoEventoCalendario: ['', Validators.required],
      idDep: ['', Validators.required],
      idUser: ['', Validators.required],
      fecha: ['', Validators.required],
      observaciones: ['']
    });

    this.filtrosForm = this.fb.group({
      idUsuario: [''],
      idDepartamento: ['']
    });
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

  // Cargar eventos
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

  // Cargar usuarios y roles en paralelo
  forkJoin({
    usuarios: this.calendarioService.obtenerUsuariosActivos(),
    rolesUsuarios: this.calendarioService.obtenerRolesUsuarios(),
    departamentos: this.calendarioService.obtenerDepartamentosActivos()
  })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ usuarios, rolesUsuarios, departamentos }) => {
        // Obtener IDs de usuarios con rol "emp"
        const empleadosIds = rolesUsuarios
          .filter(ur => ur.nombre === 'emp')
          .map(ur => ur.idUsuario);

        // Filtrar usuarios que sean empleados
        this.usuarios = usuarios.filter(u => empleadosIds.includes(u.id));
        this.departamentos = departamentos;

        // console.log('Usuarios empleados cargados:', this.usuarios.length);
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

    // Filtrar eventos según vista actual
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
    this.ocultarTooltip(); // ✅ AGREGAR ESTA LÍNEA
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
    this.ocultarTooltip(); // ✅ AGREGAR ESTA LÍNEA
    this.aplicarFiltros();
  }

  irAHoy(): void {
    this.fechaSeleccionada = new Date();
    this.ocultarTooltip(); // ✅ AGREGAR ESTA LÍNEA
    this.aplicarFiltros();
  }

  cambiarVista(vista: VistaCalendario): void {
    this.vistaActual = vista;
    this.ocultarTooltip(); // ✅ AGREGAR ESTA LÍNEA
    this.aplicarFiltros();
  }

  // ==================== VISTA MENSUAL ====================

  get diasDelMes(): Date[] {
    const primerDia = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), 1);
    const ultimoDia = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, 0);

    const primerDiaSemana = (primerDia.getDay() === 0) ? 6 : primerDia.getDay() - 1;
    const dias: Date[] = [];

    // Días del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = new Date(primerDia);
      dia.setDate(dia.getDate() - (i + 1));
      dias.push(dia);
    }

    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), dia));
    }

    // Días del mes siguiente
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

  // ==================== CRUD EVENTOS ====================

  abrirModalEvento(fecha?: Date): void {
    this.eventoEditando = null;
    this.eventoForm.reset();

    if (fecha) {
      const fechaStr = this.calendarioService.formatearFechaParaBackend(fecha);
      this.eventoForm.patchValue({ fecha: fechaStr });
    }

    this.mostrarModalEvento = true;
  }

  editarEvento(evento: EventoCalendarioExtendido): void {
    this.eventoEditando = evento;

    this.eventoForm.patchValue({
      idTipoCalendario: evento.idTipoCalendario,
      idTipoEventoCalendario: evento.idTipoEventoCalendario,
      idDep: evento.idDepartamento,
      idUser: evento.idUsuario,
      fecha: evento.fecha,
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

    const eventoData: EventoCalendario = this.eventoForm.value;

    if (this.eventoEditando) {
      // Actualizar
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
      // Crear
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
    this.eventoEditando = evento;
    this.mostrarModalDetalles = true;
  }

  cerrarModal(): void {
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
      'Reunión': 'bg-blue-100 border-blue-500',
      'Capacitación': 'bg-green-100 border-green-500',
      'Entrevista': 'bg-purple-100 border-purple-500',
      'Evento de Equipo': 'bg-orange-100 border-orange-500',
      'Vacaciones': 'bg-yellow-100 border-yellow-500',
      'Licencia Médica': 'bg-red-100 border-red-500',
      'Otro': 'bg-gray-100 border-gray-500'
    };
    return colores[tipoEvento] || 'bg-indigo-100 border-indigo-500';
  }

  formatearFecha(fecha: string): string {
    const fechaObj = new Date(fecha + 'T00:00:00');
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success'): void {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    // Aquí podrías integrar ngx-toastr o tu sistema de notificaciones
  }
}
