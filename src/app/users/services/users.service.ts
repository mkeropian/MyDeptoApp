import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { environment } from "../../../environments/environment";
import { User } from "../interfaces/user.interface";

const baseUrl = environment.baseUrl;

@Injectable({providedIn: 'root'})
export class UsuariosService {
  private http = inject(HttpClient);

  getUsuarios() {
    return this.http.get<User[]>(`${baseUrl}/usuarios/all`);
  }
}
