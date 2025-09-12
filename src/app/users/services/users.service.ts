import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { environment } from "../../../environments/environment";
import { Rol, User } from "../interfaces/user.interface";
import { Observable } from "rxjs";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class UsuariosService {
  private http = inject(HttpClient);

  getUsuarios() {
    return this.http.get<User[]>(`${baseUrl}/usuarios/all`);
  }

  createUsuario(usuario: Partial<User>) {
    return this.http.put<User>(`${baseUrl}/usuarios`, usuario);
  }

  updateTemaUsuario(id:number, usuarioTemaLike: Partial<User>): Observable<User> {
    return this.http.post<User>(`${baseUrl}/usuarios/tema/${id}`, usuarioTemaLike);
  }

  updateUsuarioActivo(id:number, usuarioActivoLike: Partial<User>): Observable<User> {
    return this.http.post<User>(`${baseUrl}/usuarios/activo/${id}`, usuarioActivoLike);
  }

  /**
   * Sube el archivo de avatar al servidor
   */
  uploadAvatar(formData: FormData) {
    return this.http.post(`${baseUrl}/usuarios/upload-avatar`, formData);
  }

  /**
   * Sube avatar para un usuario específico
   */
  uploadAvatarForUser(userId: string | number, file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post(`${baseUrl}/usuarios/${userId}/avatar`, formData);
  }

  getRoles() {
    return this.http.get<Rol[]>(`${baseUrl}/roles/all`);
  }
}
