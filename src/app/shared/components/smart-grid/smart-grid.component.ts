import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableAction, TableColumn } from './smart-grid.interface';

@Component({
  selector: 'smart-grid',
  imports: [CommonModule],
  templateUrl: './smart-grid.component.html',
})

export class SmartGridComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() emptyMessage = 'No hay datos disponibles';
  @Input() showFooter = false;

  @Output() sort = new EventEmitter<{column: string, direction: 'asc' | 'desc'}>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  onSort(column: TableColumn) {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sort.emit({ column: column.key, direction: this.sortDirection });
  }

  getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    // Extraer solo la parte de la fecha (YYYY-MM-DD) del string ISO
    // Maneja tanto "2026-02-25" como "2026-02-25T00:00:00.000Z"
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    if (!year || !month || !day) return dateString;

    // Crear fecha local sin offset de timezone
    const date = new Date(year, month - 1, day);

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };

    return date.toLocaleDateString('es-AR', options);
  }

  getColspan(): number {
    return this.columns.length + (this.actions.length > 0 ? 1 : 0);
  }

  getAvatarSrc(item: any): string {
    const avatarUrl = this.getValue(item, 'avatarUrl') || this.getValue(item, 'avatar');
    return avatarUrl || 'assets/images/default-avatar.png';
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/no-image.jpg';
    event.target.alt = 'Imagen no disponible';
  }
}
