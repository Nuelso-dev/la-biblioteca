import { armarQuery, fetchAPI, fetchPagina, type PaginaAPI } from './api-client';

export interface Favorito {
  id_favorito: number;
  id_libro: number;
  fechacreacion_favorito: string;
  titulo_libro: string;
  portada_libro?: string | null;
  categoria?: string | null;
  autor?: string | null;
  ejemplares_disponibles?: number;
}

export const favoritosService = {
  /** Una página de los libros favoritos, con su ficha resumida */
  getPagina: (filtros: { page?: number; limit?: number } = {}): Promise<PaginaAPI<Favorito>> =>
    fetchPagina<Favorito>(`/favoritos${armarQuery(filtros)}`, { authenticated: true }),

  /** Solo los ids de los libros favoritos, para marcarlos en el catálogo */
  getIds: (): Promise<number[]> => fetchAPI('/favoritos/ids', { authenticated: true }),

  agregar: (idLibro: number | string): Promise<unknown> =>
    fetchAPI('/favoritos', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify({ idLibro: Number(idLibro) }),
    }),

  quitar: (idLibro: number | string): Promise<unknown> =>
    fetchAPI(`/favoritos/${idLibro}`, { authenticated: true, method: 'DELETE' }),
};
