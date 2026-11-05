import { armarQuery, fetchAPI, fetchPagina, type PaginaAPI } from './api-client';

export interface Ejemplar {
  id_ejemplar: number;
  id_libro: number;
  titulo_libro?: string;
  isbn_libro?: string | null;
  id_ubicacion: number;
  nombre_ubicacion?: string;
  seccion_ubicacion?: string | null;
  estanteria_ubicacion?: string | null;
  id_biblioteca?: number;
  nombre_biblioteca?: string;
  id_estado_ejemplar: number;
  codigo_estado?: string;
  nombre_estado?: string;
  codinterno_ejemplar: string;
  fechaadquisicion_ejemplar?: string | null;
  observacion_ejemplar?: string | null;
}

export interface EjemplarPayload {
  idLibro: number;
  idUbicacion: number;
  codigoInterno?: string;
  idEstado?: number;
  fechaAdquisicion?: string;
  observacion?: string;
}

export interface FiltrosEjemplares {
  idLibro?: number | string;
  idBiblioteca?: number | string;
  idUbicacion?: number | string;
  idEstado?: number | string;
  codigo?: string;
  page?: number;
  limit?: number;
}

export const ejemplaresService = {
  /** Una página de ejemplares, filtrada y paginada en el servidor */
  getPagina: (filtros: FiltrosEjemplares = {}): Promise<PaginaAPI<Ejemplar>> =>
    fetchPagina<Ejemplar>(`/ejemplares${armarQuery({ ...filtros })}`),

  create: (datos: EjemplarPayload): Promise<Ejemplar> =>
    fetchAPI('/ejemplares', { authenticated: true, method: 'POST', body: JSON.stringify(datos) }),

  /** Registra varias copias iguales (mismo libro, ubicación y estado) en una sola operación */
  createLote: (datos: EjemplarPayload & { cantidad: number }): Promise<Ejemplar[]> =>
    fetchAPI('/ejemplares/lote', { authenticated: true, method: 'POST', body: JSON.stringify(datos) }),

  update: (id: number | string, datos: Partial<EjemplarPayload>): Promise<Ejemplar> =>
    fetchAPI(`/ejemplares/${id}`, { authenticated: true, method: 'PUT', body: JSON.stringify(datos) }),

  delete: (id: number | string): Promise<Ejemplar> =>
    fetchAPI(`/ejemplares/${id}`, { authenticated: true, method: 'DELETE' }),
};
