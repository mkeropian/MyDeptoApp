import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  /**
   * Muestra una notificación tipo toast usando SweetAlert2
   * @param titulo - Título de la notificación
   * @param tipo - Tipo de notificación: 'success' | 'error' | 'warning' | 'info'
   * @param mensaje - Mensaje adicional (opcional)
   */
  mostrarNotificacion(titulo: string, tipo: 'success' | 'error' | 'warning' | 'info', mensaje?: string): void {
    const config: any = {
      title: titulo,
      icon: tipo,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    };

    if (mensaje) {
      config.text = mensaje;
    }

    Swal.fire(config);
  }

}
