// src/app/auth/services/roles-permisos.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol } from '../interfaces/user.interface';
import { Permiso } from '../interfaces/roles-permisos.interface';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class RolesPermisosService {
  private http = inject(HttpClient);

  // ========== ROLES ==========

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${baseUrl}/roles/all`);
  }

  createRol(rol: Partial<Rol>): Observable<Rol> {
    return this.http.post<Rol>(`${baseUrl}/roles`, rol);
  }

  // ========== PERMISOS ==========

  getPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${baseUrl}/permisosVistas/all`);
  }

  createPermiso(permiso: Partial<Permiso>): Observable<Permiso> {
    return this.http.post<Permiso>(`${baseUrl}/permisosVistas`, permiso);
  }

  // ========== ASIGNACIÓN ROLES-PERMISOS ==========

  getPermisosDeRol(rolId: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${baseUrl}/roles/${rolId}/permisos`);
  }

  asignarPermisosARol(rolId: number, permisosIds: number[]): Observable<any> {
    return this.http.post(`${baseUrl}/roles/${rolId}/permisos`, { permisos_ids: permisosIds });
  }
}
