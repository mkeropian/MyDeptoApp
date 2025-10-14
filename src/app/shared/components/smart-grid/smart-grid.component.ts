
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
  @Input() selectable = false;
  @Input() showFooter = false;

  @Output() sort = new EventEmitter<{column: string, direction: 'asc' | 'desc'}>();
  @Output() selectionChange = new EventEmitter<any[]>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedItems = new Set<any>();

  get allSelected(): boolean {
    return this.selectedItems.size === this.data.length && this.data.length > 0;
  }

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

  onSelectAll(event: any) {
    if (event.target.checked) {
      this.data.forEach(item => this.selectedItems.add(item));
    } else {
      this.selectedItems.clear();
    }
    this.selectionChange.emit(Array.from(this.selectedItems));
  }

  onSelectItem(item: any, event: any) {
    if (event.target.checked) {
      this.selectedItems.add(item);
    } else {
      this.selectedItems.delete(item);
    }
    this.selectionChange.emit(Array.from(this.selectedItems));
  }

  getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Formato personalizado: "05 Ago 2025" o "05/08/2025"
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };

    return date.toLocaleDateString('es-AR', options);
  }

  getColspan(): number {
    return this.columns.length +
      (this.selectable ? 1 : 0) +
      (this.actions.length > 0 ? 1 : 0);
  }

  getAvatarSrc(item: any): string {
    // console.log(item)
    const avatarUrl = this.getValue(item, 'avatarUrl') || this.getValue(item, 'avatar');
    return avatarUrl || 'assets/images/default-avatar.png'; // Ruta más corta
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/no-image.jpg';
    event.target.alt = 'Imagen no disponible';}

}
