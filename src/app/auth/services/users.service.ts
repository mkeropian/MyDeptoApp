import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Rol, User, CreateUserRequest } from "../interfaces/user.interface";
import { Observable, map } from "rxjs";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class UsuariosService {
  private http = inject(HttpClient);

  getUsuarios(): Observable<User[]> {
    return this.http.get<User[]>(`${baseUrl}/usuarios/all`).pipe(
      map(users => users.map(user => ({
        ...user,
        // CORREGIDO: Si existe avatarUrl, construir la URL completa correctamente
        avatarUrl: user.avatarUrl ? `${baseUrl}/archivos/avatar/${user.avatarUrl}` : undefined
      })))
    );
  }

  createUsuario(usuario: CreateUserRequest) {
    return this.http.put<User>(`${baseUrl}/usuarios`, usuario);
  }

  updateTemaUsuario(id:number, usuarioTemaLike: Partial<User>): Observable<User> {
    return this.http.post<User>(`${baseUrl}/usuarios/tema/${id}`, usuarioTemaLike);
  }

  updateUsuarioActivo(id:number, usuarioActivoLike: Partial<User>): Observable<User> {
    return this.http.post<User>(`${baseUrl}/usuarios/activo/${id}`, usuarioActivoLike);
  }

  /**
   * Sube avatar de forma segura usando el endpoint dedicado
   */
  uploadAvatar(file: File, userId: number | string): Observable<any> {
    // Validaciones del lado cliente
    if (!file) {
      throw new Error('Archivo requerido');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido');
    }

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      throw new Error('Archivo demasiado grande (máximo 4MB)');
    }

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId.toString());

    return this.http.post(`${baseUrl}/archivos/upload-avatar`, formData);
  }

  /**
   * Obtiene URL segura del avatar
   */
  getAvatarUrl(fileName: string | null): string {
    if (!fileName) {
      return this.getDefaultAvatarUrl();
    }
    // CORREGIDO: baseUrl ya incluye /api
    return `${baseUrl}/archivos/avatar/${fileName}`;
  }

  /**
   * URL del avatar por defecto
   */
  getDefaultAvatarUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCA3NEM2MS4wNDU3IDc0IDcwIDY1LjA0NTcgNzAgNTRDNzAgNDIuOTU0MyA2MS4wNDU3IDM0IDUwIDM0QzM4Ljk1NDMgMzQgMzAgNDIuOTU0MyAzMCA1NEMzMCA2NS4wNDU3IDM4Ljk1NDMgNzQgNTAgNzRaIiBmaWxsPSIjOUI5REEwIi8+CjxwYXRoIGQ9Ik01MCA0OEM1My4zMTM3IDQ4IDU2IDQ1LjMxMzcgNTYgNDJDNTYgMzguNjg2MyA1My4zMTM3IDM2IDUwIDM2QzQ2LjY4NjMgMzYgNDQgMzguNjg2MyA0NCA0MkM0NCA0NS4zMTM3IDQ2LjY4NjMgNDggNTAgNDhaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
  }

  /**
   * Elimina avatar del usuario
   */
  deleteAvatar(userId: number): Observable<any> {
    return this.http.delete(`${baseUrl}/archivos/avatar/${userId}`);
  }

  getRoles() {
    return this.http.get<Rol[]>(`${baseUrl}/roles/all`);
  }

  asignarRolAUsuario(usuarioId: number, rolId: number): Observable<any> {
    return this.http.post(`${baseUrl}/usuarios/${usuarioId}/roles`, { rolId });
  }

  getRolesDeUsuario(usuarioId: number): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${baseUrl}/usuarios/${usuarioId}/roles`);
  }

  // NUEVO: Obtener propietario vinculado a un usuario
  getPropietarioByUsuario(idUser: number): Observable<{ idPropietario: number }> {
    return this.http.get<{ idPropietario: number }>(`${baseUrl}/usuarios/${idUser}/propietario`);
  }

  // NUEVO: Vincular usuario a propietario
  vincularPropietario(idUser: number, idPropietario: number): Observable<any> {
    return this.http.post(`${baseUrl}/usuarios/${idUser}/vincular-propietario`, { idPropietario });
  }

  // NUEVO: Desvincular usuario de propietario
  desvincularPropietario(idUser: number): Observable<any> {
    return this.http.delete(`${baseUrl}/usuarios/${idUser}/propietario`);
  }

  // NUEVO: Obtener todas las vinculaciones
  getVinculaciones(): Observable<any> {
    return this.http.get(`${baseUrl}/usuarios/vinculaciones/all`);
  }

  // Actualizar usuario completo
  updateUsuario(id: number, usuario: Partial<User>): Observable<User> {
    return this.http.post<User>(`${baseUrl}/usuarios/${id}`, usuario);
  }

  // Actualizar contraseña de usuario
  updateClave(id: number, claveData: { clave: string }): Observable<any> {
    return this.http.post(`${baseUrl}/usuarios/clave/${id}`, claveData);
  }

}
