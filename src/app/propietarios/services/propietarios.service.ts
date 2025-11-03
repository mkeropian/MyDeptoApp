// propietarios.service.ts

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Propietario } from "../interfaces/propietario.interface";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class PropietariosService {
  private http = inject(HttpClient);

  // Lista de archivos válidos en assets (si conoces los nombres)
  private readonly VALID_ASSET_FILES = [
    'default-avatar.png',
    // Agrega aquí otros archivos que SÍ existen en tu carpeta assets
  ];

  getPropietarios() {
    return this.http.get<Propietario[]>(`${baseUrl}/propietarios/all`);
  }

  getPropietariosActivos() {
    return this.http.get<Propietario[]>(`${baseUrl}/propietarios/allActives`);
  }

  createPropietario(propietarioLike: Partial<Propietario>): Observable<Propietario> {
    return this.http.put<Propietario>(`${baseUrl}/propietarios`, propietarioLike);
  }

  uploadAvatarPropietario(file: File, propietarioId: number | string): Observable<any> {
    if (!file) {
      throw new Error('Archivo requerido');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Archivo demasiado grande (máximo 5MB)');
    }

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('propietarioId', propietarioId.toString());

    return this.http.post(`${baseUrl}/archivos/upload-avatar-propietario`, formData);
  }

  toggleActivo(id: number): Observable<{ id: number; activo: number }> {
    return this.http.post<{ id: number; activo: number }>(`${baseUrl}/propietarios/activo/${id}`, {});
  }

  getAvatarUrl(avatarUrl: string | null | undefined): string {
    // Si no hay avatarUrl o está vacío, devolver default
    if (!avatarUrl || avatarUrl.trim() === '') {
      return this.getDefaultAvatarUrl();
    }

    const cleanUrl = avatarUrl.trim();

    // 1. Si ya es una URL HTTP/HTTPS válida, devolverla tal cual
    if (this.isValidHttpUrl(cleanUrl)) {
      return cleanUrl;
    }

    // 2. Si empieza con 'assets/', validar que el archivo exista en nuestra lista
    if (cleanUrl.startsWith('assets/') || cleanUrl.startsWith('/assets/')) {
      const fileName = this.extractFileName(cleanUrl);

      // Si el archivo está en la lista de válidos, devolverlo
      if (this.VALID_ASSET_FILES.includes(fileName)) {
        return cleanUrl;
      }

      // Si NO está en la lista, asumir que no existe y devolver default
      console.warn(`⚠️ Avatar inválido en assets: ${cleanUrl}, usando default`);
      return this.getDefaultAvatarUrl();
    }

    // 3. Si es un filename (como 'propietario_10_...jpg'), construir URL del backend
    return `${baseUrl}/archivos/avatar/${cleanUrl}`;
  }

  /**
   * Extrae el nombre del archivo de una ruta
   */
  private extractFileName(path: string): string {
    return path.split('/').pop() || '';
  }

  /**
   * Verifica si una cadena es una URL HTTP/HTTPS válida
   */
  private isValidHttpUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * URL del avatar por defecto
   */
  getDefaultAvatarUrl(): string {
    return 'assets/images/default-avatar.png';
  }

  updatePropietario(id: number, propietario: Partial<Propietario>): Observable<any> {
    return this.http.post<any>(`${baseUrl}/propietarios/${id}`, propietario);
  }

  // NUEVO: Obtener usuario vinculado a un propietario
  getUsuarioByPropietario(idPropietario: number): Observable<any> {
    return this.http.get(`${baseUrl}/propietarios/${idPropietario}/usuario`);
  }

}
