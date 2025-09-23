// src/app/admin-dashboard/pages/rendiciones-admin-page/rendiciones-admin-page.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExportApiService } from '../../../shared/services/export-api.service';
import { ExportRequest } from '../../../shared/interfaces/export-request.interface';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-rendiciones-admin-page',
  templateUrl: './rendiciones-admin-page.component.html',
  styleUrls: ['./rendiciones-admin-page.component.css'],
  providers: [ ExportApiService ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class RendicionesAdminPageComponent implements OnInit {

  // =============== TUS PROPIEDADES EXISTENTES ===============
  // Aquí van todas las propiedades que ya tenías en tu componente
  // Por ejemplo:
  // rendiciones: any[] = [];
  // filtros: any = {};
  // isLoading = false;
  // etc...

  // =============== PROPIEDADES DEL MODAL DE EXPORTACIÓN ===============
  showExportModal = false;
  exportForm!: FormGroup;
  isExporting = false;

  // Opciones para los dropdowns del modal
  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  years: number[] = [];

  departments = [
    { value: 'IT', label: 'Tecnología' },
    { value: 'HR', label: 'Recursos Humanos' },
    { value: 'SALES', label: 'Ventas' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'FINANCE', label: 'Finanzas' },
    { value: 'OPERATIONS', label: 'Operaciones' }
  ];

  owners = [
    { value: 'juan.perez', label: 'Juan Pérez' },
    { value: 'maria.garcia', label: 'María García' },
    { value: 'carlos.lopez', label: 'Carlos López' },
    { value: 'ana.martinez', label: 'Ana Martínez' },
    { value: 'pedro.rodriguez', label: 'Pedro Rodríguez' },
    { value: 'laura.fernandez', label: 'Laura Fernández' }
  ];

  fileFormats = [
    { value: 'csv', label: 'CSV (.csv)', icon: '📄' },
    { value: 'excel', label: 'Excel (.xlsx)', icon: '📊' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private exportApiService: ExportApiService
    // ... otros servicios que ya tengas inyectados
  ) {
    this.initializeYears();
  }

  ngOnInit(): void {
    // =============== TU LÓGICA EXISTENTE DE ngOnInit ===============
    // Aquí va toda la lógica que ya tenías
    // Por ejemplo:
    // this.loadRendiciones();
    // this.setupFilters();
    // etc...

    // Inicializar formulario de exportación
    this.createExportForm();
  }

  // =============== TUS MÉTODOS EXISTENTES DEL COMPONENTE ===============
  // Aquí van todos los métodos que ya tenías
  // Por ejemplo:
  // loadRendiciones() { ... }
  // filterData() { ... }
  // onPageChange() { ... }
  // etc...

  // =============== MÉTODOS DEL MODAL DE EXPORTACIÓN ===============

  /**
   * Inicializar array de años
   */
  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      this.years.push(year);
    }
  }

  /**
   * Crear formulario de exportación
   */
  private createExportForm(): void {
    const currentDate = new Date();

    this.exportForm = this.formBuilder.group({
      month: [currentDate.getMonth() + 1, [Validators.required]],
      year: [currentDate.getFullYear(), [Validators.required]],
      departments: [[], [Validators.required, Validators.minLength(1)]],
      owners: [[], [Validators.required, Validators.minLength(1)]],
      fileFormat: ['excel', [Validators.required]]
    });
  }

  /**
   * Abrir modal de exportación
   */
  openExportModal(): void {
    this.showExportModal = true;
    this.resetExportForm();
  }

  /**
   * Cerrar modal de exportación
   */
  closeExportModal(): void {
    if (!this.isExporting) {
      this.showExportModal = false;
    }
  }

  /**
   * Manejar envío del formulario de exportación
   */
  onExportSubmit(): void {
    if (this.exportForm.valid && !this.isExporting) {
      this.isExporting = true;

      const formValue = this.exportForm.value;
      const exportRequest: ExportRequest = {
        month: formValue.month,
        year: formValue.year,
        departments: formValue.departments,
        owners: formValue.owners,
        fileFormat: formValue.fileFormat,
        fileName: this.generateFileName(formValue)
      };

      if (formValue.fileFormat === 'csv') {
        this.exportToCSV(exportRequest);
      } else {
        this.exportToExcel(exportRequest);
      }
    } else {
      this.markExportFormGroupTouched();
    }
  }

  /**
   * Exportar a CSV
   */
  private exportToCSV(request: ExportRequest): void {
    this.exportApiService.exportToCSV(request).subscribe({
      next: (response) => {
        this.handleExportSuccess('CSV exportado exitosamente');
      },
      error: (error) => {
        this.handleExportError('Error al exportar CSV', error);
      },
      complete: () => {
        this.isExporting = false;
      }
    });
  }

  /**
   * Exportar a Excel
   */
  private exportToExcel(request: ExportRequest): void {
    this.exportApiService.exportToExcel(request).subscribe({
      next: (response) => {
        this.handleExportSuccess('Excel exportado exitosamente');
      },
      error: (error) => {
        this.handleExportError('Error al exportar Excel', error);
      },
      complete: () => {
        this.isExporting = false;
      }
    });
  }

  /**
   * Manejar éxito en la exportación
   */
  private handleExportSuccess(message: string): void {
    console.log('✅', message);
    // Aquí puedes mostrar un toast de éxito
    // this.toastService.success(message);
    this.resetExportForm();
    this.closeExportModal();
  }

  /**
   * Manejar error en la exportación
   */
  private handleExportError(message: string, error: any): void {
    console.error('❌ Export error:', error);
    // Aquí puedes mostrar un toast de error
    // this.toastService.error(`${message}: ${error.error?.message || error.message}`);
    alert(`${message}: ${error.error?.message || error.message || 'Error desconocido'}`);
  }

  /**
   * Generar nombre de archivo
   */
  private generateFileName(formValue: any): string {
    const monthName = this.months.find(m => m.value === formValue.month)?.label.toLowerCase();
    const departments = formValue.departments.join('-').toLowerCase();
    return `rendiciones_${monthName}_${formValue.year}_${departments}`;
  }

  /**
   * Marcar todos los campos como tocados
   */
  private markExportFormGroupTouched(): void {
    Object.keys(this.exportForm.controls).forEach(key => {
      const control = this.exportForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Resetear formulario de exportación
   */
  private resetExportForm(): void {
    const currentDate = new Date();
    this.exportForm.patchValue({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      departments: [],
      owners: [],
      fileFormat: 'excel'
    });
    this.exportForm.markAsUntouched();
  }

  /**
   * Verificar si un campo es inválido
   */
  isExportFieldInvalid(fieldName: string): boolean {
    const field = this.exportForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getExportFieldError(fieldName: string): string {
    const field = this.exportForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getExportFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `Selecciona al menos un ${this.getExportFieldLabel(fieldName).toLowerCase()}`;
      }
    }

    return '';
  }

  /**
   * Obtener etiqueta del campo
   */
  private getExportFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'month': 'Mes',
      'year': 'Año',
      'departments': 'Departamento',
      'owners': 'Propietario',
      'fileFormat': 'Formato de archivo'
    };

    return labels[fieldName] || fieldName;
  }

  /**
   * Verificar si el formulario se puede enviar
   */
  canSubmitExport(): boolean {
    return this.exportForm.valid && !this.isExporting;
  }

  /**
   * Toggle de selección para departamentos
   */
  toggleDepartment(deptValue: string): void {
    const departments = this.exportForm.get('departments')?.value || [];
    const index = departments.indexOf(deptValue);

    if (index > -1) {
      departments.splice(index, 1);
    } else {
      departments.push(deptValue);
    }

    this.exportForm.patchValue({ departments });
  }

  /**
   * Toggle de selección para propietarios
   */
  toggleOwner(ownerValue: string): void {
    const owners = this.exportForm.get('owners')?.value || [];
    const index = owners.indexOf(ownerValue);

    if (index > -1) {
      owners.splice(index, 1);
    } else {
      owners.push(ownerValue);
    }

    this.exportForm.patchValue({ owners });
  }

  /**
   * Verificar si un departamento está seleccionado
   */
  isDepartmentSelected(deptValue: string): boolean {
    const departments = this.exportForm.get('departments')?.value || [];
    return departments.includes(deptValue);
  }

  /**
   * Verificar si un propietario está seleccionado
   */
  isOwnerSelected(ownerValue: string): boolean {
    const owners = this.exportForm.get('owners')?.value || [];
    return owners.includes(ownerValue);
  }


  getSelectedMonthName(): string {
    const monthValue = this.exportForm?.get('month')?.value;
    return this.months.find(m => m.value === monthValue)?.label || '';
  }

  /**
   * Obtener label del formato seleccionado
   */
  getSelectedFormatLabel(): string {
    const formatValue = this.exportForm?.get('fileFormat')?.value;
    return this.fileFormats.find(f => f.value === formatValue)?.label || '';
  }

  /**
   * Obtener nombres de departamentos seleccionados
   */
  getSelectedDepartmentNames(): string[] {
    const deptValues = this.exportForm?.get('departments')?.value || [];
    return deptValues.map((deptValue: string) =>
      this.departments.find(d => d.value === deptValue)?.label || deptValue
    );
  }

  /**
   * Obtener nombres de propietarios seleccionados
   */
  getSelectedOwnerNames(): string[] {
    const ownerValues = this.exportForm?.get('owners')?.value || [];
    return ownerValues.map((ownerValue: string) =>
      this.owners.find(o => o.value === ownerValue)?.label || ownerValue
    );
  }

}
