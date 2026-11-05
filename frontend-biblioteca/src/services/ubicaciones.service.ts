import { fetchAPI } from './api-client';

export interface Ubicacion {
  id_ubicacion: number;
  id_biblioteca: number;
  id_estado_ubicacion?: number;
  nombre_ubicacion: string;
  seccion_ubicacion?: string | null;
  estanteria_ubicacion?: string | null;
  descripcion_ubicacion?: string | null;
  nombre_biblioteca?: string;
  codigo_estado?: string;
  nombre_estado?: string;
}

export interface UbicacionPayload {
  idBiblioteca: number;
  nombre: string;
  seccion?: string;
  estanteria?: string;
  descripcion?: string;
  idEstado?: number;
}

export const ubicacionesService = {
  getAll: (filtros?: { idBiblioteca?: number | string; idEstado?: number | string }): Promise<Ubicacion[]> => {
    const qs = new URLSearchParams();
    if (filtros?.idBiblioteca) qs.set('idBiblioteca', String(filtros.idBiblioteca));
    if (filtros?.idEstado) qs.set('idEstado', String(filtros.idEstado));
    const query = qs.toString();
    return fetchAPI(query ? `/ubicaciones?${query}` : '/ubicaciones');
  },

  create: (datos: UbicacionPayload): Promise<Ubicacion> =>
    fetchAPI('/ubicaciones', { authenticated: true, method: 'POST', body: JSON.stringify(datos) }),

  update: (id: number | string, datos: Partial<UbicacionPayload>): Promise<Ubicacion> =>
    fetchAPI(`/ubicaciones/${id}`, { authenticated: true, method: 'PUT', body: JSON.stringify(datos) }),

  delete: (id: number | string): Promise<Ubicacion> =>
    fetchAPI(`/ubicaciones/${id}`, { authenticated: true, method: 'DELETE' }),
};
