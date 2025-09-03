import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { MiniMapComponent } from "../../../shared/components/mini-map/mini-map.component";
import { Departamento, DepartamentoBackend } from '../../../departamentos/interfaces/departamento.interface';

@Component({
  selector: 'app-dashboard-departamentos-page',
  imports: [MiniMapComponent],
  templateUrl: './dashboard-departamentos-page.component.html'
})
export class DashboardDepartamentosPageComponent {
  departamentosService = inject(DepartamentosService);
  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosRaw()
  });

  departamentos = computed(() => {
    const backendData: DepartamentoBackend[] = this.departamentosResource.value() || [];
    // console.log(backendData);
    // Transformar los datos del backend a la interfaz Departamento
    const transformedData: Departamento[] = backendData.map(item => {
      try {
        // Parsear las coordenadas "lng,lat" a objeto
        const [lng, lat] = item.lngLat.split(',').map(coord => parseFloat(coord.trim()));

        // Validar que las coordenadas sean números válidos
        if (isNaN(lng) || isNaN(lat)) {
          throw new Error('Coordenadas inválidas');
        }

        return {
          id: item.id,
          idProp: item.idProp,
          nombre: item.nombre,
          descripcion: item.descripcion,
          calle: item.calle,
          barrio: item.barrio,
          localidad: item.localidad,
          provincia: item.provincia,
          codigoPostal: item.codigoPostal,
          lngLat: { lng, lat }, // Crear el objeto esperado
          observaciones: item.observaciones,
          activo: item.activo
        };
      } catch (error) {
        // console.error(`Error parseando coordenadas para ${item.nombre}:`, error);
        // console.error('Coordenadas recibidas:', item.lngLat);

        // Coordenadas por defecto (Buenos Aires) si hay error
        return {
          id: item.id,
          idProp: item.idProp,
          nombre: item.nombre,
          descripcion: item.descripcion,
          calle: item.calle,
          barrio: item.barrio,
          localidad: item.localidad,
          provincia: item.provincia,
          codigoPostal: item.codigoPostal,
          lngLat: { lng: -58.3816, lat: -34.6037 }, // Buenos Aires por defecto
          observaciones: item.observaciones,
          activo: item.activo
        };
      }
    });

    // console.log('Datos del backend:', backendData);
    // console.log('Departamentos transformados:', transformedData);
    return transformedData;
  });

}
