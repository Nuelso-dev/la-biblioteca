import { fetchAPI } from './api-client';

export interface Editorial {
  id_editorial: number;
  id_estado_editorial?: number;
  entidad_estado_editorial?: string;
  nombre_editorial: string;
  pais_editorial?: string | null;
  nombre_estado?: string;
  codigo_estado?: string;
}

export const editorialesService = {
  getAll: (filtros?: { idEstado?: number | string; busqueda?: string }): Promise<Editorial[]> => {
    const qs = new URLSearchParams();
    if (filtros?.idEstado) qs.set('idEstado', String(filtros.idEstado));
    if (filtros?.busqueda) qs.set('busqueda', filtros.busqueda);
    const query = qs.toString();
    return fetchAPI(query ? `/editoriales?${query}` : '/editoriales');
  },

  getById: (id: number | string): Promise<Editorial> =>
    fetchAPI(`/editoriales/${id}`),

  create: (datos: { nombre: string; pais?: string; idEstado?: number }): Promise<Editorial> =>
    fetchAPI('/editoriales', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  update: (id: number | string, datos: Partial<Editorial>): Promise<Editorial> =>
    fetchAPI(`/editoriales/${id}`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  delete: (id: number | string): Promise<Editorial> =>
    fetchAPI(`/editoriales/${id}`, {
      authenticated: true,
      method: 'DELETE',
    }),
};
