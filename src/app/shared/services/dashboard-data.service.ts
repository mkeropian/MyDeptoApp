import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {

  // Signal que se incrementa cada vez que hay un cambio en pagos/gastos
  private dataChangeSignal = signal(0);

  // Exponer el signal como readonly para que los componentes puedan leerlo
  readonly dataChange = this.dataChangeSignal.asReadonly();

  // Intervalo para polling automático (opcional)
  private pollingInterval?: ReturnType<typeof setInterval>;

  constructor() {
    // Iniciar polling cada 15 minutos (900000 ms)
    this.startPolling(5 * 60 * 1000);
  }

  /**
   * Método para disparar una actualización de datos
   * Se debe llamar después de crear, actualizar o eliminar pagos/gastos
   */
  triggerRefresh(): void {
    this.dataChangeSignal.update(v => v + 1);
  }

  /**
   * Inicia el polling automático
   * @param intervalMs - Intervalo en milisegundos (por defecto 15 minutos)
   */
  private startPolling(intervalMs: number): void {
    this.pollingInterval = setInterval(() => {
      this.triggerRefresh();
    }, intervalMs);
  }

  /**
   * Detiene el polling automático
   * Útil si se necesita desactivar en algún momento
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  /**
   * Método para destruir el servicio y limpiar recursos
   */
  ngOnDestroy(): void {
    this.stopPolling();
  }
}
