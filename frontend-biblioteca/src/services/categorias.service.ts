import { fetchAPI } from './api-client';

export interface CategoriaLibro {
  id_categorias_libros: number;
  id_estado_categlib?: number;
  entidad_estado_categlib?: string;
  nombre_categlib: string;
  descripcion_categlib?: string | null;
  nombre_estado?: string;
  codigo_estado?: string;
}

export const categoriasService = {
  getAll: (filtros?: { idEstado?: number | string; busqueda?: string }): Promise<CategoriaLibro[]> => {
    const qs = new URLSearchParams();
    if (filtros?.idEstado) qs.set('idEstado', String(filtros.idEstado));
    if (filtros?.busqueda) qs.set('busqueda', filtros.busqueda);
    const query = qs.toString();
    return fetchAPI(query ? `/categorias?${query}` : '/categorias');
  },

  getById: (id: number | string): Promise<CategoriaLibro> =>
    fetchAPI(`/categorias/${id}`),

  create: (datos: { nombre: string; descripcion?: string; idEstado?: number }): Promise<CategoriaLibro> =>
    fetchAPI('/categorias', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  update: (id: number | string, datos: Partial<CategoriaLibro>): Promise<CategoriaLibro> =>
    fetchAPI(`/categorias/${id}`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  delete: (id: number | string): Promise<CategoriaLibro> =>
    fetchAPI(`/categorias/${id}`, {
      authenticated: true,
      method: 'DELETE',
    }),
};
