import { Component, computed, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { FormErrorLabelComponent } from "../../../../shared/components/form-error-label/form-error-label.component";
import { DepartamentoBackend } from '../../../../departamentos/interfaces/departamento.interface';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { PropietariosService } from '../../../../propietarios/services/propietarios.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, FormErrorLabelComponent, CommonModule],
  templateUrl: './form.component.html',
})
export class FormComponent implements OnInit {
  // 🔥 EventEmitter para coordenadas
  @Output() coordinatesChange = new EventEmitter<string>();

  // NUEVO: EventEmitter para notificar cuando se crea un departamento
  @Output() departamentoCreado = new EventEmitter<void>();

  departamento: DepartamentoBackend = {
    id: 0,
    idProp: 0,
    nombre: '',
    descripcion: '',
    calle: '',
    barrio: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    lngLat: '',
    observaciones: '',
    activo: 0
  };

  router = inject(Router);
  fb = inject(FormBuilder);
  departamentosService = inject(DepartamentosService);
  propietariosService = inject(PropietariosService);
  notificationService = inject(NotificationService);

  propietariosResource = rxResource({
    request: () => ({}),
    loader: () => this.propietariosService.getPropietarios()
  });

  propietarios = computed(() => this.propietariosResource.value() || []);

  // ✅ SOLUCIÓN: Crear el formulario en ngOnInit donde ya podemos usar métodos
  departamentoForm = this.fb.group({
    idProp: [ 0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(3)]],
    calle: ['', [Validators.required, Validators.minLength(3)]],
    barrio: [''],
    localidad: [''],
    provincia: [''],
    codigoPostal: [''],
    // ✅ INICIALMENTE SIN VALIDADOR PERSONALIZADO - se agrega en ngOnInit
    lngLat: ['', [Validators.required]],
    observaciones: [''],
    activo: [0, Validators.required],
  });

  ngOnInit(): void {
    // ✅ SOLUCIÓN: Agregar el validador personalizado después de la inicialización
    this.departamentoForm.get('lngLat')?.setValidators([
      Validators.required,
      this.coordinatesValidator.bind(this)
    ]);
    this.departamentoForm.get('lngLat')?.updateValueAndValidity();

    this.setFormValue(this.departamento);
  }

  // 🔥 Validador inteligente que acepta lat,lng o lng,lat
  coordinatesValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null; // El required ya maneja esto
    }

    try {
      const coords = value.split(',').map((coord: string) => parseFloat(coord.trim()));

      if (coords.length !== 2 || coords.some((coord: number) => isNaN(coord))) {
        return { invalidFormat: true };
      }

      const [first, second] = coords;

      // Validar rangos para ambas posibilidades
      const isValidLng = (val: number) => val >= -180 && val <= 180;
      const isValidLat = (val: number) => val >= -90 && val <= 90;

      // Caso 1: lng,lat (formato esperado)
      if (isValidLng(first) && isValidLat(second)) {
        return null; // Válido en formato lng,lat
      }

      // Caso 2: lat,lng (formato común pero invertido)
      if (isValidLat(first) && isValidLng(second)) {
        return null; // Válido en formato lat,lng (se convertirá automáticamente)
      }

      // Si ninguno de los formatos es válido
      if (!isValidLng(first) && !isValidLat(first)) {
        return { invalidFirstCoordinate: true };
      }

      if (!isValidLng(second) && !isValidLat(second)) {
        return { invalidSecondCoordinate: true };
      }

      return { invalidCoordinates: true };

    } catch (error) {
      return { invalidFormat: true };
    }
  }

  // 🔥 Parsear coordenadas inteligentemente
  private parseCoordinates(coordinatesString: string): { lng: number; lat: number } | null {
    if (!coordinatesString || coordinatesString.trim() === '') {
      return null;
    }

    try {
      const coords = coordinatesString.split(',').map((coord: string) => parseFloat(coord.trim()));

      if (coords.length !== 2 || coords.some((coord: number) => isNaN(coord))) {
        return null;
      }

      const [first, second] = coords;

      // Determinar el formato basado en los rangos típicos
      const isFirstLng = Math.abs(first) > 90;
      const isSecondLat = Math.abs(second) <= 90;

      // Si parece lng,lat
      if (isFirstLng && isSecondLat && first >= -180 && first <= 180 && second >= -90 && second <= 90) {
        return { lng: first, lat: second };
      }

      // Si parece lat,lng (caso más común de confusión)
      const isFirstLat = Math.abs(first) <= 90;
      const isSecondLng = Math.abs(second) > 90;

      if (isFirstLat && isSecondLng && first >= -90 && first <= 90 && second >= -180 && second <= 180) {
        // console.log(`🔄 Coordenadas convertidas automáticamente de lat,lng a lng,lat: ${first},${second} -> ${second},${first}`);
        return { lng: second, lat: first };
      }

      // Fallback: asumir lng,lat si ambos están en rangos válidos
      if ((first >= -180 && first <= 180) && (second >= -90 && second <= 90)) {
        return { lng: first, lat: second };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // 🔥 Manejador de cambios en coordenadas
  onCoordinatesInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const coordinates = input.value;

    // Emitir el cambio de coordenadas inmediatamente
    this.coordinatesChange.emit(coordinates);
  }

  // 🔥 Mensaje de error específico para coordenadas
  getCoordinatesErrorMessage(): string {
    const control = this.departamentoForm.get('lngLat');
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Coordenadas son requeridas';
    }
    if (control.errors['invalidFormat']) {
      return 'Formato inválido. Use: longitud,latitud o latitud,longitud';
    }
    if (control.errors['invalidFirstCoordinate']) {
      return 'Primera coordenada inválida';
    }
    if (control.errors['invalidSecondCoordinate']) {
      return 'Segunda coordenada inválida';
    }
    if (control.errors['invalidCoordinates']) {
      return 'Coordenadas fuera de rango válido';
    }

    return 'Coordenadas inválidas';
  }

  getCoordinates(): { lng: number; lat: number } | null {
    const control = this.departamentoForm.get('lngLat');
    const coordenadas = control?.value;

    // Verificación explícita que TypeScript entiende
    if (!coordenadas || typeof coordenadas !== 'string') {
      return null;
    }

    // Ahora TypeScript sabe que coordenadas es definitivamente string
    return this.parseCoordinates(coordenadas);
  }

  setFormValue(formLike: any) {
    this.departamentoForm.patchValue(formLike);
  }

  onSubmit() {
    const isValid = this.departamentoForm.valid;
    this.departamentoForm.markAllAsTouched();

    if (!isValid) return;

    const formValue = this.departamentoForm.value;

    const departamentoData: DepartamentoBackend = {
      id: 0,
      idProp: formValue.idProp || 0,
      nombre: formValue.nombre || '',
      descripcion: formValue.descripcion || '',
      calle: formValue.calle || '',
      barrio: formValue.barrio || '',
      localidad: formValue.localidad || '',
      provincia: formValue.provincia || '',
      codigoPostal: formValue.codigoPostal || '',
      lngLat: formValue.lngLat || '',
      observaciones: formValue.observaciones || '',
      activo: formValue.activo || 1
    };

    this.departamentosService.createDepartamento(departamentoData).subscribe({
      next: (departamento) => {
        // console.log('Departamento creado:', departamento);

        // Resetear el formulario
        this.departamentoForm.reset({
          idProp: 0,
          activo: 0
        });
        this.departamentoForm.markAsUntouched();
        this.departamentoForm.markAsPristine();

        // 🔥 Resetear mapa al limpiar formulario
        this.coordinatesChange.emit('');

        // NUEVO: Emitir evento para refrescar la lista
        this.departamentoCreado.emit();

        // Notificación de éxito
        this.notificationService.mostrarNotificacion('Departamento creado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error al crear departamento:', error);
        this.notificationService.mostrarNotificacion('Error al crear el departamento', 'error');
      }
    });
  }

  getPropietarioNombre(id: number): string {
    const propietario = this.propietarios().find(p => p.id === id);
    return propietario ? `${propietario.nombreApellido}` : 'Sin asignar';
  }

  // Método para el auto-resize del textarea
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
