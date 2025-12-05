// src/app/shared/components/rendicion-automatica-modal/rendicion-automatica-modal.component.ts
import { Component, inject, signal, output, ViewChild, ElementRef, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RendicionAutomaticaService } from '../../services/rendicion-automatica.service';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {
  CreateRendicionAutomaticaRequest,
  UpdateRendicionAutomaticaRequest,
  RendicionAutomaticaConfig,
  FRECUENCIAS,
  FORMATOS_ARCHIVO
} from '../../interfaces/rendicion-automatica.interface';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-rendicion-automatica-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rendicion-automatica-modal.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class RendicionAutomaticaModalComponent implements OnInit {

  private fb = inject(FormBuilder);
  private rendicionService = inject(RendicionAutomaticaService);
  private propietariosService = inject(PropietariosService);
  private departamentosService = inject(DepartamentosService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  @ViewChild('dialogEl') dialogEl!: ElementRef<HTMLDialogElement>;

  // Outputs
  configCreated = output<void>();
  configUpdated = output<void>();

  // Signals
  isLoading = signal<boolean>(false);
  currentStep = signal<number>(1);
  isEditMode = signal<boolean>(false);
  editingConfig = signal<RendicionAutomaticaConfig | null>(null);
  propietarios = signal<Propietario[]>([]);
  departamentos = signal<Departamento[]>([]);

  // Constantes disponibles en template
  FRECUENCIAS = FRECUENCIAS;
  FORMATOS_ARCHIVO = FORMATOS_ARCHIVO;

  // Reactive Form
  wizardForm!: FormGroup;

  // Computed values
  currentUser = computed(() => this.authService.user());

  // CORREGIDO: Usar idProp que es el campo correcto en la estructura de departamento
  departamentosDisponibles = computed(() => {
    const idPropietario = this.wizardForm?.get('idPropietario')?.value;
    if (!idPropietario) return [];

    // CORREGIDO: Filtrar por idProp (campo real) en lugar de idPropietario/propietarioId/propietario_id
    return this.departamentos().filter(dept => {
      const departamentoAny = dept as any;
      return departamentoAny.idProp === Number(idPropietario);
    });
  });

  proximoEnvioCalculado = computed(() => {
    const frecuencia = this.wizardForm?.get('frecuencia')?.value;
    const hora = this.wizardForm?.get('hora_envio')?.value;

    if (!frecuencia || !hora) return null;

    try {
      // Calcular dia_envio válido en lugar de usar null
      let diaEnvio = 1; // Valor por defecto

      if (frecuencia === 'semanal') {
        diaEnvio = 1; // Lunes
      } else if (frecuencia === 'mensual' || frecuencia === 'trimestral') {
        diaEnvio = 1; // Primer día del mes
      }

      return this.rendicionService.calcularProximoEnvio(frecuencia, diaEnvio, hora);
    } catch (error) {
      return null;
    }
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.wizardForm = this.fb.group({
      idPropietario: ['', [Validators.required]],
      alcance: ['todos', [Validators.required]],
      idDepartamento: [null],
      frecuencia: ['', [Validators.required]],
      hora_envio: ['09:00', [Validators.required]],
      email_destino: ['', [Validators.required, Validators.email]],
      formato_archivo: ['xlsx', [Validators.required]],
      incluir_resumen_email: [true],
      asunto_personalizado: [''],
      mensaje_personalizado: ['']
    });

    // Watcher para alcance
    this.wizardForm.get('alcance')?.valueChanges.subscribe(alcance => {
      const idDepartamentoControl = this.wizardForm.get('idDepartamento');
      if (alcance === 'todos') {
        idDepartamentoControl?.setValue(null);
        idDepartamentoControl?.clearValidators();
      } else {
        idDepartamentoControl?.setValidators([Validators.required]);
      }
      idDepartamentoControl?.updateValueAndValidity();
    });

    // CORREGIDO: Cargar departamentos cuando se seleccione propietario
    this.wizardForm.get('idPropietario')?.valueChanges.subscribe(idPropietario => {
      if (idPropietario) {
        this.loadDepartamentosPorPropietario(Number(idPropietario));
      }
    });
  }

  private loadInitialData(): void {
    this.isLoading.set(true);

    forkJoin({
      propietarios: this.propietariosService.getPropietariosActivos(),
      departamentos: this.departamentosService.getDepartamentosActivos()
    }).subscribe({
      next: ({ propietarios, departamentos }) => {
        this.propietarios.set(propietarios);
        this.departamentos.set(departamentos);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando datos iniciales:', error);
        this.notificationService.mostrarNotificacion('Error al cargar datos iniciales', 'error');
        this.isLoading.set(false);
      }
    });
  }

  // CORREGIDO: Filtrar departamentos por idProp
  private loadDepartamentosPorPropietario(idPropietario: number): void {
    this.departamentosService.getDepartamentosByPropietario(idPropietario).subscribe({
      next: (departamentos) => {
        // Actualizar solo los departamentos del propietario seleccionado
        this.departamentos.update(allDepartamentos => {
          // CORREGIDO: Filtrar por idProp en lugar de idPropietario/propietarioId/propietario_id
          const otherDepartamentos = allDepartamentos.filter(dept => {
            const departamentoAny = dept as any;
            return departamentoAny.idProp !== idPropietario;
          });
          return [...otherDepartamentos, ...departamentos];
        });
      },
      error: (error) => {
        console.error('Error cargando departamentos por propietario:', error);
        this.notificationService.mostrarNotificacion('Error al cargar departamentos del propietario', 'error');
      }
    });
  }

  // Modal management
  open(): void {
    this.isEditMode.set(false);
    this.editingConfig.set(null);
    this.currentStep.set(1);
    this.initializeForm();

    setTimeout(() => {
      if (this.dialogEl?.nativeElement) {
        this.dialogEl.nativeElement.showModal();
      }
    }, 0);
  }

  openEdit(config: RendicionAutomaticaConfig): void {
    this.isEditMode.set(true);
    this.editingConfig.set(config);
    this.currentStep.set(1);
    this.initializeForm();

    setTimeout(() => {
      this.populateFormFromConfig(config);
      if (this.dialogEl?.nativeElement) {
        this.dialogEl.nativeElement.showModal();
      }
    }, 100);
  }

  close(): void {
    this.isEditMode.set(false);
    this.editingConfig.set(null);
    this.currentStep.set(1);
    this.wizardForm.reset();

    if (this.dialogEl?.nativeElement) {
      this.dialogEl.nativeElement.close();
    }
  }

  private populateFormFromConfig(config: RendicionAutomaticaConfig): void {
    this.wizardForm.patchValue({
      idPropietario: config.idPropietario,
      alcance: config.idDepartamento ? 'especifico' : 'todos',
      idDepartamento: config.idDepartamento,
      frecuencia: config.frecuencia,
      hora_envio: config.hora_envio,
      email_destino: config.email_destino,
      formato_archivo: config.formato_archivo,
      incluir_resumen_email: config.incluir_resumen_email === 1,
      asunto_personalizado: config.asunto_personalizado || '',
      mensaje_personalizado: config.mensaje_personalizado || ''
    });
  }

  // Wizard navigation
  nextStep(): void {
    if (this.canProceed() && this.currentStep() < 4) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  canProceed(): boolean {
    const currentStepNum = this.currentStep();

    switch (currentStepNum) {
      case 1:
        const idPropietario = this.wizardForm.get('idPropietario')?.value;
        const alcance = this.wizardForm.get('alcance')?.value;
        const idDepartamento = this.wizardForm.get('idDepartamento')?.value;

        if (!idPropietario || !alcance) return false;
        if (alcance === 'especifico' && !idDepartamento) return false;
        return true;

      case 2:
        const frecuencia = this.wizardForm.get('frecuencia')?.value;
        const hora = this.wizardForm.get('hora_envio')?.value;

        return !!(frecuencia && hora);

      case 3:
        const email = this.wizardForm.get('email_destino')?.value;
        const formato = this.wizardForm.get('formato_archivo')?.value;

        return !!(email && formato && this.wizardForm.get('email_destino')?.valid);

      case 4:
        return true;

      default:
        return false;
    }
  }

  isLastStep(): boolean {
    return this.currentStep() === 4;
  }

  // Submit
  onSubmit(): void {
    if (!this.wizardForm.valid) {
      this.markFormGroupTouched();
      this.notificationService.mostrarNotificacion('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    const formData = this.buildRequestData();

    if (this.isEditMode()) {
      this.updateConfig(formData);
    } else {
      this.createConfig(formData);
    }
  }

  private buildRequestData(): CreateRendicionAutomaticaRequest {
    const formValues = this.wizardForm.value;

    // Calcular dia_envio según la frecuencia
    let diaEnvio: number | null = null;
    const frecuencia = formValues.frecuencia;

    if (frecuencia === 'semanal') {
      diaEnvio = 1; // Lunes por defecto
    } else if (frecuencia === 'mensual' || frecuencia === 'trimestral') {
      diaEnvio = 1; // Primer día del mes por defecto
    }
    // Para 'diaria' y 'quincenal', dia_envio puede ser null

    return {
      idPropietario: Number(formValues.idPropietario),
      idDepartamento: formValues.alcance === 'especifico' ? Number(formValues.idDepartamento) : null,
      frecuencia: formValues.frecuencia,
      dia_envio: diaEnvio,
      hora_envio: formValues.hora_envio,
      email_destino: formValues.email_destino.trim(),
      email_cc: null,
      formato_archivo: formValues.formato_archivo,
      agrupar_departamentos: 1,
      incluir_resumen_email: formValues.incluir_resumen_email ? 1 : 0,
      enviar_si_sin_movimientos: 0,
      asunto_personalizado: formValues.asunto_personalizado?.trim() || null,
      mensaje_personalizado: formValues.mensaje_personalizado?.trim() || null,
      activo: 1
    };
  }

  private createConfig(data: CreateRendicionAutomaticaRequest): void {
    this.isLoading.set(true);

    this.rendicionService.create(data).subscribe({
      next: () => {
        this.notificationService.mostrarNotificacion('Configuración creada exitosamente', 'success');
        this.configCreated.emit();
        this.close();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error creando configuración:', error);
        this.notificationService.mostrarNotificacion(error.error?.msg || 'Error al crear configuración', 'error');
        this.isLoading.set(false);
      }
    });
  }

  private updateConfig(data: CreateRendicionAutomaticaRequest): void {
    const editingConfig = this.editingConfig();
    if (!editingConfig) return;

    this.isLoading.set(true);
    const updateData: UpdateRendicionAutomaticaRequest = { ...data };

    this.rendicionService.update(editingConfig.id, updateData).subscribe({
      next: () => {
        this.notificationService.mostrarNotificacion('Configuración actualizada exitosamente', 'success');
        this.configUpdated.emit();
        this.close();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error actualizando configuración:', error);
        this.notificationService.mostrarNotificacion(error.error?.msg || 'Error al actualizar configuración', 'error');
        this.isLoading.set(false);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.wizardForm.controls).forEach(key => {
      this.wizardForm.get(key)?.markAsTouched();
    });
  }
}
