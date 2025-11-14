// src/app/shared/components/rendicion-logs-modal/rendicion-logs-modal.component.ts
import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RendicionAutomaticaService } from '../../services/rendicion-automatica.service';
import { RendicionEnvioLog } from '../../interfaces/rendicion-automatica.interface';

@Component({
  selector: 'app-rendicion-logs-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rendicion-logs-modal.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class RendicionLogsModalComponent {

  private rendicionService = inject(RendicionAutomaticaService);

  @ViewChild('dialogEl') dialogEl!: ElementRef<HTMLDialogElement>;

  // Signals
  isLoading = signal<boolean>(false);
  logs = signal<RendicionEnvioLog[]>([]);
  configId = signal<number | null>(null);
  propietarioNombre = signal<string>('');
  searchTerm = signal<string>('');

  // Computed
  filteredLogs = signal<RendicionEnvioLog[]>([]);

  // Abrir modal
  open(idConfig: number, nombrePropietario: string): void {
    this.configId.set(idConfig);
    this.propietarioNombre.set(nombrePropietario);
    this.searchTerm.set('');
    this.loadLogs(idConfig);

    setTimeout(() => {
      if (this.dialogEl?.nativeElement) {
        this.dialogEl.nativeElement.showModal();
      }
    }, 0);
  }

  // Cerrar modal
  close(): void {
    this.logs.set([]);
    this.filteredLogs.set([]);
    this.configId.set(null);
    this.propietarioNombre.set('');
    this.searchTerm.set('');

    if (this.dialogEl?.nativeElement) {
      this.dialogEl.nativeElement.close();
    }
  }

  private loadLogs(idConfig: number): void {
    this.isLoading.set(true);

    this.rendicionService.getLogs(idConfig).subscribe({
      next: (logs) => {
        // Ordenar por fecha descendente (más recientes primero)
        const sortedLogs = logs.sort((a, b) =>
          new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime()
        );
        this.logs.set(sortedLogs);
        this.filteredLogs.set(sortedLogs);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando logs:', error);
        this.showErrorToast('Error al cargar historial');
        this.isLoading.set(false);
      }
    });
  }

  // Filtrar logs
  filterLogs(): void {
    const search = this.searchTerm().toLowerCase();
    const allLogs = this.logs();

    if (!search) {
      this.filteredLogs.set(allLogs);
      return;
    }

    const filtered = allLogs.filter(log => {
      const searchableText = `
        ${log.email_destino}
        ${log.exitoso === 1 ? 'exitoso' : 'error'}
        ${log.error_mensaje || ''}
        ${this.formatearFecha(new Date(log.fecha_envio))}
      `.toLowerCase();

      return searchableText.includes(search);
    });

    this.filteredLogs.set(filtered);
  }

  // Estadísticas
  getTotalLogs(): number {
    return this.logs().length;
  }

  getExitosos(): number {
    return this.logs().filter(log => log.exitoso === 1).length;
  }

  getConError(): number {
    return this.logs().filter(log => log.exitoso === 0).length;
  }

  // Utilidades
  formatearFecha(fecha: string | Date): string {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoBadge(exitoso: number): { class: string, icon: string, label: string } {
    if (exitoso === 1) {
      return {
        class: 'badge-success',
        icon: 'fas fa-check',
        label: 'Exitoso'
      };
    } else {
      return {
        class: 'badge-error',
        icon: 'fas fa-times',
        label: 'Error'
      };
    }
  }

  getPeriodoLabel(log: RendicionEnvioLog): string {
    const inicio = new Date(log.periodo_inicio);
    const fin = new Date(log.periodo_fin);

    const inicioStr = inicio.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    const finStr = fin.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return `${inicioStr} - ${finStr}`;
  }

  // Toasts
  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 9999; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-error shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">${message}</span>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.parentNode?.removeChild(toast), 4000);
  }
}
