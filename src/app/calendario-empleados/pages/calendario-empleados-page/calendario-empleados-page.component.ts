import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
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
  TipoEventoCalendario,
  TipoCalendario
} from '../../services/calendario.service';
import { AuthService } from '../../../auth/services/auth.service';

import { MiniMapComponent } from '../../../shared/components/mini-map/mini-map.component';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-calendario-empleados-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MiniMapComponent],
  templateUrl: './calendario-empleados-page.component.html',
  styleUrls: ['./calendario-empleados-page.component.css']
})
export class CalendarioEmpleadosPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private departamentosConMapa: Map<number, { lng: number; lat: number }> = new Map();

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
  // ✅ NUEVO - Modal para mostrar el mapa
  mostrarModalMapa = false;
  eventoEditando: EventoCalendarioExtendido | null = null;

  tooltipVisible = false;
  tooltipEvento: EventoCalendarioExtendido | null = null;
  tooltipPosicion = { x: 0, y: 0 };

  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  horasDia: string[] = [];

  tiposCalendario: TipoCalendario[] = [];

  tiposEvento: TipoEventoCalendario[] = [];

  // ✅ NUEVAS PROPIEDADES PARA CONTROL DE PERMISOS
  esEmpleado = false;
  usuarioLogueadoId: number | null = null;
  tiposCalendarioPermitidos: number[] = [];

  // ==================== NUEVAS PROPIEDADES PARA EXPORTACIÓN ====================
  mostrarModalExport = false;
  accionExport: 'descargar' | 'enviar' = 'descargar';
  tipoArchivoExport: 'excel' | 'pdf' | 'imagen' = 'excel';
  emailDestinoExport = '';

  isDownloading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    public calendarioService: CalendarioService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private departamentosService: DepartamentosService
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
      idDepartamento: [''],
      idTipoCalendario: ['']
    });

    for (let i = 0; i < 24; i++) {
      this.horasDia.push(`${String(i).padStart(2, '0')}:00`);
    }

    this.eventoForm.get('idTipoEventoCalendario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcularHoraFin());

    this.eventoForm.get('horaInicio')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcularHoraFin());
  }

  ngOnInit(): void {
    this.verificarRolUsuario();
    this.cargarDatos();
    this.suscribirAEventos();
    this.suscribirAFiltros();
    this.cargarDepartamentosConMapa();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== ✅ VERIFICACIÓN DE ROL Y CALENDARIOS ====================

  verificarRolUsuario(): void {
    const user = this.authService.user();

    if (user) {
      this.usuarioLogueadoId = user.id;

      this.esEmpleado = user.roles?.includes('emp') ?? false;

      this.calendarioService.obtenerCalendariosPorUsuario(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (calendarios) => {
            this.tiposCalendarioPermitidos = calendarios.map(cal => cal.idCalendar);

            this.tiposCalendario = calendarios.map(cal => ({
              id: cal.idCalendar,
              descripcion: cal.descCalendar,
              activo: true
            }));

            if (this.esEmpleado && this.usuarioLogueadoId !== null) {
              this.filtrosForm.patchValue({
                idUsuario: this.usuarioLogueadoId.toString()
              });

              this.filtrosForm.get('idUsuario')?.disable();
            }

            this.aplicarFiltros();
          },
          error: (error) => {
            this.tiposCalendarioPermitidos = [];
            this.tiposCalendario = [];
            this.aplicarFiltros();
          }
        });
    }
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
          this.mostrarNotificacion('Error al cargar datos', 'error');
        }
      });
  }

  suscribirAEventos(): void {
    this.calendarioService.eventos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(eventos => {
        this.eventos = eventos;
        if (this.tiposCalendarioPermitidos.length > 0 || !this.usuarioLogueadoId) {
          this.aplicarFiltros();
        }
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
    const tipoCalendarioSeleccionado = this.filtrosForm.get('idTipoCalendario')?.value
      ? Number(this.filtrosForm.get('idTipoCalendario')?.value)
      : null;

    const filtros: FiltrosCalendario = {
      idsTipoCalendario: tipoCalendarioSeleccionado
        ? [tipoCalendarioSeleccionado]
        : (this.tiposCalendarioPermitidos.length > 0
            ? this.tiposCalendarioPermitidos
            : undefined),

      idUsuario: this.esEmpleado && this.usuarioLogueadoId
        ? this.usuarioLogueadoId
        : (this.filtrosForm.get('idUsuario')?.value
          ? Number(this.filtrosForm.get('idUsuario')?.value)
          : undefined),

      idDepartamento: this.filtrosForm.get('idDepartamento')?.value
        ? Number(this.filtrosForm.get('idDepartamento')?.value)
        : undefined
    };

    // ✅ CORREGIDO - Pasar eventos y filtros
    this.eventosFiltrados = this.calendarioService.filtrarEventos(this.eventos, filtros);
  }

  limpiarFiltros(): void {
    if (!this.esEmpleado) {
      this.filtrosForm.patchValue({
        idUsuario: '',
        idDepartamento: '',
        idTipoCalendario: ''
      });
    } else {
      this.filtrosForm.patchValue({
        idDepartamento: '',
        idTipoCalendario: ''
      });
    }
  }

  cargarDepartamentosConMapa(): void {
    this.departamentosService.getDepartamentosRaw()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (deptos) => {
          deptos.forEach(depto => {
            try {
              const [lng, lat] = depto.lngLat.split(',').map(coord => parseFloat(coord.trim()));
              if (!isNaN(lng) && !isNaN(lat)) {
                this.departamentosConMapa.set(depto.id, { lng, lat });
              }
            } catch (error) {
              console.error(`Error parseando coordenadas para depto ${depto.id}`);
            }
          });
        },
        error: (error) => {
          console.error('Error cargando departamentos con mapa:', error);
        }
      });
  }

  // ==================== NAVEGACIÓN ====================

  get tituloCalendario(): string {
    if (this.vistaActual === 'dia') {
      return this.fechaSeleccionada.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } else if (this.vistaActual === 'semana') {
      const primerDia = this.diasDeLaSemana[0];
      const ultimoDia = this.diasDeLaSemana[6];
      return `${primerDia.getDate()} - ${ultimoDia.getDate()} de ${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
    } else {
      return `${this.meses[this.fechaSeleccionada.getMonth()]} ${this.fechaSeleccionada.getFullYear()}`;
    }
  }

  get diasDeLaSemana(): Date[] {
    const dias: Date[] = [];
    const primerDia = new Date(this.fechaSeleccionada);
    primerDia.setDate(primerDia.getDate() - primerDia.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const dia = new Date(primerDia);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }

    return dias;
  }

  get diasDelMes(): Date[] {
    const primerDiaMes = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), 1);
    const ultimoDiaMes = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, 0);

    let primerDiaGrid = new Date(primerDiaMes);
    primerDiaGrid.setDate(primerDiaGrid.getDate() - (primerDiaGrid.getDay() === 0 ? 6 : primerDiaGrid.getDay() - 1));

    const dias: Date[] = [];
    const diaActual = new Date(primerDiaGrid);

    for (let i = 0; i < 42; i++) {
      dias.push(new Date(diaActual));
      diaActual.setDate(diaActual.getDate() + 1);
    }

    return dias;
  }

  irAHoy(): void {
    this.fechaSeleccionada = new Date();
  }

  anteriorPeriodo(): void {
    if (this.vistaActual === 'dia') {
      this.fechaSeleccionada.setDate(this.fechaSeleccionada.getDate() - 1);
    } else if (this.vistaActual === 'semana') {
      this.fechaSeleccionada.setDate(this.fechaSeleccionada.getDate() - 7);
    } else {
      this.fechaSeleccionada.setMonth(this.fechaSeleccionada.getMonth() - 1);
    }
    this.fechaSeleccionada = new Date(this.fechaSeleccionada);
  }

  siguientePeriodo(): void {
    if (this.vistaActual === 'dia') {
      this.fechaSeleccionada.setDate(this.fechaSeleccionada.getDate() + 1);
    } else if (this.vistaActual === 'semana') {
      this.fechaSeleccionada.setDate(this.fechaSeleccionada.getDate() + 7);
    } else {
      this.fechaSeleccionada.setMonth(this.fechaSeleccionada.getMonth() + 1);
    }
    this.fechaSeleccionada = new Date(this.fechaSeleccionada);
  }

  cambiarVista(vista: VistaCalendario): void {
    this.vistaActual = vista;
  }

  // ==================== EVENTOS POR FECHA ====================

  obtenerEventosPorFecha(fecha: Date): EventoCalendarioExtendido[] {
    const fechaStr = this.calendarioService.formatearFechaParaBackend(fecha);

    return this.eventosFiltrados.filter(evento => {
      const eventoFecha = evento.fecha.split('T')[0];
      return eventoFecha === fechaStr;
    });
  }

  obtenerRangoFechas(): { inicio: Date; fin: Date } {
    if (this.vistaActual === 'dia') {
      return { inicio: this.fechaSeleccionada, fin: this.fechaSeleccionada };
    } else if (this.vistaActual === 'semana') {
      const dias = this.diasDeLaSemana;
      return { inicio: dias[0], fin: dias[6] };
    } else {
      const inicioMes = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), 1);
      const finMes = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, 0);
        return { inicio: inicioMes, fin: finMes };
    }
  }

  // ==================== VISTA DIARIA - POSICIONAMIENTO ====================

  obtenerPosicionEvento(evento: EventoCalendarioExtendido): { top: number; height: number } {
    const horaInicio = this.convertirHoraAMinutos(evento.horaInicio);
    const horaFin = this.convertirHoraAMinutos(evento.horaFin);

    const pixelesPorMinuto = 60 / 60;

    return {
      top: 48 + (horaInicio * pixelesPorMinuto),
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


// ==================== ✅ CRUD EVENTOS - MODIFICADOS CON RESTRICCIONES ====================

  abrirModalEvento(fecha?: Date): void {
    if (this.esEmpleado) {
      this.mostrarNotificacion('No tienes permisos para crear eventos', 'warning');
      return;
    }

    this.ocultarTooltip();
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
    if (this.esEmpleado) {
      this.mostrarNotificacion('No tienes permisos para editar eventos', 'warning');
      return;
    }

    this.ocultarTooltip();
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
            this.mostrarNotificacion('Error al crear el evento', 'error');
          }
        });
    }
  }

  eliminarEvento(id: number): void {
    if (this.esEmpleado) {
      this.mostrarNotificacion('No tienes permisos para eliminar eventos', 'warning');
      return;
    }

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

  // ==================== ✅ NUEVO - MODAL DE MAPA ====================

  abrirModalMapa(evento: EventoCalendarioExtendido, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.ocultarTooltip();
    this.eventoEditando = evento;
    this.mostrarModalMapa = true;
    this.cdr.detectChanges();
  }

  cerrarModalMapa(): void {
    this.mostrarModalMapa = false;
    this.cdr.detectChanges();
  }

  /**
   * Verifica si un evento tiene ubicación válida
   * NOTA: Como tu interfaz Departamento del calendario no tiene lngLat,
   * este método siempre retornará true si hay departamento.
   * Si quieres validación real, necesitas agregar lngLat a tu interface.
   */
  tieneUbicacion(evento: EventoCalendarioExtendido): boolean {
    return !!evento.idDepartamento && !!evento.nombreDepartamento;
  }

  obtenerCoordenadasDepartamento(evento: EventoCalendarioExtendido): { lng: number; lat: number } | null {
    if (!evento.idDepartamento) {
      return null;
    }

    // Buscar en el Map de departamentos con coordenadas
    return this.departamentosConMapa.get(evento.idDepartamento) || null;
  }

  cerrarModal(): void {
    this.ocultarTooltip();
    this.mostrarModalEvento = false;
    this.mostrarModalDetalles = false;
    this.mostrarModalMapa = false;
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
    return 'border-indigo-500';
  }

  calcularHoraFin(): void {
    const idTipoEvento = this.eventoForm.get('idTipoEventoCalendario')?.value;
    const horaInicio = this.eventoForm.get('horaInicio')?.value;

    if (!idTipoEvento || !horaInicio) {
      return;
    }

    const tipoEvento = this.tiposEvento.find(te => te.id === Number(idTipoEvento));

    if (!tipoEvento || !tipoEvento.duracionMinutos) {
      return;
    }

    const [horas, minutos] = horaInicio.split(':').map(Number);
    const minutosInicio = horas * 60 + minutos;

    const minutosFin = minutosInicio + tipoEvento.duracionMinutos;

    const horasFin = Math.floor(minutosFin / 60) % 24;
    const minutosFinales = minutosFin % 60;
    const horaFin = `${String(horasFin).padStart(2, '0')}:${String(minutosFinales).padStart(2, '0')}`;

    this.eventoForm.patchValue({ horaFin }, { emitEvent: false });
  }

  formatearFecha(fecha: string): string {
    const fechaSolo = fecha.split('T')[0];
    const [year, month, day] = fechaSolo.split('-').map(Number);
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

  private mostrarNotificacion(titulo: string, tipo: 'success' | 'error' | 'warning' | 'info', mensaje?: string): void {
    const config: any = {
      title: titulo,
      icon: tipo,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    };

    if (mensaje) {
      config.text = mensaje;
    }

    Swal.fire(config);
  }

  // ==================== EXPORTACIÓN Y ENVÍO ====================

  abrirModalDescarga(): void {
    this.accionExport = 'descargar';
    this.tipoArchivoExport = 'excel';
    this.mostrarModalExport = true;
  }

  abrirModalEnvio(): void {
    this.accionExport = 'enviar';
    this.tipoArchivoExport = 'excel';

    // Obtener email del usuario logueado
    const user = this.authService.user();
    this.emailDestinoExport = user?.email || '';

    this.mostrarModalExport = true;
  }

  cerrarModalExport(): void {
    this.mostrarModalExport = false;
    this.tipoArchivoExport = 'excel';
    this.emailDestinoExport = '';
  }

  confirmarExportacion(): void {
    if (this.accionExport === 'descargar') {
      this.confirmarDescarga();
    } else {
      this.confirmarEnvio();
    }
  }

  private confirmarDescarga(): void {
    Swal.fire({
      title: '¿Descargar calendario?',
      html: `
        <p>Se descargará el calendario en formato <strong>${this.tipoArchivoExport.toUpperCase()}</strong></p>
        <p class="text-sm text-gray-600 mt-2">
          Eventos a exportar: <strong>${this.eventosFiltrados.length}</strong>
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, descargar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarDescarga();
      }
    });
  }

  private confirmarEnvio(): void {
    console.log('🔵 [1] confirmarEnvio() INICIADO');
    console.log('🔵 Email actual:', this.emailDestinoExport);

    // ✅ VALIDAR EMAIL ANTES DE MOSTRAR EL MODAL
    if (!this.emailDestinoExport || this.emailDestinoExport.trim() === '') {
      console.log('❌ [2] Email vacío');
      this.mostrarNotificacion('Debe ingresar un email válido', 'warning');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailDestinoExport)) {
      console.log('❌ [3] Email con formato inválido');
      this.mostrarNotificacion('El formato del email no es válido', 'warning');
      return;
    }

    console.log('✅ [4] Email válido, mostrando SweetAlert');

    Swal.fire({
      title: '¿Enviar calendario por email?',
      html: `
        <p>Se enviará el calendario en formato <strong>${this.tipoArchivoExport.toUpperCase()}</strong> a:</p>
        <p class="text-indigo-600 font-semibold mt-2">${this.emailDestinoExport}</p>
        <p class="text-sm text-gray-600 mt-2">
          Eventos a enviar: <strong>${this.eventosFiltrados.length}</strong>
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      console.log('🔵 [5] SweetAlert resultado:', result);

      if (result.isConfirmed) {
        console.log('✅ [6] Usuario confirmó - ejecutando envío');
        this.ejecutarEnvio();
      } else {
        console.log('❌ [7] Usuario canceló');
      }
    });
  }

  private ejecutarDescarga(): void {
    this.cargando = true;

    // ⚠️ NO cerrar el modal todavía - necesitamos tipoArchivoExport
    this.mostrarModalExport = false;

    const filtros = this.obtenerFiltrosActuales();
    const user = this.authService.user();
    const userRole = this.esEmpleado ? 'emp' : 'admin';
    const userId = user?.id || 0;

    console.log('📥 Descargando calendario...');
    console.log('Tipo de archivo:', this.tipoArchivoExport);  // ← Agregado para debug

    this.calendarioService.descargarCalendario(
      filtros,
      this.tipoArchivoExport,
      userRole,
      userId
    ).subscribe({
      next: (blob) => {
        this.cargando = false;
        console.log(`✅ Blob recibido: ${blob.size} bytes, tipo: ${blob.type}`);

        // Determinar extensión según tipo
        let extension = 'xlsx';
        if (this.tipoArchivoExport === 'pdf') {
          extension = 'pdf';
        } else if (this.tipoArchivoExport === 'imagen') {
          extension = 'png';
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `calendario_${Date.now()}.${extension}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.mostrarNotificacion('Calendario descargado correctamente', 'success');

        // ✅ AHORA SÍ resetear el tipo de archivo
        this.tipoArchivoExport = 'excel';
      },
      error: (error) => {
        this.cargando = false;
        console.error('❌ Error al descargar calendario:', error);
        this.mostrarNotificacion('Error al descargar el calendario', 'error');

        // ✅ Resetear también en caso de error
        this.tipoArchivoExport = 'excel';
      }
    });
  }

  private descargarArchivo(blob: Blob, filtros: FiltrosCalendario): void {
    const extension = this.tipoArchivoExport === 'excel' ? 'xlsx' :
                     this.tipoArchivoExport === 'pdf' ? 'pdf' : 'png';

    const timestamp = new Date().getTime();
    const fileName = `calendario_${timestamp}.${extension}`;

    // Crear link y forzar descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar memoria
    window.URL.revokeObjectURL(url);
  }

  private ejecutarEnvio(): void {
    console.log('🟢 [8] ejecutarEnvio() INICIADO');

    this.cargando = true;
    this.mostrarModalExport = false;

    const filtros = this.obtenerFiltrosActuales();
    const user = this.authService.user();
    const userRole = this.esEmpleado ? 'emp' : 'admin';
    const userId = user?.id || 0;

    console.log('🟢 [9] Datos preparados:');
    console.log('  - Email destino:', this.emailDestinoExport);
    console.log('  - Tipo archivo:', this.tipoArchivoExport);
    console.log('  - Filtros:', filtros);
    console.log('  - Rol:', userRole);
    console.log('  - User ID:', userId);

    console.log('📧 [10] Llamando al servicio...');

    this.calendarioService.enviarCalendarioPorEmail(
      filtros,
      this.tipoArchivoExport,
      this.emailDestinoExport,
      userRole,
      userId
    ).subscribe({
      next: (response) => {
        console.log('✅ [11] Respuesta recibida:', response);

        this.cargando = false;
        this.mostrarNotificacion('Calendario enviado por email correctamente', 'success');
        this.emailDestinoExport = '';
      },
      error: (error) => {
        console.error('❌ [12] Error recibido:', error);

        this.cargando = false;
        this.mostrarNotificacion('Error al enviar el calendario por email', 'error');
        this.emailDestinoExport = '';
      }
    });
  }

  private obtenerFiltrosActuales(): FiltrosCalendario {
    const tipoCalendarioSeleccionado = this.filtrosForm.get('idTipoCalendario')?.value
      ? Number(this.filtrosForm.get('idTipoCalendario')?.value)
      : null;

    const filtros: FiltrosCalendario = {
      idsTipoCalendario: tipoCalendarioSeleccionado
        ? [tipoCalendarioSeleccionado]
        : (this.tiposCalendarioPermitidos.length > 0
            ? this.tiposCalendarioPermitidos
            : undefined),

      idUsuario: this.esEmpleado && this.usuarioLogueadoId
        ? this.usuarioLogueadoId
        : (this.filtrosForm.get('idUsuario')?.value
          ? Number(this.filtrosForm.get('idUsuario')?.value)
          : undefined),

      idDepartamento: this.filtrosForm.get('idDepartamento')?.value
        ? Number(this.filtrosForm.get('idDepartamento')?.value)
        : undefined
    };

    return filtros;
  }

}
