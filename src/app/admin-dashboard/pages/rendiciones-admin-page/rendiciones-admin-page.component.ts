// src/app/admin-dashboard/pages/rendiciones-admin-page/rendiciones-admin-page.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExportApiService } from '../../../shared/services/export-api.service';
import { ExportRequest } from '../../../shared/interfaces/export-request.interface';
import { CommonModule } from '@angular/common';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';

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

  // =============== PROPIEDADES DEL MODAL DE EXPORTACIÓN ===============
  showExportModal = false;
  exportForm!: FormGroup;
  isExporting = false;
  isLoadingData = false;

  // Arrays para opciones
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

  // Datos cargados desde servicios
  departments: Departamento[] = [];
  owners: Propietario[] = [];

  fileFormats = [
    { value: 'csv', label: 'CSV (.csv)', icon: '📄' },
    { value: 'excel', label: 'Excel (.xlsx)', icon: '📊' }
  ];

  reportTypes = [
    { value: 'daily', label: 'Reporte Diario', icon: '📅' },
    { value: 'monthly', label: 'Reporte Mensual', icon: '📊' }
  ];

  filterTypes = [
    { value: 'owner', label: 'Por Propietario', icon: '👤' },
    { value: 'department', label: 'Por Departamento', icon: '🏢' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private exportApiService: ExportApiService,
    private departamentosService: DepartamentosService,
    private propietariosService: PropietariosService
  ) {
    this.initializeYears();
  }

  ngOnInit(): void {
    // Cargar datos iniciales
    this.loadInitialData();

    // Inicializar formulario de exportación
    this.createExportForm();

    // Abrir modal automáticamente al cargar el componente
    this.openExportModal();
  }

  // =============== MÉTODOS DE CARGA DE DATOS ===============

  /**
   * Cargar datos iniciales (departamentos y propietarios)
   */
  private async loadInitialData(): Promise<void> {
    this.isLoadingData = true;

    try {
      // Cargar departamentos y propietarios en paralelo
      const [departamentos, propietarios] = await Promise.all([
        this.departamentosService.getDepartamentosActivos().toPromise(),
        this.propietariosService.getPropietariosActivos().toPromise()
      ]);

      this.departments = departamentos || [];
      this.owners = propietarios || [];

      console.log('Datos cargados:', {
        departamentos: this.departments.length,
        propietarios: this.owners.length
      });

    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.handleDataLoadError();
    } finally {
      this.isLoadingData = false;
    }
  }

  /**
   * Manejar error en la carga de datos
   */
  private handleDataLoadError(): void {
    alert('Error al cargar departamentos y propietarios. Por favor, recarga la página.');
  }

  // =============== MÉTODOS DEL FORMULARIO ===============

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
      // Tipo de filtro: propietario o departamento
      filterType: ['owner', [Validators.required]],

      // Tipo de reporte: diario o mensual
      reportType: ['monthly', [Validators.required]],

      // Para reporte diario
      selectedDate: [currentDate.toISOString().split('T')[0]], // formato YYYY-MM-DD

      // Para reporte mensual
      month: [currentDate.getMonth() + 1],
      year: [currentDate.getFullYear()],

      // Selecciones múltiples (IDs)
      departments: [[]],
      owners: [[]],

      // Formato de archivo
      fileFormat: ['excel', [Validators.required]]
    });

    // Escuchar cambios en el tipo de reporte para validar campos apropiados
    this.exportForm.get('reportType')?.valueChanges.subscribe(reportType => {
      this.updateValidators(reportType);
    });

    // Escuchar cambios en el tipo de filtro para validar campos apropiados
    this.exportForm.get('filterType')?.valueChanges.subscribe(filterType => {
      this.updateFilterValidators(filterType);
    });

    // Configurar validadores iniciales
    this.updateValidators(this.exportForm.get('reportType')?.value);
    this.updateFilterValidators(this.exportForm.get('filterType')?.value);
  }

  /**
   * Actualizar validadores según el tipo de reporte
   */
  private updateValidators(reportType: string): void {
    const dateControl = this.exportForm.get('selectedDate');
    const monthControl = this.exportForm.get('month');
    const yearControl = this.exportForm.get('year');

    // Limpiar validadores existentes
    dateControl?.clearValidators();
    monthControl?.clearValidators();
    yearControl?.clearValidators();

    if (reportType === 'daily') {
      dateControl?.setValidators([Validators.required]);
    } else if (reportType === 'monthly') {
      monthControl?.setValidators([Validators.required]);
      yearControl?.setValidators([Validators.required]);
    }

    // Actualizar validez
    dateControl?.updateValueAndValidity();
    monthControl?.updateValueAndValidity();
    yearControl?.updateValueAndValidity();
  }

  /**
   * Actualizar validadores según el tipo de filtro
   */
  private updateFilterValidators(filterType: string): void {
    const departmentsControl = this.exportForm.get('departments');
    const ownersControl = this.exportForm.get('owners');

    // Limpiar validadores existentes
    departmentsControl?.clearValidators();
    ownersControl?.clearValidators();

    if (filterType === 'department') {
      departmentsControl?.setValidators([Validators.required, Validators.minLength(1)]);
      // Limpiar selección de propietarios
      ownersControl?.setValue([]);
    } else if (filterType === 'owner') {
      ownersControl?.setValidators([Validators.required, Validators.minLength(1)]);
      // Limpiar selección de departamentos
      departmentsControl?.setValue([]);
    }

    // Actualizar validez
    departmentsControl?.updateValueAndValidity();
    ownersControl?.updateValueAndValidity();
  }

  // =============== MÉTODOS DEL MODAL ===============

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
   * Resetear formulario de exportación
   */
  private resetExportForm(): void {
    const currentDate = new Date();
    this.exportForm.patchValue({
      filterType: 'owner',
      reportType: 'monthly',
      selectedDate: currentDate.toISOString().split('T')[0],
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      departments: [],
      owners: [],
      fileFormat: 'excel'
    });
    this.exportForm.markAsUntouched();
  }

  // =============== MÉTODOS DE EXPORTACIÓN ===============

  /**
   * Manejar envío del formulario de exportación
   */
  onExportSubmit(): void {
    if (this.exportForm.valid && !this.isExporting) {
      this.isExporting = true;

      const formValue = this.exportForm.value;
      const exportRequest: ExportRequest = this.buildExportRequest(formValue);

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
   * Construir objeto de petición de exportación
   */
  private buildExportRequest(formValue: any): ExportRequest {
    const request: ExportRequest = {
      filterType: formValue.filterType,
      reportType: formValue.reportType,
      fileFormat: formValue.fileFormat,
      fileName: this.generateFileName(formValue)
    };

    // Agregar datos según el tipo de reporte
    if (formValue.reportType === 'daily') {
      request.selectedDate = formValue.selectedDate;
    } else if (formValue.reportType === 'monthly') {
      request.month = formValue.month;
      request.year = formValue.year;
    }

    // Agregar selecciones según el tipo de filtro
    if (formValue.filterType === 'department') {
      request.departments = formValue.departments;
    } else if (formValue.filterType === 'owner') {
      request.owners = formValue.owners;
    }

    return request;
  }

  /**
   * Exportar a CSV
   */
  private exportToCSV(request: ExportRequest): void {
    this.exportApiService.exportToCSV(request).subscribe({
      next: (response: Blob) => {
        // Descargar archivo
        this.exportApiService.downloadFile(response, request.fileName, 'csv');
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
      next: (response: Blob) => {
        // Descargar archivo
        this.exportApiService.downloadFile(response, request.fileName, 'xlsx');
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
    const filterTypeLabel = formValue.filterType === 'owner' ? 'propietarios' : 'departamentos';
    const reportTypeLabel = formValue.reportType === 'daily' ? 'diario' : 'mensual';

    if (formValue.reportType === 'daily') {
      const dateStr = formValue.selectedDate.replace(/-/g, '_');
      return `rendiciones_${filterTypeLabel}_${reportTypeLabel}_${dateStr}`;
    } else {
      const monthName = this.months.find(m => m.value === formValue.month)?.label.toLowerCase() || 'mes';
      return `rendiciones_${filterTypeLabel}_${reportTypeLabel}_${monthName}_${formValue.year}`;
    }
  }

  // =============== MÉTODOS DE VALIDACIÓN ===============

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
      'filterType': 'Tipo de filtro',
      'reportType': 'Tipo de reporte',
      'selectedDate': 'Fecha',
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
    return this.exportForm.valid && !this.isExporting && !this.isLoadingData;
  }

  // =============== MÉTODOS DE SELECCIÓN MÚLTIPLE ===============

  /**
   * Toggle de selección para departamentos
   */
  toggleDepartment(deptId: number): void {
    const departments = this.exportForm.get('departments')?.value || [];
    const index = departments.indexOf(deptId);

    if (index > -1) {
      departments.splice(index, 1);
    } else {
      departments.push(deptId);
    }

    this.exportForm.patchValue({ departments });
  }

  /**
   * Toggle de selección para propietarios
   */
  toggleOwner(ownerId: number): void {
    const owners = this.exportForm.get('owners')?.value || [];
    const index = owners.indexOf(ownerId);

    if (index > -1) {
      owners.splice(index, 1);
    } else {
      owners.push(ownerId);
    }

    this.exportForm.patchValue({ owners });
  }

  /**
   * Verificar si un departamento está seleccionado
   */
  isDepartmentSelected(deptId: number): boolean {
    const departments = this.exportForm.get('departments')?.value || [];
    return departments.includes(deptId);
  }

  /**
   * Verificar si un propietario está seleccionado
   */
  isOwnerSelected(ownerId: number): boolean {
    const owners = this.exportForm.get('owners')?.value || [];
    return owners.includes(ownerId);
  }

  // =============== MÉTODOS DE PRESENTACIÓN ===============

  /**
   * Obtener nombre del mes seleccionado
   */
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
   * Obtener label del tipo de reporte seleccionado
   */
  getSelectedReportTypeLabel(): string {
    const reportTypeValue = this.exportForm?.get('reportType')?.value;
    return this.reportTypes.find(r => r.value === reportTypeValue)?.label || '';
  }

  /**
   * Obtener label del tipo de filtro seleccionado
   */
  getSelectedFilterTypeLabel(): string {
    const filterTypeValue = this.exportForm?.get('filterType')?.value;
    return this.filterTypes.find(f => f.value === filterTypeValue)?.label || '';
  }

  /**
   * Obtener nombres de departamentos seleccionados
   */
  getSelectedDepartmentNames(): string[] {
    const deptIds = this.exportForm?.get('departments')?.value || [];
    return deptIds.map((deptId: number) =>
      this.departments.find(d => d.id === deptId)?.nombre || `Departamento ${deptId}`
    );
  }

  /**
   * Obtener nombres de propietarios seleccionados
   */
  getSelectedOwnerNames(): string[] {
    const ownerIds = this.exportForm?.get('owners')?.value || [];
    return ownerIds.map((ownerId: number) =>
      this.owners.find(o => o.id === ownerId)?.nombreApellido || `Propietario ${ownerId}`
    );
  }

  /**
   * Verificar si el tipo de reporte es diario
   */
  isDailyReport(): boolean {
    return this.exportForm?.get('reportType')?.value === 'daily';
  }

  /**
   * Verificar si el tipo de reporte es mensual
   */
  isMonthlyReport(): boolean {
    return this.exportForm?.get('reportType')?.value === 'monthly';
  }

  /**
   * Verificar si el filtro es por departamento
   */
  isDepartmentFilter(): boolean {
    return this.exportForm?.get('filterType')?.value === 'department';
  }

  /**
   * Verificar si el filtro es por propietario
   */
  isOwnerFilter(): boolean {
    return this.exportForm?.get('filterType')?.value === 'owner';
  }
}
