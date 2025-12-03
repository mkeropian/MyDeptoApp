import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { PropietariosService } from '../../../../propietarios/services/propietarios.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormErrorLabelComponent } from '../../../../shared/components/form-error-label/form-error-label.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import Swal from 'sweetalert2';
import { DepartamentoBackend } from '../../../../departamentos/interfaces/departamento.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-modal-departamento',
  imports: [
    ReactiveFormsModule,
    FormErrorLabelComponent,
    CommonModule
  ],
  templateUrl: './edit-modal.component.html',
})
export class EditModalComponent implements OnInit {

  @Output() departamentoActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private departamentosService = inject(DepartamentosService);
  private propietariosService = inject(PropietariosService);
  private notificationService = inject(NotificationService);

  isOpen = signal(false);
  departamentoActual = signal<DepartamentoBackend | null>(null);

  propietariosResource = rxResource({
    request: () => ({}),
    loader: () => this.propietariosService.getPropietarios()
  });

  propietarios = computed(() => this.propietariosResource.value() || []);

  editForm = this.fb.group({
    idProp: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(3)]],
    calle: ['', [Validators.required, Validators.minLength(3)]],
    barrio: [''],
    localidad: [''],
    provincia: [''],
    codigoPostal: [''],
    lngLat: ['', [Validators.required]],
    observaciones: [''],
  });

  ngOnInit(): void {
    // Agregar validador personalizado para coordenadas
    this.editForm.get('lngLat')?.setValidators([
      Validators.required,
      this.coordinatesValidator.bind(this)
    ]);
    this.editForm.get('lngLat')?.updateValueAndValidity();
  }

  open(departamento: DepartamentoBackend) {
    this.departamentoActual.set(departamento);

    // Convertir coordenadas de objeto a string si es necesario
    let coordenadasString = '';
    if (departamento.lngLat) {
      // Si lngLat es un string, usarlo directamente
      if (typeof departamento.lngLat === 'string') {
        coordenadasString = departamento.lngLat;
      }
      // Si lngLat es un objeto { lng, lat }, convertirlo a string
      else if (typeof departamento.lngLat === 'object') {
        const coords = departamento.lngLat as any;
        coordenadasString = `${coords.lng},${coords.lat}`;
      }
    }

    this.editForm.patchValue({
      idProp: departamento.idProp,
      nombre: departamento.nombre,
      descripcion: departamento.descripcion,
      calle: departamento.calle,
      barrio: departamento.barrio || '',
      localidad: departamento.localidad || '',
      provincia: departamento.provincia || '',
      codigoPostal: departamento.codigoPostal || '',
      lngLat: coordenadasString || '',  // ← Usar el string convertido
      observaciones: departamento.observaciones || ''
    });

    this.isOpen.set(true);

    const modal = document.getElementById('edit_departamento_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  close() {
    this.isOpen.set(false);
    this.departamentoActual.set(null);
    this.editForm.reset();

    const modal = document.getElementById('edit_departamento_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  // Validador inteligente de coordenadas
  coordinatesValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    try {
      const coords = value.split(',').map((coord: string) => parseFloat(coord.trim()));

      if (coords.length !== 2 || coords.some((coord: number) => isNaN(coord))) {
        return { invalidFormat: true };
      }

      const [first, second] = coords;
      const isValidLng = (val: number) => val >= -180 && val <= 180;
      const isValidLat = (val: number) => val >= -90 && val <= 90;

      if (isValidLng(first) && isValidLat(second)) {
        return null;
      }

      if (isValidLat(first) && isValidLng(second)) {
        return null;
      }

      if (!isValidLng(first) && !isValidLat(first)) {
        return { invalidFirstCoordinate: true };
      }

      if (!isValidLng(second) && isValidLat(second)) {
        return { invalidSecondCoordinate: true };
      }

      return { invalidCoordinates: true };

    } catch (error) {
      return { invalidFormat: true };
    }
  }

  getCoordinatesErrorMessage(): string {
    const control = this.editForm.get('lngLat');
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Coordenadas son requeridas';
    if (control.errors['invalidFormat']) return 'Formato inválido. Use: longitud,latitud';
    if (control.errors['invalidFirstCoordinate']) return 'Primera coordenada inválida';
    if (control.errors['invalidSecondCoordinate']) return 'Segunda coordenada inválida';
    if (control.errors['invalidCoordinates']) return 'Coordenadas fuera de rango válido';

    return 'Coordenadas inválidas';
  }

  async onSubmit() {
    const isValid = this.editForm.valid;
    this.editForm.markAllAsTouched();

    if (!isValid) {
      this.notificationService.mostrarNotificacion('Complete todos los campos requeridos', 'error');
      return;
    }

    const departamentoActual = this.departamentoActual();
    if (!departamentoActual) return;

    const formValue = this.editForm.value;

    // Obtener nombre del propietario
    const propietario = this.propietarios().find(p => p.id === formValue.idProp);

    const modal = document.getElementById('edit_departamento_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }

    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      appRoot.removeAttribute('aria-hidden');
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await Swal.fire({
      title: '¿Confirmar cambios?',
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>Propietario:</strong> ${propietario?.nombreApellido || 'N/A'}</p>
          <p><strong>Nombre:</strong> ${formValue.nombre}</p>
          <p><strong>Calle:</strong> ${formValue.calle}</p>
          <p><strong>Localidad:</strong> ${formValue.localidad || 'N/A'}</p>
          <p><strong>Provincia:</strong> ${formValue.provincia || 'N/A'}</p>
          <p><strong>CP:</strong> ${formValue.codigoPostal || 'N/A'}</p>
          <p><strong>Coords:</strong> ${formValue.lngLat}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      customClass: {
        popup: 'swal-compact'
      }
    });

    if (!result.isConfirmed) {
      if (modal) {
        modal.showModal();
      }
      return;
    }

    const departamentoActualizado: DepartamentoBackend = {
      id: departamentoActual.id,
      idProp: formValue.idProp!,
      nombre: formValue.nombre!,
      descripcion: formValue.descripcion!,
      calle: formValue.calle!,
      barrio: formValue.barrio || '',
      localidad: formValue.localidad || '',
      provincia: formValue.provincia || '',
      codigoPostal: formValue.codigoPostal || '',
      lngLat: formValue.lngLat!,
      observaciones: formValue.observaciones || '',
      activo: departamentoActual.activo
    };

    this.departamentosService.updateDepartamento(departamentoActual.id, departamentoActualizado).subscribe({
      next: () => {
        this.notificationService.mostrarNotificacion('Departamento actualizado exitosamente', 'success');
        this.departamentoActualizado.emit();
        this.close();
      },
      error: (error) => {
        console.error('Error al actualizar departamento:', error);
        this.notificationService.mostrarNotificacion('Error al actualizar el departamento', 'error');
        if (modal) {
          modal.showModal();
        }
      }
    });
  }
}
