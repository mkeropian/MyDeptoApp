import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { environment } from "../../../environments/environment";
import { User } from "../interfaces/user.interface";
import { Observable } from "rxjs";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class UsuariosService {
  private http = inject(HttpClient);

  getUsuarios() {
    return this.http.get<User[]>(`${baseUrl}/usuarios/all`);
  }

  updateTemaUsuario(id:number, usuarioTemaLike: Partial<User>): Observable<User> {
    return this.http.post<User>(`${baseUrl}/usuarios/tema/${id}`, usuarioTemaLike);
  }

}
