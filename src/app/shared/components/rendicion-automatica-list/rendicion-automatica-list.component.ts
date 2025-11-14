// src/app/shared/components/rendicion-automatica-list/rendicion-automatica-list.component.ts
import { Component, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RendicionAutomaticaService } from '../../services/rendicion-automatica.service';
import { RendicionAutomaticaConfig } from '../../interfaces/rendicion-automatica.interface';
import { RendicionAutomaticaModalComponent } from '../rendicion-automatica-modal/rendicion-automatica-modal.component';
import { RendicionLogsModalComponent } from '../rendicion-logs-modal/rendicion-logs-modal.component';
import Swal from 'sweetalert2';

interface ConfigEstado {
  estado: 'activo' | 'pausado' | 'error' | 'pendiente';
  proximoEnvio: Date;
  tiempoRestante: string;
}

interface ConfigAgrupada {
  propietario: string;
  configs: RendicionAutomaticaConfig[];
}

interface Filtros {
  propietario: string;
  frecuencia: string;
  estado: 'todos' | 'activo' | 'pausado' | 'error' | 'pendiente';
}

@Component({
  selector: 'app-rendicion-automatica-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RendicionAutomaticaModalComponent,
    RendicionLogsModalComponent
  ],
  templateUrl: './rendicion-automatica-list.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class RendicionAutomaticaListComponent implements OnInit {

  // Services
  rendicionService = inject(RendicionAutomaticaService);

  // ViewChild
  @ViewChild(RendicionAutomaticaModalComponent) modal!: RendicionAutomaticaModalComponent;
  @ViewChild(RendicionLogsModalComponent) logsModal!: RendicionLogsModalComponent;

  // Signals - CORREGIDO: Inicializar con array vacío
  isLoading = signal<boolean>(false);
  configs = signal<RendicionAutomaticaConfig[]>([]);
  searchTerm = signal<string>('');
  filtros = signal<Filtros>({
    propietario: '',
    frecuencia: '',
    estado: 'todos'
  });

  // Computed values - CORREGIDO: Agregar verificaciones de array
  totalConfigs = computed(() => {
    const configs = this.configs();
    return Array.isArray(configs) ? configs.length : 0;
  });

  activasCount = computed(() => {
    const configs = this.configs();
    // CORREGIDO: Verificar que configs sea un array antes de usar filter
    if (!Array.isArray(configs)) {
      return 0;
    }
    return configs.filter(config => config.activo === 1).length;
  });

  pausadasCount = computed(() => {
    const configs = this.configs();
    // CORREGIDO: Verificar que configs sea un array antes de usar filter
    if (!Array.isArray(configs)) {
      return 0;
    }
    return configs.filter(config => config.activo === 0).length;
  });

  configsFiltradas = computed(() => {
    let filtered = this.configs();

    // CRÍTICO: Verificar que sea un array
    if (!Array.isArray(filtered)) {
      return [];
    }

    const search = this.searchTerm().toLowerCase();
    const filtrosActuales = this.filtros();

    if (search) {
      filtered = filtered.filter(config =>
        config.propietarioNombre?.toLowerCase().includes(search) ||
        config.email_destino.toLowerCase().includes(search) ||
        config.frecuencia.toLowerCase().includes(search)
      );
    }

    if (filtrosActuales.propietario) {
      filtered = filtered.filter(config =>
        config.propietarioNombre === filtrosActuales.propietario
      );
    }

    if (filtrosActuales.frecuencia) {
      filtered = filtered.filter(config =>
        config.frecuencia === filtrosActuales.frecuencia
      );
    }

    if (filtrosActuales.estado !== 'todos') {
      filtered = filtered.filter(config => {
        const estado = this.getConfigEstado(config).estado;
        return estado === filtrosActuales.estado;
      });
    }

    return filtered;
  });

  configsAgrupadas = computed(() => {
    const filtered = this.configsFiltradas();

    // CRÍTICO: Verificar que sea un array
    if (!Array.isArray(filtered)) {
      return [];
    }

    const grupos = new Map<string, RendicionAutomaticaConfig[]>();

    filtered.forEach(config => {
      const propietario = config.propietarioNombre || 'Sin propietario';
      if (!grupos.has(propietario)) {
        grupos.set(propietario, []);
      }
      grupos.get(propietario)!.push(config);
    });

    return Array.from(grupos.entries()).map(([propietario, configs]) => ({
      propietario,
      configs
    }));
  });

  propietariosUnicos = computed(() => {
    const configs = this.configs();

    // CRÍTICO: Verificar que sea un array
    if (!Array.isArray(configs)) {
      return [];
    }

    const propietarios = configs
      .map(config => config.propietarioNombre)
      .filter((propietario, index, array) =>
        propietario && array.indexOf(propietario) === index
      );
    return propietarios as string[];
  });

  frecuenciasUnicas = computed(() => {
    const configs = this.configs();

    // CRÍTICO: Verificar que sea un array
    if (!Array.isArray(configs)) {
      return [];
    }

    const frecuencias = configs
      .map(config => config.frecuencia)
      .filter((frecuencia, index, array) => array.indexOf(frecuencia) === index);
    return frecuencias;
  });

  ngOnInit(): void {
    this.loadConfigs();
  }

  // Data loading - CORREGIDO: Mejor manejo de errores
  private loadConfigs(): void {
    this.isLoading.set(true);
    this.rendicionService.getAll().subscribe({
      next: (configs) => {
        // CORREGIDO: Verificar que la respuesta sea un array
        if (Array.isArray(configs)) {
          this.configs.set(configs);
        } else {
          console.warn('La respuesta del servicio no es un array:', configs);
          this.configs.set([]);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando configuraciones:', error);
        this.showErrorToast('Error al cargar configuraciones');
        // CORREGIDO: Asegurar que configs sea un array en caso de error
        this.configs.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // Modal actions
  nuevaConfiguracion(): void {
    this.modal.open();
  }

  editarConfiguracion(config: RendicionAutomaticaConfig): void {
    this.modal.openEdit(config);
  }

  // Config actions usando métodos REALES del servicio
  // CORREGIDO: Cerrar modal antes de SweetAlert2, reabrir después
  toggleActivo(config: RendicionAutomaticaConfig): void {
    const nuevoEstado = config.activo === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'pausar';

    // 1. Cerrar el modal antes de mostrar SweetAlert2
    const dialogEl = document.querySelector('dialog[open]') as HTMLDialogElement;
    dialogEl?.close();

    // 2. Mostrar SweetAlert2 (ahora sin el modal bloqueando)
    Swal.fire({
      title: `¿${accion === 'activar' ? 'Activar' : 'Pausar'} configuración?`,
      text: `Se ${accion}á la rendición automática para ${config.propietarioNombre}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 1 ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // 3a. Usuario confirmó → Ejecutar acción
        this.rendicionService.toggleActivo(config.id).subscribe({
          next: () => {
            this.showSuccessToast(`Configuración ${accion === 'activar' ? 'activada' : 'pausada'} exitosamente`);
            // Recargar datos y reabrir modal
            this.loadConfigs();
            setTimeout(() => dialogEl?.showModal(), 100);
          },
          error: (error) => {
            console.error(`Error al ${accion} configuración:`, error);
            this.showErrorToast(`Error al ${accion} configuración`);
            // Reabrir modal incluso si hay error
            setTimeout(() => dialogEl?.showModal(), 100);
          }
        });
      } else {
        // 3b. Usuario canceló → Solo reabrir modal
        setTimeout(() => dialogEl?.showModal(), 100);
      }
    });
  }

  forzarEnvio(config: RendicionAutomaticaConfig): void {
    // 1. Cerrar el modal antes de mostrar SweetAlert2
    const dialogEl = document.querySelector('dialog[open]') as HTMLDialogElement;
    dialogEl?.close();

    // 2. Mostrar SweetAlert2
    Swal.fire({
      title: '¿Forzar envío de rendición?',
      text: `Se generará y enviará la rendición AHORA a ${config.email_destino}. Esta acción NO afectará la programación automática.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, enviar ahora',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // 3a. Usuario confirmó → Ejecutar acción
        this.rendicionService.forzarEnvio(config.id).subscribe({
          next: () => {
            this.showSuccessToast('Rendición enviada exitosamente');
            // Recargar datos y reabrir modal
            this.loadConfigs();
            setTimeout(() => dialogEl?.showModal(), 100);
          },
          error: (error) => {
            console.error('Error forzando envío:', error);
            this.showErrorToast('Error al forzar envío');
            // Reabrir modal incluso si hay error
            setTimeout(() => dialogEl?.showModal(), 100);
          }
        });
      } else {
        // 3b. Usuario canceló → Solo reabrir modal
        setTimeout(() => dialogEl?.showModal(), 100);
      }
    });
  }

  eliminarConfiguracion(config: RendicionAutomaticaConfig): void {
    // 1. Cerrar el modal antes de mostrar SweetAlert2
    const dialogEl = document.querySelector('dialog[open]') as HTMLDialogElement;
    dialogEl?.close();

    // 2. Mostrar SweetAlert2
    Swal.fire({
      title: '¿Eliminar configuración?',
      text: `Se eliminará la configuración para ${config.propietarioNombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // 3a. Usuario confirmó → Ejecutar acción
        this.rendicionService.delete(config.id).subscribe({
          next: () => {
            this.showSuccessToast('Configuración eliminada exitosamente');
            // Recargar datos y reabrir modal
            this.loadConfigs();
            setTimeout(() => dialogEl?.showModal(), 100);
          },
          error: (error) => {
            console.error('Error eliminando configuración:', error);
            this.showErrorToast('Error al eliminar configuración');
            // Reabrir modal incluso si hay error
            setTimeout(() => dialogEl?.showModal(), 100);
          }
        });
      } else {
        // 3b. Usuario canceló → Solo reabrir modal
        setTimeout(() => dialogEl?.showModal(), 100);
      }
    });
  }

  verLogs(config: RendicionAutomaticaConfig): void {
    this.logsModal.open(config.id, config.propietarioNombre || 'Propietario');
  }

  // Filter methods
  onPropietarioChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtros.update(f => ({ ...f, propietario: target.value }));
  }

  onFrecuenciaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtros.update(f => ({ ...f, frecuencia: target.value }));
  }

  onEstadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtros.update(f => ({ ...f, estado: target.value as any }));
  }

  clearFiltros(): void {
    this.searchTerm.set('');
    this.filtros.set({
      propietario: '',
      frecuencia: '',
      estado: 'todos'
    });
  }

  // Helper methods
  getConfigEstado(config: RendicionAutomaticaConfig): ConfigEstado {
    if (config.activo === 0) {
      return {
        estado: 'pausado',
        proximoEnvio: new Date(),
        tiempoRestante: 'Pausado'
      };
    }

    try {
      const proximoEnvio = this.rendicionService.calcularProximoEnvio(
        config.frecuencia,
        config.dia_envio || 1,
        config.hora_envio
      );

      return {
        estado: 'activo',
        proximoEnvio: new Date(proximoEnvio),
        tiempoRestante: this.calculateTimeRemaining(new Date(proximoEnvio))
      };
    } catch (error) {
      return {
        estado: 'error',
        proximoEnvio: new Date(),
        tiempoRestante: 'Error'
      };
    }
  }

  private calculateTimeRemaining(targetDate: Date): string {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) return 'Vencido';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  getConfigsActivas(configs: RendicionAutomaticaConfig[]): number {
    return configs.filter(config => config.activo === 1).length;
  }

  getEstadoBadgeColor(estado: string): string {
    switch (estado) {
      case 'activo': return 'badge-success';
      case 'pausado': return 'badge-warning';
      case 'error': return 'badge-error';
      case 'pendiente': return 'badge-info';
      default: return 'badge-neutral';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'activo': return 'Activa';
      case 'pausado': return 'Pausada';
      case 'error': return 'Error';
      case 'pendiente': return 'Pendiente';
      default: return 'Desconocido';
    }
  }

  shouldShowDay(config: RendicionAutomaticaConfig): boolean {
    return ['semanal', 'mensual', 'trimestral'].includes(config.frecuencia);
  }

  getButtonClass(config: RendicionAutomaticaConfig): string {
    return config.activo === 1
      ? 'btn btn-sm btn-outline btn-warning'
      : 'btn btn-sm btn-outline btn-success';
  }

  getButtonTitle(config: RendicionAutomaticaConfig): string {
    return config.activo === 1
      ? 'Pausar configuración'
      : 'Activar configuración';
  }

  getIconClass(config: RendicionAutomaticaConfig): string {
    return config.activo === 1
      ? 'fas fa-pause'
      : 'fas fa-play';
  }

  getUltimoEnvioIconClass(estado: ConfigEstado): string {
    switch (estado.estado) {
      case 'activo': return 'fas fa-check-circle text-success';
      case 'error': return 'fas fa-times-circle text-error';
      default: return 'fas fa-clock text-info';
    }
  }

  formatearUltimoEnvio(fecha: string | Date): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Event handlers
  onConfigCreated(): void {
    this.loadConfigs();
  }

  onConfigUpdated(): void {
    this.loadConfigs();
  }

  // Toast notifications
  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 4rem; right: 1rem; z-index: 9999; max-width: 24rem;';
    toast.innerHTML = `
      <div class="alert alert-success shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">${message}</span>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.parentNode?.removeChild(toast), 4000);
  }

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
