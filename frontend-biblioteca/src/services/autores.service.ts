import { fetchAPI, fetchAllPages } from './api-client';

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Autores
// ────────────────────────────────────────────────────────────

export interface Autor {
  id_autor: number | string;

  /** Campo canónico de la DB */
  nombrecompleto_autor?: string;
  biografia_autor?: string;
  fechanacimiento_autor?: string;

  /** Libros del autor (solo en el detalle) */
  libros?: { id_libro: number; titulo: string; portada?: string | null }[];

  /** Cantidad de libros vinculados (JOIN con Libros_Autores) */
  libros_count?: number;
}

export const autoresService = {
  getAll: (busqueda?: string): Promise<Autor[]> => {
    const url = busqueda
      ? `/autores?busqueda=${encodeURIComponent(busqueda)}`
      : '/autores';
    return fetchAllPages<Autor>(url);
  },

  getById: (id: number | string): Promise<Autor> =>
    fetchAPI(`/autores/${id}`),

  create: (datos: string | { nombre?: string; nombrecompleto_autor?: string; biografia?: string; fechaNacimiento?: string }): Promise<Autor> => {
    const payload = typeof datos === 'string'
      ? { nombre: datos }
      : { ...datos, nombre: datos.nombre ?? datos.nombrecompleto_autor };
    return fetchAPI('/autores', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: (
    id: number | string,
    datos: string | { nombre?: string; nombrecompleto_autor?: string; biografia?: string; fechaNacimiento?: string }
  ): Promise<Autor> => {
    const payload = typeof datos === 'string'
      ? { nombre: datos }
      : { ...datos, nombre: datos.nombre ?? datos.nombrecompleto_autor };
    return fetchAPI(`/autores/${id}`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete: (id: number | string): Promise<Autor> =>
    fetchAPI(`/autores/${id}`, {
      authenticated: true,
      method: 'DELETE',
    }),
};
