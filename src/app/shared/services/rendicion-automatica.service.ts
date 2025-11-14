// src/app/shared/services/rendicion-automatica.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  RendicionAutomaticaConfig,
  CreateRendicionAutomaticaRequest,
  UpdateRendicionAutomaticaRequest,
  RendicionEnvioLog,
  RendicionConfigResponse,
  ApiResponse
} from '../interfaces/rendicion-automatica.interface';

const baseUrl = environment.baseUrl;

// CORREGIDO: Interface para las respuestas del backend que vienen con {ok, data}
interface BackendArrayResponse<T> {
  ok: boolean;
  data: T[];
}

interface BackendSingleResponse<T> {
  ok: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class RendicionAutomaticaService {
  private http = inject(HttpClient);

  /**
   * Obtener todas las configuraciones de rendiciones automáticas
   * CORREGIDO: Extraer .data de la respuesta del backend
   */
  getAll(): Observable<RendicionAutomaticaConfig[]> {
    return this.http.get<BackendArrayResponse<RendicionAutomaticaConfig>>(`${baseUrl}/rendicion-automatica/all`)
      .pipe(
        map(response => {
          // CORREGIDO: Extraer el array de la propiedad .data
          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          console.warn('⚠️ Respuesta inesperada del backend:', response);
          return [];
        }),
        catchError((error) => {
          console.error('❌ Error obteniendo configuraciones:', error);
          throw error;
        })
      );
  }

  /**
   * Obtener una configuración por ID
   * CORREGIDO: Extraer .data de la respuesta del backend
   */
  getById(id: number): Observable<RendicionAutomaticaConfig> {
    return this.http.get<BackendSingleResponse<RendicionAutomaticaConfig>>(`${baseUrl}/rendicion-automatica/${id}`)
      .pipe(
        map(response => {
          // CORREGIDO: Extraer el objeto de la propiedad .data
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Configuración no encontrada');
        }),
        catchError((error) => {
          console.error('❌ Error obteniendo configuración:', error);
          throw error;
        })
      );
  }

  /**
   * Obtener configuraciones por propietario
   * CORREGIDO: Extraer .data de la respuesta del backend
   */
  getByPropietario(idPropietario: number): Observable<RendicionAutomaticaConfig[]> {
    return this.http.get<BackendArrayResponse<RendicionAutomaticaConfig>>(`${baseUrl}/rendicion-automatica/propietario/${idPropietario}`)
      .pipe(
        map(response => {
          // CORREGIDO: Extraer el array de la propiedad .data
          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        }),
        catchError((error) => {
          console.error('❌ Error obteniendo configuraciones del propietario:', error);
          throw error;
        })
      );
  }

  /**
   * Crear nueva configuración
   */
  create(config: CreateRendicionAutomaticaRequest): Observable<RendicionConfigResponse> {
    return this.http.post<RendicionConfigResponse>(`${baseUrl}/rendicion-automatica`, config)
      .pipe(
        map((response) => {
          if (!response.ok) {
            throw new Error(response.msg || 'Error al crear configuración');
          }
          return response;
        }),
        catchError((error) => {
          console.error('❌ Error creando configuración:', error);
          throw error;
        })
      );
  }

  /**
   * Actualizar configuración existente
   */
  update(id: number, config: UpdateRendicionAutomaticaRequest): Observable<RendicionConfigResponse> {
    return this.http.put<RendicionConfigResponse>(`${baseUrl}/rendicion-automatica/${id}`, config)
      .pipe(
        map((response) => {
          if (!response.ok) {
            throw new Error(response.msg || 'Error al actualizar configuración');
          }
          return response;
        }),
        catchError((error) => {
          console.error('❌ Error actualizando configuración:', error);
          throw error;
        })
      );
  }

  /**
   * Eliminar configuración
   */
  delete(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${baseUrl}/rendicion-automatica/${id}`)
      .pipe(
        map((response) => {
          if (!response.ok) {
            throw new Error(response.msg || 'Error al eliminar configuración');
          }
          return response;
        }),
        catchError((error) => {
          console.error('❌ Error eliminando configuración:', error);
          throw error;
        })
      );
  }

  /**
   * Activar/pausar configuración
   */
  toggleActivo(id: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${baseUrl}/rendicion-automatica/${id}/toggle`, {})
      .pipe(
        map((response) => {
          if (!response.ok) {
            throw new Error(response.msg || 'Error al cambiar estado');
          }
          return response;
        }),
        catchError((error) => {
          console.error('❌ Error cambiando estado:', error);
          throw error;
        })
      );
  }

  /**
   * Obtener logs de una configuración
   * CORREGIDO: Extraer .data de la respuesta del backend
   */
  getLogs(idConfig: number): Observable<RendicionEnvioLog[]> {
    return this.http.get<BackendArrayResponse<RendicionEnvioLog>>(`${baseUrl}/rendicion-automatica/logs/${idConfig}`)
      .pipe(
        map(response => {
          // CORREGIDO: Extraer el array de la propiedad .data
          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        }),
        catchError((error) => {
          console.error('❌ Error obteniendo logs:', error);
          throw error;
        })
      );
  }

