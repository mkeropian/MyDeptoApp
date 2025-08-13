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
