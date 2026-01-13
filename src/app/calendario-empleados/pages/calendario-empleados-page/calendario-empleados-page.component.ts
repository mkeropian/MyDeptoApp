// calendario-empleados-page.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
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
  TipoCalendario,
  FormularioCompleto,
  CampoFormulario
} from '../../services/calendario.service';
import { AuthService } from '../../../auth/services/auth.service';

import { MiniMapComponent } from '../../../shared/components/mini-map/mini-map.component';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { NotificationService } from '../../../shared/services/notification.service';
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
  tiposEventoFiltrados: TipoEventoCalendario[] = [];

  esEmpleado = false;
  usuarioLogueadoId: number | null = null;
  tiposCalendarioPermitidos: number[] = [];

  mostrarModalExport = false;
  accionExport: 'descargar' | 'enviar' = 'descargar';
  tipoArchivoExport: 'excel' | 'pdf' | 'imagen' = 'excel';
  subtipoImagen: 'lista' | 'calendario' | 'resumen' = 'lista';
  emailDestinoExport = '';

  rangoExport: 'vistaActual' | 'rangoPersonalizado' | 'historial' = 'vistaActual';
  fechaInicioPersonalizada: string = '';
  fechaFinPersonalizada: string = '';
  errorRangoPersonalizado: string = '';

  isDownloading = signal<boolean>(false);

  // ==================== NUEVAS PROPIEDADES PARA FORMULARIOS DINÁMICOS ====================

  formularioActual: FormularioCompleto | null = null;
  camposFormularioActual: CampoFormulario[] = [];
  cargandoFormulario = false;

  constructor(
    private fb: FormBuilder,
    public calendarioService: CalendarioService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private departamentosService: DepartamentosService,
    private notificationService: NotificationService
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

    // Listener para cambios en tipo de evento
    this.eventoForm.get('idTipoEventoCalendario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((idTipoEvento) => {
        if (idTipoEvento) {
          this.cargarFormularioDinamico(idTipoEvento);
        }
        this.calcularHoraFin();
      });

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
          this.notificationService.mostrarNotificacion('Error al cargar eventos', 'error');
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
          this.notificationService.mostrarNotificacion('Error al cargar datos', 'error');
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

  // ==================== CARGA DINÁMICA DE FORMULARIO ====================

  cargarFormularioDinamico(idTipoEvento: number): void {
    console.log('🔵 [1] cargarFormularioDinamico llamado con idTipoEvento:', idTipoEvento);
    this.cargandoFormulario = true;

    // ✅ FORZAR detección de cambios ANTES de cargar
    this.cdr.detectChanges();

    this.calendarioService.obtenerFormularioPorTipoEvento(idTipoEvento)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (formulario) => {
          console.log('🟢 [2] Formulario recibido del backend:', formulario);
          this.formularioActual = formulario;

          if (formulario && formulario.campos) {
            console.log('🟢 [3] Cantidad de campos:', formulario.campos.length);
            this.camposFormularioActual = formulario.campos;
            this.reconstruirFormulario(formulario.campos);

            // ✅ FORZAR detección de cambios DESPUÉS de reconstruir
            setTimeout(() => {
              this.cargandoFormulario = false;
              console.log('🟢 [4] cargandoFormulario = false');
              this.cdr.detectChanges();
              console.log('🟢 [4.5] detectChanges() ejecutado');
            }, 0);
          } else {
            console.log('🔴 [3] NO hay campos en el formulario');
            this.camposFormularioActual = [];
            this.cargandoFormulario = false;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('🔴 [ERROR] Error al cargar formulario:', error);
          this.cargandoFormulario = false;
          this.cdr.detectChanges();
        }
      });
  }

  reconstruirFormulario(campos: CampoFormulario[]): void {
    console.log('🔵 [5] reconstruirFormulario llamado con', campos.length, 'campos');

    const group: { [key: string]: FormControl } = {};

    // GUARDAR valores actuales ANTES de recrear el form
    const idTipoCalendario = this.eventoForm.get('idTipoCalendario')?.value;
    const idTipoEventoCalendario = this.eventoForm.get('idTipoEventoCalendario')?.value;

    console.log('🟡 [6] Valores guardados - Calendario:', idTipoCalendario, 'Evento:', idTipoEventoCalendario);

    // Crear controles para cada campo del formulario
    campos.forEach(campo => {
      const validators = campo.requerido ? [Validators.required] : [];
      let valorDefault: any = '';

      if (campo.tipo_campo === 'number') {
        valorDefault = null;
      } else if (campo.tipo_campo === 'checkbox') {
        valorDefault = false;
      }

      const valorActual = this.eventoForm.get(campo.nombre_campo)?.value;
      const valorFinal = (valorActual !== undefined && valorActual !== null && valorActual !== '')
        ? valorActual
        : valorDefault;

      group[campo.nombre_campo] = new FormControl(valorFinal, validators);

      console.log(`   - Campo "${campo.nombre_campo}": valor = ${valorFinal}`);
    });

    // Recrear el FormGroup
    this.eventoForm = this.fb.group(group);

    console.log('🟢 [7] FormGroup recreado con', Object.keys(group).length, 'controles');

    // RESTAURAR los valores de tipo calendario y tipo evento
    this.eventoForm.patchValue({
      idTipoCalendario: idTipoCalendario,
      idTipoEventoCalendario: idTipoEventoCalendario
    }, { emitEvent: false });

    console.log('🟢 [8] Valores restaurados al form');
    console.log('🟢 [9] Form actual:', this.eventoForm.value);

    // Si estamos editando, poblar con los datos del evento
    if (this.eventoEditando) {
      console.log('🟡 [10] Poblando form para edición');
      this.poblarFormularioParaEdicion(this.eventoEditando);
    }

    // ✅ IMPORTANTE: Re-suscribir al cambio de CALENDARIO
    this.eventoForm.get('idTipoCalendario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((nuevoIdCalendario) => {
        console.log('🔄 [RECONSTRUIR] Calendario cambió a:', nuevoIdCalendario);

        if (nuevoIdCalendario && nuevoIdCalendario !== idTipoCalendario) {
          // Resetear estado
          this.formularioActual = null;
          this.camposFormularioActual = [];

          // Recrear formulario básico
          this.eventoForm = this.fb.group({
            idTipoCalendario: [nuevoIdCalendario, Validators.required],
            idTipoEventoCalendario: [{ value: '', disabled: true }, Validators.required]
          });

          console.log('🔄 Formulario reseteado - cargando eventos para calendario:', nuevoIdCalendario);

          // Cargar eventos del nuevo calendario
          this.cargarEventosPermitidos(Number(nuevoIdCalendario));
        }
      });

    // Re-suscribir al cambio de tipo de evento
    this.eventoForm.get('idTipoEventoCalendario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((idTipoEvento) => {
        if (idTipoEvento && idTipoEvento !== idTipoEventoCalendario) {
          console.log('🔵 Tipo de evento cambió a:', idTipoEvento);
          this.cargarFormularioDinamico(idTipoEvento);
        }
      });

    // Re-suscribir al cálculo de hora fin
    this.eventoForm.get('horaInicio')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcularHoraFin());

    console.log('🟢 [11] Listeners re-suscritos');
  }

  poblarFormularioParaEdicion(evento: EventoCalendarioExtendido): void {
    const valores: any = {
      idTipoCalendario: evento.idTipoCalendario,
      idTipoEventoCalendario: evento.idTipoEventoCalendario,
    };

    this.camposFormularioActual.forEach(campo => {
      const nombreCampo = campo.nombre_campo;

      if (nombreCampo === 'fecha' || nombreCampo === 'fecha_inicio') {
        valores[nombreCampo] = evento.fecha.split('T')[0];
      } else if (nombreCampo === 'fecha_fin' && evento.fechaFin) {
        valores[nombreCampo] = evento.fechaFin.split('T')[0];
      } else if (nombreCampo === 'horaInicio') {
        valores[nombreCampo] = evento.horaInicio.substring(0, 5);
      } else if (nombreCampo === 'horaFin') {
        valores[nombreCampo] = evento.horaFin.substring(0, 5);
      } else if (nombreCampo === 'idUser') {
        valores[nombreCampo] = evento.idUsuario;
      } else if (nombreCampo === 'idDep') {
        valores[nombreCampo] = evento.idDepartamento;
      } else if (nombreCampo === 'observaciones') {
        valores[nombreCampo] = evento.observaciones || '';
      } else if (nombreCampo === 'nombre_huesped') {
        valores[nombreCampo] = evento.nombreHuesped || '';
      } else if (nombreCampo === 'telefono_huesped') {
        valores[nombreCampo] = evento.telefonoHuesped || '';
      } else if (nombreCampo === 'email_huesped') {
        valores[nombreCampo] = evento.emailHuesped || '';
      } else if (nombreCampo === 'cantidad_personas') {
        valores[nombreCampo] = evento.cantidadPersonas;
      } else if (nombreCampo === 'monto') {
        valores[nombreCampo] = evento.monto ? parseFloat(evento.monto) : null;
      }
    });

    this.eventoForm.patchValue(valores);
  }

  // ==================== HELPERS PARA EL TEMPLATE DINÁMICO ====================

  esCampoInvalido(nombreCampo: string): boolean {
    const control = this.eventoForm.get(nombreCampo);
    return !!(control && control.invalid && control.touched);
  }

  obtenerOpcionesSelect(nombreCampo: string): any[] {
    if (nombreCampo === 'idTipoCalendario') {
      return this.tiposCalendario.filter(tc => tc.activo);
    } else if (nombreCampo === 'idTipoEventoCalendario') {
      return this.tiposEvento.filter(te => te.activo);
    } else if (nombreCampo === 'idUser') {
      return this.usuarios;
    } else if (nombreCampo === 'idDep') {
      return this.departamentos;
    }
    return [];
  }

  obtenerLabelOpcion(nombreCampo: string, opcion: any): string {
    if (nombreCampo === 'idTipoCalendario' || nombreCampo === 'idTipoEventoCalendario') {
      return opcion.descripcion;
    } else if (nombreCampo === 'idUser') {
      return opcion.nombreCompleto;
    } else if (nombreCampo === 'idDep') {
      return opcion.nombre;
    }
    return opcion.toString();
  }

  obtenerValueOpcion(nombreCampo: string, opcion: any): any {
    return opcion.id;
  }

  // ==================== NAVEGACIÓN Y VISTAS (SIN CAMBIOS) ====================

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

  // ==================== CRUD EVENTOS (SIN CAMBIOS EXCEPTO GUARDAR) ====================

  abrirModalEvento(fecha?: Date): void {
    if (this.esEmpleado) {
      this.notificationService.mostrarNotificacion('No tienes permisos para crear eventos', 'warning');
      return;
    }

    console.log('🔵 abrirModalEvento llamado');

    this.ocultarTooltip();
    this.eventoEditando = null;
    this.formularioActual = null;
    this.camposFormularioActual = [];

    // ✅ Resetear lista de eventos filtrados
    this.tiposEventoFiltrados = [];

    // ✅ Crear form con AMBOS campos desde el inicio (deshabilitado el segundo)
    this.eventoForm = this.fb.group({
      idTipoCalendario: ['', Validators.required],
      idTipoEventoCalendario: [{ value: '', disabled: true }, Validators.required]
    });

    console.log('🟢 Form básico creado');

    // Listener para cuando cambia el tipo de calendario

    this.eventoForm.get('idTipoCalendario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((idCalendario) => {
        console.log('🟡 idTipoCalendario cambió a:', idCalendario);

        if (idCalendario) {
          // ✅ Resetear campos dinámicos antes de cargar nuevos eventos
          this.formularioActual = null;
          this.camposFormularioActual = [];

          // ✅ Recrear el formulario desde cero con solo los 2 campos básicos
          const idCalendarioActual = this.eventoForm.get('idTipoCalendario')?.value;

          this.eventoForm = this.fb.group({
            idTipoCalendario: [idCalendarioActual, Validators.required],
            idTipoEventoCalendario: [{ value: '', disabled: true }, Validators.required]
          });

          // ✅ Re-suscribir al cambio de calendario (recursivo)
          this.eventoForm.get('idTipoCalendario')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((nuevoIdCalendario) => {
              if (nuevoIdCalendario && nuevoIdCalendario !== idCalendario) {
                console.log('🔄 Calendario cambió nuevamente a:', nuevoIdCalendario);
                // Cargar eventos del nuevo calendario
                this.cargarEventosPermitidos(Number(nuevoIdCalendario));
              }
            });

          console.log('🔄 Formulario reseteado a estado básico');

          // Cargar nuevos eventos permitidos
          this.cargarEventosPermitidos(Number(idCalendario));
        } else {
          // Si se limpia el calendario, resetear todo
          this.tiposEventoFiltrados = [];
          this.formularioActual = null;
          this.camposFormularioActual = [];

          const tipoEventoControl = this.eventoForm.get('idTipoEventoCalendario');
          if (tipoEventoControl) {
            tipoEventoControl.disable();
            tipoEventoControl.reset();
          }
        }

        this.cdr.detectChanges();
      });


    // Si hay fecha, guardarla temporalmente
    if (fecha) {
      const fechaStr = this.calendarioService.formatearFechaParaBackend(fecha);
      this.eventoForm.patchValue({ fecha: fechaStr });
    }

    this.mostrarModalEvento = true;
    console.log('🟢 Modal abierto');
  }

  cargarEventosPermitidos(idCalendario: number): void {
    this.calendarioService.obtenerEventosPermitidosPorCalendario(idCalendario).subscribe({
      next: (eventos) => {
        // ✅ Filtrar SOLO eventos que tengan formulario asociado
        this.tiposEventoFiltrados = eventos.filter(evento =>
          evento.activo && evento.id_formulario !== null && evento.id_formulario !== undefined
        );

        if (this.tiposEventoFiltrados.length === 0) {
          this.notificationService.mostrarNotificacion(
            'No hay eventos disponibles para este calendario. Configure eventos con formularios asociados.',
            'warning'
          );
          this.eventoForm.get('idTipoEventoCalendario')?.disable();
        } else {
          this.eventoForm.get('idTipoEventoCalendario')?.enable();

          // Listener para cargar formulario dinámico
          this.eventoForm.get('idTipoEventoCalendario')?.valueChanges.subscribe(idTipoEvento => {
            if (idTipoEvento) {
              this.cargarFormularioDinamico(idTipoEvento);
            }
          });
        }

        // Listener de cambio de calendario
        this.eventoForm.get('idTipoCalendario')?.valueChanges.subscribe(idCal => {
          if (idCal && idCal !== idCalendario) {
            this.formularioActual = null;
            this.camposFormularioActual = [];
            this.eventoForm.get('idTipoEventoCalendario')?.reset();
            this.cargarEventosPermitidos(idCal);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar eventos permitidos:', error);
        this.notificationService.mostrarNotificacion('Error al cargar tipos de evento', 'error');
      }
    });
  }

  editarEvento(evento: EventoCalendarioExtendido): void {
    if (this.esEmpleado) {
      this.notificationService.mostrarNotificacion('No tienes permisos para editar eventos', 'warning');
      return;
    }

    this.ocultarTooltip();
    this.eventoEditando = evento;

    this.cargarFormularioDinamico(evento.idTipoEventoCalendario);

    this.mostrarModalDetalles = false;
    this.mostrarModalEvento = true;
  }

  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.marcarCamposComoTocados();
      this.notificationService.mostrarNotificacion('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    const formValues = this.eventoForm.getRawValue();

    // Asegurar que horaInicio y horaFin tengan formato HH:MM:SS
    let horaInicio = formValues.horaInicio;
    let horaFin = formValues.horaFin;

    if (horaInicio && horaInicio.length === 5) {
      horaInicio = horaInicio + ':00';
    }
    if (horaFin && horaFin.length === 5) {
      horaFin = horaFin + ':00';
    }

    const evento: EventoCalendario = {
      idTipoCalendario: formValues.idTipoCalendario,
      idTipoEventoCalendario: formValues.idTipoEventoCalendario,
      idDep: formValues.idDep || null,
      idUser: formValues.idUser || null,
      fecha_inicio: formValues.fecha || formValues.fecha_inicio,
      fecha_fin: formValues.fecha_fin || null,
      horaInicio: horaInicio,
      horaFin: horaFin,
      observaciones: formValues.observaciones || null,
      nombre_huesped: formValues.nombre_huesped || null,
      telefono_huesped: formValues.telefono_huesped || null,
      email_huesped: formValues.email_huesped || null,
      cantidad_personas: formValues.cantidad_personas || null,
      monto: formValues.monto || null
    };

    if (this.eventoEditando) {
      this.calendarioService.actualizarEvento(this.eventoEditando.id, evento)
        .subscribe({
          next: () => {
            this.notificationService.mostrarNotificacion('Evento actualizado correctamente', 'success');
            this.cerrarModal();
          },
          error: (error) => {
            this.notificationService.mostrarNotificacion('Error al actualizar el evento', 'error');
          }
        });
    } else {
      this.calendarioService.crearEvento(evento)
        .subscribe({
          next: () => {
            this.notificationService.mostrarNotificacion('Evento creado correctamente', 'success');
            this.cerrarModal();
          },
          error: (error) => {
            this.notificationService.mostrarNotificacion('Error al crear el evento', 'error');
          }
        });
    }
  }

  eliminarEvento(id: number): void {
    if (this.esEmpleado) {
      this.notificationService.mostrarNotificacion('No tienes permisos para eliminar eventos', 'warning');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      return;
    }

    this.calendarioService.eliminarEvento(id)
      .subscribe({
        next: () => {
          this.notificationService.mostrarNotificacion('Evento eliminado correctamente', 'success');
          this.cerrarModal();
        },
        error: (error) => {
          this.notificationService.mostrarNotificacion('Error al eliminar el evento', 'error');
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

  tieneUbicacion(evento: EventoCalendarioExtendido): boolean {
    return !!evento.idDepartamento && !!evento.nombreDepartamento;
  }

  obtenerCoordenadasDepartamento(evento: EventoCalendarioExtendido): { lng: number; lat: number } | null {
    if (!evento.idDepartamento) {
      return null;
    }

    return this.departamentosConMapa.get(evento.idDepartamento) || null;
  }

  cerrarModal(): void {
    this.ocultarTooltip();
    this.mostrarModalEvento = false;
    this.mostrarModalDetalles = false;
    this.mostrarModalMapa = false;
    this.eventoEditando = null;
    this.eventoForm.reset();
    this.formularioActual = null;
    this.camposFormularioActual = [];
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.eventoForm.controls).forEach(key => {
      this.eventoForm.get(key)?.markAsTouched();
    });
  }

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
    // Asegurar formato HH:MM
    if (hora && hora.length > 5) {
      return hora.substring(0, 5);
    }
    return hora;
  }

  // ==================== EXPORTACIÓN (SIN CAMBIOS) ====================

  abrirModalDescarga(): void {
    this.accionExport = 'descargar';
    this.tipoArchivoExport = 'excel';
    this.mostrarModalExport = true;
  }

  abrirModalEnvio(): void {
    this.accionExport = 'enviar';
    this.tipoArchivoExport = 'excel';

    const user = this.authService.user();
    this.emailDestinoExport = user?.email || '';

    this.mostrarModalExport = true;
  }

  cerrarModalExport(): void {
    this.mostrarModalExport = false;
    this.tipoArchivoExport = 'excel';
    this.subtipoImagen = 'lista';
    this.emailDestinoExport = '';
    this.rangoExport = 'vistaActual';
    this.fechaInicioPersonalizada = '';
    this.fechaFinPersonalizada = '';
    this.errorRangoPersonalizado = '';
  }

  confirmarExportacion(): void {
    if (this.accionExport === 'descargar') {
      this.confirmarDescarga();
    } else {
      this.confirmarEnvio();
    }
  }

  private confirmarDescarga(): void {
    if (this.rangoExport === 'rangoPersonalizado') {
      if (!this.validarRangoPersonalizado()) {
        this.notificationService.mostrarNotificacion(this.errorRangoPersonalizado, 'warning');
        return;
      }
    }

    const cantidadEventos = this.eventosSegunRango;

    Swal.fire({
      title: '¿Descargar calendario?',
      html: `
        <p>Se descargará el calendario en formato <strong>${this.tipoArchivoExport.toUpperCase()}</strong></p>
        <p class="text-sm text-gray-600 mt-2">
          Eventos a exportar: <strong>${cantidadEventos}</strong>
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
    if (!this.emailDestinoExport || this.emailDestinoExport.trim() === '') {
      this.notificationService.mostrarNotificacion('Debe ingresar un email válido', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailDestinoExport)) {
      this.notificationService.mostrarNotificacion('El formato del email no es válido', 'warning');
      return;
    }

    if (this.rangoExport === 'rangoPersonalizado') {
      if (!this.validarRangoPersonalizado()) {
        this.notificationService.mostrarNotificacion(this.errorRangoPersonalizado, 'warning');
        return;
      }
    }

    const cantidadEventos = this.eventosSegunRango;

    Swal.fire({
      title: '¿Enviar calendario por email?',
      html: `
        <p>Se enviará el calendario en formato <strong>${this.tipoArchivoExport.toUpperCase()}</strong> a:</p>
        <p class="text-indigo-600 font-semibold mt-2">${this.emailDestinoExport}</p>
        <p class="text-sm text-gray-600 mt-2">
          Eventos a enviar: <strong>${cantidadEventos}</strong>
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarEnvio();
      }
    });
  }

  private ejecutarDescarga(): void {
    this.cargando = true;
    this.mostrarModalExport = false;

    const filtros = this.obtenerFiltrosActuales();
    const user = this.authService.user();
    const userRole = this.esEmpleado ? 'emp' : 'admin';
    const userId = user?.id || 0;

    this.calendarioService.descargarCalendario(
      filtros,
      this.tipoArchivoExport,
      userRole,
      userId,
      this.tipoArchivoExport === 'imagen' ? this.subtipoImagen : undefined
    ).subscribe({
      next: (blob) => {
        this.cargando = false;

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

        this.notificationService.mostrarNotificacion('Calendario descargado correctamente', 'success');
        this.tipoArchivoExport = 'excel';
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error al descargar calendario:', error);
        this.notificationService.mostrarNotificacion('Error al descargar el calendario', 'error');
        this.tipoArchivoExport = 'excel';
      }
    });
  }

  private descargarArchivo(blob: Blob, filtros: FiltrosCalendario): void {
    const extension = this.tipoArchivoExport === 'excel' ? 'xlsx' :
                     this.tipoArchivoExport === 'pdf' ? 'pdf' : 'png';

    const timestamp = new Date().getTime();
    const fileName = `calendario_${timestamp}.${extension}`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  private ejecutarEnvio(): void {
    this.cargando = true;
    this.mostrarModalExport = false;

    const filtros = this.obtenerFiltrosActuales();
    const user = this.authService.user();
    const userRole = this.esEmpleado ? 'emp' : 'admin';
    const userId = user?.id || 0;

    this.calendarioService.enviarCalendarioPorEmail(
      filtros,
      this.tipoArchivoExport,
      this.emailDestinoExport,
      userRole,
      userId,
      this.tipoArchivoExport === 'imagen' ? this.subtipoImagen : undefined
    ).subscribe({
      next: (response) => {
        this.cargando = false;
        this.notificationService.mostrarNotificacion('Calendario enviado por email correctamente', 'success');
        this.emailDestinoExport = '';
      },
      error: (error) => {
        this.cargando = false;
        this.notificationService.mostrarNotificacion('Error al enviar el calendario por email', 'error');
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

    if (this.rangoExport === 'vistaActual') {
      const rango = this.calcularRangoVistaActual();
      filtros.fechaInicio = rango.fechaInicio;
      filtros.fechaFin = rango.fechaFin;
    } else if (this.rangoExport === 'rangoPersonalizado') {
      filtros.fechaInicio = this.fechaInicioPersonalizada;
      filtros.fechaFin = this.fechaFinPersonalizada;
    }

    return filtros;
  }

  private calcularRangoVistaActual(): { fechaInicio: string; fechaFin: string } {
    let fechaInicio: Date;
    let fechaFin: Date;

    if (this.vistaActual === 'dia') {
      fechaInicio = new Date(this.fechaSeleccionada);
      fechaFin = new Date(this.fechaSeleccionada);
    } else if (this.vistaActual === 'semana') {
      const rango = this.obtenerRangoFechas();
      fechaInicio = rango.inicio;
      fechaFin = rango.fin;
    } else {
      fechaInicio = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth(), 1);
      fechaFin = new Date(this.fechaSeleccionada.getFullYear(), this.fechaSeleccionada.getMonth() + 1, 0);
    }

    return {
      fechaInicio: this.calendarioService.formatearFechaParaBackend(fechaInicio),
      fechaFin: this.calendarioService.formatearFechaParaBackend(fechaFin)
    };
  }

  get eventosSegunRango(): number {
    if (this.rangoExport === 'historial') {
      return this.eventosFiltrados.length;
    }

    let fechaInicio: string;
    let fechaFin: string;

    if (this.rangoExport === 'vistaActual') {
      const rango = this.calcularRangoVistaActual();
      fechaInicio = rango.fechaInicio;
      fechaFin = rango.fechaFin;
    } else if (this.rangoExport === 'rangoPersonalizado') {
      if (!this.fechaInicioPersonalizada || !this.fechaFinPersonalizada) {
        return 0;
      }
      fechaInicio = this.fechaInicioPersonalizada;
      fechaFin = this.fechaFinPersonalizada;
    } else {
      return this.eventosFiltrados.length;
    }

    return this.eventosFiltrados.filter(evento => {
      const fechaEvento = evento.fecha.split('T')[0];
      return fechaEvento >= fechaInicio && fechaEvento <= fechaFin;
    }).length;
  }

  validarRangoPersonalizado(): boolean {
    this.errorRangoPersonalizado = '';

    if (!this.fechaInicioPersonalizada || !this.fechaFinPersonalizada) {
      this.errorRangoPersonalizado = 'Debe seleccionar ambas fechas';
      return false;
    }

    const fechaInicio = new Date(this.fechaInicioPersonalizada);
    const fechaFin = new Date(this.fechaFinPersonalizada);

    if (fechaFin < fechaInicio) {
      this.errorRangoPersonalizado = 'La fecha final debe ser mayor o igual a la fecha inicial';
      return false;
    }

    const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
      this.errorRangoPersonalizado = 'El rango no puede superar los 60 días';
      return false;
    }

    return true;
  }

  onRangoExportChange(): void {
    this.errorRangoPersonalizado = '';

    if (this.rangoExport === 'rangoPersonalizado') {
      const rango = this.calcularRangoVistaActual();
      this.fechaInicioPersonalizada = rango.fechaInicio;
      this.fechaFinPersonalizada = rango.fechaFin;
    }
  }

  onFechaPersonalizadaChange(): void {
    if (this.fechaInicioPersonalizada && this.fechaFinPersonalizada) {
      this.validarRangoPersonalizado();
    }
  }

}
