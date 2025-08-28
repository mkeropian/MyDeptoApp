import { Component, computed, inject, signal } from '@angular/core';
import { MiniMapComponent } from '../../../../shared/components/mini-map/mini-map.component';
import { v4 as uuid } from 'uuid';
import { Departamento, DepartamentoBackend } from '../../../../departamentos/interfaces/departamento.interface';
import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cards-page',
  imports: [MiniMapComponent],
  templateUrl: './cards-page.component.html',
  styles: `
	.map-container {
		z-index: 1;
	}
  `
})
export class CardsPageComponent {

  departamentosService = inject(DepartamentosService);

  departamentosResource = rxResource({
    request: () => ({}),
    loader: () => this.departamentosService.getDepartamentosRaw()
  });

  departamentos = computed(() => {
    const backendData: DepartamentoBackend[] = this.departamentosResource.value() || [];

    // Transformar los datos del backend a la interfaz Departamento
    const transformedData: Departamento[] = backendData.map(item => {
      try {
        // Parsear las coordenadas "lng,lat" a objeto
        const [lng, lat] = item.lnglat.split(',').map(coord => parseFloat(coord.trim()));

        // Validar que las coordenadas sean números válidos
        if (isNaN(lng) || isNaN(lat)) {
          throw new Error('Coordenadas inválidas');
        }

        return {
          id: item.id,
          idProp: item.idProp.toString(),
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
        console.error(`Error parseando coordenadas para ${item.nombre}:`, error);
        console.error('Coordenadas recibidas:', item.lnglat);

        // Coordenadas por defecto (Buenos Aires) si hay error
        return {
          id: item.id,
          idProp: item.idProp.toString(),
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

    console.log('Datos del backend:', backendData);
    console.log('Departamentos transformados:', transformedData);
    return transformedData;
  });
}
