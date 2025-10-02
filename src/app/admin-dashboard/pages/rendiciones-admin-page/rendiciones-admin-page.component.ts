// src/app/admin-dashboard/pages/rendiciones-admin-page/rendiciones-admin-page.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Departamento } from '../../../departamentos/interfaces/departamento.interface';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Propietario } from '../../../propietarios/interfaces/propietario.interface';
import { PropietariosService } from '../../../propietarios/services/propietarios.service';
import { ExportApiService } from '../../../shared/services/export-api.service';
import { ExportRequest } from '../../../shared/interfaces/export-request.interface';

@Component({
  selector: 'rendiciones-admin-page',
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

  showExportModal = false;
  exportForm!: FormGroup;
  isExporting = false;
  isLoadingData = false;

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
  departments: Departamento[] = [];
  owners: Propietario[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private exportApiService: ExportApiService,
    private departamentosService: DepartamentosService,
    private propietariosService: PropietariosService
  ) {
    this.initializeYears();
  }

  ngOnInit(): void {
    this.createExportForm();
  }

  // =============== MÃ‰TODO PÃšBLICO PARA ABRIR EL MODAL ===============

  open(): void {
    this.loadInitialData();
    this.showExportModal = true;
    this.resetExportForm();
  }

  // =============== CARGA DE DATOS ===============

  private async loadInitialData(): Promise<void> {
    this.isLoadingData = true;

    try {
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
      alert('Error al cargar departamentos y propietarios. Por favor, recarga la pÃ¡gina.');
    } finally {
      this.isLoadingData = false;
    }
  }

  // =============== FORMULARIO ===============

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      this.years.push(year);
    }
  }

  private createExportForm(): void {
    const currentDate = new Date();

    this.exportForm = this.formBuilder.group({
      filterType: ['department', [Validators.required]],
      reportType: ['daily', [Validators.required]],
      selectedDate: [currentDate.toISOString().split('T')[0]],
      month: [currentDate.getMonth() + 1],
      year: [currentDate.getFullYear()],
      selectedDepartmentId: [null],
      selectedOwnerId: [null],
      fileFormat: ['csv', [Validators.required]]
    });

    this.exportForm.get('reportType')?.valueChanges.subscribe(() => {
      this.updateValidators();
    });

    this.exportForm.get('filterType')?.valueChanges.subscribe(() => {
      this.updateValidators();
    });

    this.updateValidators();
  }

  private updateValidators(): void {
    const reportType = this.exportForm.get('reportType')?.value;
    const filterType = this.exportForm.get('filterType')?.value;

    const dateControl = this.exportForm.get('selectedDate');
    const monthControl = this.exportForm.get('month');
    const yearControl = this.exportForm.get('year');
    const deptControl = this.exportForm.get('selectedDepartmentId');
    const ownerControl = this.exportForm.get('selectedOwnerId');

    // Limpiar validadores
    dateControl?.clearValidators();
    monthControl?.clearValidators();
    yearControl?.clearValidators();
    deptControl?.clearValidators();
    ownerControl?.clearValidators();

    // Validadores segÃºn tipo de reporte
    if (reportType === 'daily') {
      dateControl?.setValidators([Validators.required]);
    } else if (reportType === 'monthly') {
      monthControl?.setValidators([Validators.required]);
      yearControl?.setValidators([Validators.required]);
    }

    // Validadores segÃºn tipo de filtro
    if (filterType === 'department') {
      deptControl?.setValidators([Validators.required]);
      ownerControl?.setValue(null);
    } else if (filterType === 'owner') {
      ownerControl?.setValidators([Validators.required]);
      deptControl?.setValue(null);
    }

    // Actualizar validez
    dateControl?.updateValueAndValidity();
    monthControl?.updateValueAndValidity();
    yearControl?.updateValueAndValidity();
    deptControl?.updateValueAndValidity();
    ownerControl?.updateValueAndValidity();
  }

  // =============== MODAL ===============

  openExportModal(): void {
    this.showExportModal = true;
    this.resetExportForm();
  }

  closeExportModal(): void {
    if (!this.isExporting) {
      this.showExportModal = false;
    }
  }

  private resetExportForm(): void {
    const currentDate = new Date();
    this.exportForm.patchValue({
      filterType: 'department',
      reportType: 'daily',
      selectedDate: currentDate.toISOString().split('T')[0],
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      selectedDepartmentId: null,
      selectedOwnerId: null,
      fileFormat: 'csv'
    });
    this.exportForm.markAsUntouched();
  }

  // =============== EXPORTACIÃ“N ===============

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
      this.markFormAsTouched();
    }
  }

  private buildExportRequest(formValue: any): ExportRequest {
    const request: ExportRequest = {
      tipoReporte: formValue.filterType === 'department' ? 'departamento' : 'propietario',
      fileFormat: formValue.fileFormat
    };

    // Agregar ID segÃºn el tipo de filtro
    if (formValue.filterType === 'department') {
      request.idDepartamento = formValue.selectedDepartmentId;
    } else {
      request.idPropietario = formValue.selectedOwnerId;
    }

    // Agregar fechas segÃºn el tipo de reporte
    if (formValue.reportType === 'daily') {
      request.fecha = formValue.selectedDate;
    } else if (formValue.reportType === 'monthly') {
      const year = formValue.year;
      const month = formValue.month;
      const lastDay = new Date(year, month, 0).getDate();

      request.fechaDesde = `${year}-${String(month).padStart(2, '0')}-01`;
      request.fechaHasta = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    }

    return request;
  }

  private exportToCSV(request: ExportRequest): void {
    this.exportApiService.exportToCSV(request).subscribe({
      next: (response: Blob) => {
        const fileName = this.generateFileName(request);
        this.exportApiService.downloadFile(response, fileName, 'csv');
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

  private exportToExcel(request: ExportRequest): void {
    this.exportApiService.exportToExcel(request).subscribe({
      next: (response: Blob) => {
        const fileName = this.generateFileName(request);
        this.exportApiService.downloadFile(response, fileName, 'xlsx');
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

  private handleExportSuccess(message: string): void {
    console.log('âœ…', message);
    this.resetExportForm();
    this.closeExportModal();
  }

  private handleExportError(message: string, error: any): void {
    console.error('âŒ Export error:', error);
    alert(`${message}: ${error.error?.message || error.message || 'Error desconocido'}`);
  }

  private generateFileName(request: ExportRequest): string {
    const filterLabel = request.tipoReporte;
    const formValue = this.exportForm.value;

    if (formValue.reportType === 'daily') {
      const dateStr = formValue.selectedDate.replace(/-/g, '_');
      return `rendicion_${filterLabel}_diario_${dateStr}`;
    } else {
      const monthName = this.months.find(m => m.value === formValue.month)?.label.toLowerCase() || 'mes';
      return `rendicion_${filterLabel}_mensual_${monthName}_${formValue.year}`;
    }
  }

  // =============== VALIDACIÃ“N ===============

  private markFormAsTouched(): void {
    Object.keys(this.exportForm.controls).forEach(key => {
      this.exportForm.get(key)?.markAsTouched();
    });
  }

  canSubmitExport(): boolean {
    return this.exportForm.valid && !this.isExporting && !this.isLoadingData;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.exportForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  // =============== HELPERS ===============

  isDailyReport(): boolean {
    return this.exportForm?.get('reportType')?.value === 'daily';
  }

  isMonthlyReport(): boolean {
    return this.exportForm?.get('reportType')?.value === 'monthly';
  }

  isDepartmentFilter(): boolean {
    return this.exportForm?.get('filterType')?.value === 'department';
  }

  isOwnerFilter(): boolean {
    return this.exportForm?.get('filterType')?.value === 'owner';
  }

  getSelectedMonthName(): string {
    const monthValue = this.exportForm?.get('month')?.value;
    return this.months.find(m => m.value === monthValue)?.label || '';
  }

  getSelectedFilterLabel(): string {
    return this.isDepartmentFilter() ? 'Por Departamento' : 'Por Propietario';
  }

  getSelectedReportLabel(): string {
    return this.isDailyReport() ? 'Reporte Diario' : 'Reporte Mensual';
  }

  getSelectedFormatLabel(): string {
    const format = this.exportForm?.get('fileFormat')?.value;
    return format === 'csv' ? 'CSV (.csv)' : 'Excel (.xlsx)';
  }

  getSelectedEntityName(): string {
    if (this.isDepartmentFilter()) {
      const id = this.exportForm.get('selectedDepartmentId')?.value;
      const dept = this.departments.find(d => d.id === id);
      return dept?.nombre || '';
    } else {
      const id = this.exportForm.get('selectedOwnerId')?.value;
      const owner = this.owners.find(o => o.id === id);
      return owner?.nombreApellido || '';
    }
  }
}
