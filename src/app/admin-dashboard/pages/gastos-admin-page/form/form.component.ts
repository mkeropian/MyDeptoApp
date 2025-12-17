import { Component, computed, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { Gasto } from '../../../../gastos/interfaces/gasto.interface';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastosService } from '../../../../gastos/services/gastos.service';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DashboardDataService } from '../../../../shared/services/dashboard-data.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-form',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent
  ],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {

  @Output() gastoCreado = new EventEmitter<void>();

  gasto: Gasto = {
    id: 0,
    idDep: 0,
    idTipoGasto: 0,
    monto: 0,
    fecha: '01/01/2025',
    observaciones:''
  };

  router = inject(Router);
  fb = inject(FormBuilder);
  gastosService = inject(GastosService);
  departamentosService = inject(DepartamentosService);
  notificationService = inject(NotificationService);
  dashboardDataService = inject(DashboardDataService);

  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosActivos()
  });

  tipoGastoResource = rxResource({
    request: () => ({}),
    loader: () => this.gastosService.getTipoGasto()
  });

  tipoGastos = computed(() => this.tipoGastoResource.value() || []);
  departamentos = computed(() => this.departamentosResource.value() || []);

  gastosForm = this.fb.group({
    idsDep: [[] as number[], Validators.required], // Cambiado a array
    idTipoGasto: [1, Validators.required],
    monto: [0, Validators.required],
    fecha: [''],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.setFormValue(this.gasto);
  }

  setFormValue(formLike: Partial<Gasto>) {
    this.gastosForm.patchValue(formLike as any);
  }

  limpiarForm() {
    this.gastosForm.reset({
      idsDep: [],
      idTipoGasto: 1,
      monto: 0
    });
    this.gastosForm.markAsUntouched();
    this.gastosForm.markAsPristine();
  }

  async onSubmit() {
    const isValid = this.gastosForm.valid;
    this.gastosForm.markAllAsTouched();

    if (!isValid) return;

    const formValue = this.gastosForm.value;
    const selectedDepartments = formValue.idsDep || [];
    const totalMonto = formValue.monto || 0;

    // Validar que haya al menos 1 departamento seleccionado
    if (selectedDepartments.length === 0) {
      this.notificationService.mostrarNotificacion('Debe seleccionar al menos un departamento', 'error');
      return;
    }

    // Calcular monto por departamento
    const montoPorDepartamento = totalMonto / selectedDepartments.length;

    // Obtener nombres de departamentos seleccionados
    const nombresDeptos = selectedDepartments
      .map(id => {
        const depto = this.departamentos().find(d => d.id === id);
        return depto ? depto.nombre : `Depto ${id}`;
      })
      .join(', ');

    // Mostrar confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Confirmar distribución de gasto?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Monto total:</strong> $${totalMonto.toLocaleString()}</p>
          <p class="mb-2"><strong>Departamentos seleccionados:</strong> ${selectedDepartments.length}</p>
          <p class="mb-2"><strong>Monto por departamento:</strong> $${montoPorDepartamento.toLocaleString()}</p>
          <p class="mb-2 text-sm text-gray-600"><strong>Departamentos:</strong> ${nombresDeptos}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    // Crear array de observables para ejecutar todos los POST
    const requests = selectedDepartments.map(idDep => {
      const gastoIndividual: Gasto = {
        id: 0,
        idTipoGasto: formValue.idTipoGasto!,
        idDep: idDep,
        monto: montoPorDepartamento,
        fecha: formValue.fecha || '',
        observaciones: formValue.observaciones || ''
      };
      return this.gastosService.createGasto(gastoIndividual);
    });

    // Ejecutar todos los requests en paralelo
    forkJoin(requests).subscribe({
      next: (resultados) => {
        // Resetear el formulario
        this.gastosForm.reset({
          idsDep: [],
          idTipoGasto: 1,
          monto: 0
        });
        this.gastosForm.markAsUntouched();
        this.gastosForm.markAsPristine();

        // Emitir evento para refrescar la lista
        this.gastoCreado.emit();

        // NUEVO: Disparar actualización del dashboard
        this.dashboardDataService.triggerRefresh();

        // Mostrar mensaje de éxito
        this.notificationService.mostrarNotificacion(
          `${resultados.length} gasto(s) creado(s) exitosamente`,
          'success',
          `$${montoPorDepartamento.toLocaleString()} por departamento`
        );
      },
      error: (error) => {
        console.error('Error al crear gastos:', error);
        this.notificationService.mostrarNotificacion(
          'Error al crear los gastos',
          'error',
          'Algunos registros pueden no haberse guardado'
        );
      }
    });
  }
}