  /**
   * Forzar envío inmediato respetando configuración pero sin afectar programación
   */
  forzarEnvio(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${baseUrl}/rendicion-automatica/forzar-envio/${id}`, {})
      .pipe(
        map((response) => {
          if (!response.ok) {
            throw new Error(response.msg || 'Error en envío forzado');
          }
          return response;
        }),
        catchError((error) => {
          console.error('❌ Error en envío forzado:', error);
          throw error;
        })
      );
  }

  /**
   * Obtener configuraciones pendientes (solo admin)
   * CORREGIDO: Extraer .data de la respuesta del backend
   */
  getPendientes(): Observable<RendicionAutomaticaConfig[]> {
    return this.http.get<BackendArrayResponse<RendicionAutomaticaConfig>>(`${baseUrl}/rendicion-automatica/admin/pendientes`)
      .pipe(
        map(response => {
          // CORREGIDO: Extraer el array de la propiedad .data
          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        }),
        catchError((error) => {
          console.error('❌ Error obteniendo pendientes:', error);
          throw error;
        })
      );
  }

  /**
   * Forzar ejecución de todas las configuraciones (solo admin)
   */
  ejecutarAhora(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${baseUrl}/rendicion-automatica/admin/ejecutar-ahora`, {})
      .pipe(
        map((response) => {
          if (!response.ok) {
            throw new Error(response.msg || 'Error ejecutando rendiciones');
          }
          return response;
        }),
        catchError((error) => {
          console.error('❌ Error ejecutando rendiciones:', error);
          throw error;
        })
      );
  }

  /**
   * Calcular próximo envío basado en configuración
   * Utilidad del frontend para mostrar información al usuario
   */
  calcularProximoEnvio(frecuencia: string, diaEnvio: number, horaEnvio: string): Date {
    const ahora = new Date();
    const [hora, minutos] = horaEnvio.split(':').map(Number);
    let proximoEnvio = new Date();

    switch (frecuencia) {
      case 'diaria':
        proximoEnvio = new Date(ahora);
        proximoEnvio.setHours(hora, minutos, 0, 0);

        // Si ya pasó la hora de hoy, programar para mañana
        if (proximoEnvio <= ahora) {
          proximoEnvio.setDate(proximoEnvio.getDate() + 1);
        }
        break;

      case 'semanal':
        proximoEnvio = new Date(ahora);
        proximoEnvio.setHours(hora, minutos, 0, 0);

        // Encontrar el próximo día de la semana
        const diasHastaProximo = (diaEnvio - proximoEnvio.getDay() + 7) % 7;
        if (diasHastaProximo === 0 && proximoEnvio <= ahora) {
          // Si es el mismo día pero ya pasó la hora, programar para la próxima semana
          proximoEnvio.setDate(proximoEnvio.getDate() + 7);
        } else {
          proximoEnvio.setDate(proximoEnvio.getDate() + diasHastaProximo);
        }
        break;

      case 'quincenal':
        proximoEnvio = new Date(ahora);
        proximoEnvio.setHours(hora, minutos, 0, 0);

        // Si ya pasó la hora de hoy, programar para mañana, sino hoy
        if (proximoEnvio <= ahora) {
          proximoEnvio.setDate(proximoEnvio.getDate() + 15);
        }
        break;

      case 'mensual':
        proximoEnvio = new Date(ahora.getFullYear(), ahora.getMonth(), diaEnvio, hora, minutos);

        // Si el día ya pasó este mes o es hoy pero ya pasó la hora
        if (proximoEnvio <= ahora) {
          // Ir al próximo mes
          proximoEnvio.setMonth(proximoEnvio.getMonth() + 1);

          // Manejar meses con menos días
          if (proximoEnvio.getDate() !== diaEnvio) {
            proximoEnvio = new Date(proximoEnvio.getFullYear(), proximoEnvio.getMonth(), 0); // Último día del mes anterior
          }
        }
        break;

      case 'trimestral':
        proximoEnvio = new Date(ahora);
        proximoEnvio.setDate(diaEnvio);
        proximoEnvio.setHours(hora, minutos, 0, 0);

        // Calcular el próximo trimestre
        const mesActual = ahora.getMonth();
        const trimestreActual = Math.floor(mesActual / 3);
        let proximoTrimestre = trimestreActual;

        if (proximoEnvio <= ahora) {
          proximoTrimestre = (trimestreActual + 1) % 4;
          if (proximoTrimestre === 0) {
            proximoEnvio.setFullYear(proximoEnvio.getFullYear() + 1);
          }
        }

        proximoEnvio.setMonth(proximoTrimestre * 3);
        break;

      default:
        proximoEnvio = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // Mañana por defecto
    }

    return proximoEnvio;
  }

  /**
   * Formatear fecha para mostrar en la UI
   */
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener etiqueta legible de frecuencia
   */
  getFrequencyLabel(frecuencia: string): string {
    const labels: Record<string, string> = {
      'diaria': 'Diaria',
      'semanal': 'Semanal',
      'quincenal': 'Quincenal',
      'mensual': 'Mensual',
      'trimestral': 'Trimestral'
    };
    return labels[frecuencia] || frecuencia;
  }

  /**
   * Obtener etiqueta del día según frecuencia
   */
  getDayLabel(frecuencia: string, diaEnvio: number): string {
    if (frecuencia === 'semanal') {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return dias[diaEnvio] || `Día ${diaEnvio}`;
    }

    if (frecuencia === 'mensual' || frecuencia === 'trimestral') {
      return `Día ${diaEnvio} del mes`;
    }

    return '';
  }
}
