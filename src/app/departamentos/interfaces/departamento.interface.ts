export interface Departamento {
  id: number;
  idProp: string;
  nombre: string;
  descripcion: string;
  calle: string;
  barrio: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  lngLat: { lng: number; lat: number };
  observaciones: string;
  activo: number;
}

export interface DepartamentoBackend {
  id: number;
  idProp: number;
  nombre: string;
  descripcion: string;
  calle: string;
  barrio: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  lnglat: string; // Como viene del backend (minúscula)
  observaciones: string;
  activo: number;
}
