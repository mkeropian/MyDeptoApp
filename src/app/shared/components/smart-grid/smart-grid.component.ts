import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableAction, TableColumn } from './smart-grid.interface';

@Component({
  selector: 'smart-grid',
  imports: [CommonModule],
  templateUrl: './smart-grid.component.html',
})

export class SmartGridComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() emptyMessage = 'No hay datos disponibles';
  @Input() showFooter = false;
  @Input() pageSize: number = 25;
  @Input() paginated: boolean = true;

  @Output() sort = new EventEmitter<{column: string, direction: 'asc' | 'desc'}>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Señales internas de paginación (espejan los @Input para que los computed() reaccionen)
  private dataSignal = signal<any[]>([]);
  private pageSizeSignal = signal<number>(25);
  private paginatedSignal = signal<boolean>(true);
  currentPage = signal(1);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.dataSignal().length / this.pageSizeSignal()))
  );

  // Slice de `data` correspondiente a la página actual (no reordena nada)
  paginatedData = computed(() => {
    const all = this.dataSignal();
    const size = this.pageSizeSignal();
    const start = (this.currentPage() - 1) * size;
    return all.slice(start, start + size);
  });

  // Datos a renderizar en la tabla, según paginated esté activo o no
  visibleData = computed(() =>
    this.paginatedSignal() ? this.paginatedData() : this.dataSignal()
  );

  showPaginationControls = computed(() =>
    this.paginatedSignal() && this.dataSignal().length > this.pageSizeSignal()
  );

  rangeStart = computed(() =>
    this.dataSignal().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSizeSignal() + 1
  );

  rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSizeSignal(), this.dataSignal().length)
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSignal.set(this.data ?? []);
      this.currentPage.set(1); // Reset de página cuando cambia el array completo
    }
    if (changes['pageSize']) {
      this.pageSizeSignal.set(this.pageSize);
    }
    if (changes['paginated']) {
      this.paginatedSignal.set(this.paginated);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
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
