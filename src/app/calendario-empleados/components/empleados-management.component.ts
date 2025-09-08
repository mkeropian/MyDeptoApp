import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarioService, Empleado } from '../services/calendario.service';

@Component({
  selector: 'app-empleados-management',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="empleados-management p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Gestión de Empleados</h2>
        <button
          (click)="abrirModalEmpleado()"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Nuevo Empleado
        </button>
      </div>

      <!-- Lista de empleados -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Empleados Registrados</h3>
        </div>

        <div class="divide-y divide-gray-200">
          <div
            *ngFor="let empleado of empleados"
            class="px-6 py-4 flex items-center justify-between hover:bg-gray-50">

            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span class="text-indigo-600 font-medium text-sm">
                    {{ obtenerIniciales(empleado.nombre) }}
                  </span>
                </div>
              </div>

              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">{{ empleado.nombre }}</div>
                <div class="text-sm text-gray-500">{{ empleado.departamento }}</div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <span
                [class]="empleado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                {{ empleado.activo ? 'Activo' : 'Inactivo' }}
              </span>

              <button
                (click)="editarEmpleado(empleado)"
                class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                Editar
              </button>

              <button
                (click)="toggleEstadoEmpleado(empleado)"
                class="text-gray-600 hover:text-gray-900 text-sm font-medium">
                {{ empleado.activo ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para crear/editar empleado -->
      <div
        *ngIf="mostrarModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true">

        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" (click)="cerrarModal()"></div>

          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form [formGroup]="empleadoForm" (ngSubmit)="guardarEmpleado()">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      {{ empleadoEditando ? 'Editar Empleado' : 'Nuevo Empleado' }}
                    </h3>

                    <div class="space-y-4">
                      <!-- Nombre -->
                      <div>
                        <label for="nombre" class="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input
                          type="text"
                          id="nombre"
                          formControlName="nombre"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Ej: Juan Pérez">
                        <div *ngIf="empleadoForm.get('nombre')?.invalid && empleadoForm.get('nombre')?.touched"
                             class="text-red-600 text-sm mt-1">
                          El nombre es requerido
                        </div>
                      </div>

                      <!-- Departamento -->
                      <div>
                        <label for="departamento" class="block text-sm font-medium text-gray-700">Departamento</label>
                        <select
                          id="departamento"
                          formControlName="departamento"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="">Seleccionar departamento</option>
                          <option *ngFor="let dept of departamentos" [value]="dept">{{ dept }}</option>
                        </select>
                        <div *ngIf="empleadoForm.get('departamento')?.invalid && empleadoForm.get('departamento')?.touched"
                             class="text-red-600 text-sm mt-1">
                          El departamento es requerido
                        </div>
                      </div>

                      <!-- Estado activo -->
                      <div class="flex items-center">
                        <input
                          type="checkbox"
                          id="activo"
                          formControlName="activo"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                        <label for="activo" class="ml-2 block text-sm text-gray-900">
                          Empleado activo
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  [disabled]="empleadoForm.invalid"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {{ empleadoEditando ? 'Actualizar' : 'Guardar' }}
                </button>
                <button
                  type="button"
                  (click)="cerrarModal()"
                  class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empleados-management {
      min-height: calc(100vh - 120px);
    }
  `]
})
export class EmpleadosManagementComponent implements OnInit {
  empleados: Empleado[] = [];
  empleadoForm: FormGroup;
  mostrarModal = false;
  empleadoEditando: Empleado | null = null;

  departamentos = [
    'Desarrollo',
    'Recursos Humanos',
    'Ventas',
    'Marketing',
    'Soporte',
    'Finanzas',
    'Administración',
    'Operaciones'
  ];

  constructor(
    private fb: FormBuilder,
    private calendarioService: CalendarioService
  ) {
    this.empleadoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      departamento: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit() {
    this.calendarioService.obtenerEmpleados().subscribe(empleados => {
      this.empleados = empleados;
    });
  }

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  abrirModalEmpleado() {
    this.empleadoEditando = null;
    this.empleadoForm.reset({ activo: true });
    this.mostrarModal = true;
  }

  editarEmpleado(empleado: Empleado) {
    this.empleadoEditando = empleado;
    this.empleadoForm.patchValue({
      nombre: empleado.nombre,
      departamento: empleado.departamento,
      activo: empleado.activo
    });
    this.mostrarModal = true;
  }

  guardarEmpleado() {
    if (this.empleadoForm.valid) {
      const formValue = this.empleadoForm.value;

      if (this.empleadoEditando) {
        // Actualizar empleado existente
        // Nota: Necesitarías implementar el método actualizarEmpleado en el servicio
        console.log('Actualizar empleado:', this.empleadoEditando.id, formValue);
      } else {
        // Crear nuevo empleado
        this.calendarioService.crearEmpleado(formValue);
      }

      this.cerrarModal();
    }
  }

  toggleEstadoEmpleado(empleado: Empleado) {
    const nuevoEstado = !empleado.activo;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';

    if (confirm(`¿Estás seguro de que quieres ${mensaje} a ${empleado.nombre}?`)) {
      // Nota: Necesitarías implementar el método actualizarEmpleado en el servicio
      console.log('Toggle estado empleado:', empleado.id, nuevoEstado);
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.empleadoEditando = null;
    this.empleadoForm.reset({ activo: true });
  }
}
