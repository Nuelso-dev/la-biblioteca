import { fetchAPI, fetchAllPages, fetchPagina } from './api-client';

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Libros
// ────────────────────────────────────────────────────────────

export interface EjemplarLibro {
  id_ejemplar: number | string;
  id_libro?: number | string;
  id_ubicacion?: number | string;

  /** Código interno del ejemplar físico (ej. "LIB-001") */
  codinterno_ejemplar?: string;

  /** Datos de ubicación (JOINs) */
  id_biblioteca?: number | string;
  nombre_ubicacion?: string;
  nombre_biblioteca?: string;

  /** Estado del ejemplar (JOIN Estados) */
  id_estado_ejemplar?: number | string;
  codigo_estado?: string;
  nombre_estado?: string;
}

export interface Libro {
  id_libro: number | string;

  /** Campos canónicos de la DB */
  isbn_libro?: string | null;
  titulo_libro?: string;
  descripcion_libro?: string | null;
  portada_libro?: string | null;
  numpaginas_libro?: number;
  idioma_libro?: string;
  fechapublicacion_libro?: string;
  fecharegistro_libro?: string;

  /** FKs */
  id_categoria?: number | string;
  id_editorial?: number | string;
  id_estado_libro?: number | string;

  /** Campos agregados (JOINs del backend) */
  categoria?: string | null;
  editorial?: string | null;
  autor?: string | null;
  nombre_biblioteca?: string | null;
  nombre_estado?: string;
  codigo_estado?: string;
  total_ejemplares?: number;
  ejemplares_disponibles?: number;
  ejemplares?: EjemplarLibro[];
  /** Primer ejemplar disponible (calculado por el backend) */
  id_ejemplar?: number | string;
  /** Nombre del estado del libro en el catálogo (Disponible, Descatalogado, Agotado) */
  estado?: string | null;
  autores?: { id_autor: number | string; nombre: string }[];
  disponible?: boolean;
  numpaginas?: number;
}

/** Cuerpo que espera POST/PUT /libros (alineado con public.libros). */
export interface LibroPayload {
  /** Obligatorio */
  titulo: string;
  /** Obligatorio */
  idCategoria: number;
  /** Obligatorio: id de una editorial existente o el nombre de una nueva */
  idEditorial?: number | null;
  editorial?: string | null;
  idEstado?: number | null;
  isbn?: string | null;
  descripcion?: string | null;
  /** Nombre del archivo dentro del bucket público `covers` */
  portada?: string | null;
  numPaginas?: number | null;
  idioma?: string;
  /** Formato YYYY-MM-DD */
  fechaPublicacion?: string | null;
  autoresIds?: number[];
}

export interface PortadaStorage {
  name: string;
  size: string | number | null;
  created_at?: string | null;
  /** Libros que usan esta imagen como portada */
  libros: { id_libro: number; titulo: string }[];
}

export interface PortadaFaltante {
  id_libro: number;
  titulo_libro: string;
  portada_libro: string;
}

export const storageService = {
  /** Imágenes disponibles en el bucket `covers` (Administrador/Bibliotecario) */
  listarPortadas: (busqueda?: string): Promise<PortadaStorage[]> =>
    fetchAPI(busqueda ? `/storage/portadas?busqueda=${encodeURIComponent(busqueda)}` : '/storage/portadas', {
      authenticated: true,
    }),

  /** Libros cuya portada apunta a un archivo que ya no existe en el bucket */
  listarFaltantes: (): Promise<PortadaFaltante[]> =>
    fetchAPI('/storage/portadas/faltantes', { authenticated: true }),
};

export interface FiltrosLibros {
  busqueda?: string;
  idCategoria?: number | string;
  idEditorial?: number | string;
  idAutor?: number | string;
  /** Libros con al menos un ejemplar en esta sede */
  idBiblioteca?: number | string;
  idEstado?: number | string;
  /** Solo libros con al menos un ejemplar disponible */
  disponible?: boolean;
  /** Catálogo público: oculta los libros descatalogados */
  catalogo?: boolean;
}

export interface PaginaLibros {
  libros: Libro[];
  total: number;
  totalPages: number;
  page: number;
}

function armarQuery(filtros: FiltrosLibros, extra: Record<string, string | number> = {}): string {
  const qs = new URLSearchParams();
  if (filtros.busqueda?.trim()) qs.set('busqueda', filtros.busqueda.trim());
  if (filtros.idCategoria) qs.set('idCategoria', String(filtros.idCategoria));
  if (filtros.idEditorial) qs.set('idEditorial', String(filtros.idEditorial));
  if (filtros.idAutor) qs.set('idAutor', String(filtros.idAutor));
  if (filtros.idBiblioteca) qs.set('idBiblioteca', String(filtros.idBiblioteca));
  if (filtros.idEstado) qs.set('idEstado', String(filtros.idEstado));
  if (filtros.disponible) qs.set('disponible', 'true');
  if (filtros.catalogo) qs.set('catalogo', 'true');
  Object.entries(extra).forEach(([k, v]) => qs.set(k, String(v)));
  return qs.toString();
}

export const librosService = {
  /** Una página de libros con el total, paginada y filtrada en el servidor. */
  getPagina: async (filtros: FiltrosLibros & { page?: number; limit?: number } = {}): Promise<PaginaLibros> => {
    const { page = 1, limit = 12, ...resto } = filtros;
    const resp = await fetchPagina<Libro>(`/libros?${armarQuery(resto, { page, limit })}`);
    return { libros: resp.data, total: resp.total, totalPages: resp.totalPages, page: resp.page };
  },

  getAll: (params?: {
    busqueda?: string;
    idCategoria?: number | string;
    idEditorial?: number | string;
    idAutor?: number | string;
    idEstado?: number | string;
    limit?: number;
    offset?: number;
  }): Promise<Libro[]> => {
    const qs = new URLSearchParams();
    if (params?.busqueda) qs.set('busqueda', params.busqueda);
    if (params?.idCategoria) qs.set('idCategoria', String(params.idCategoria));
    if (params?.idEditorial) qs.set('idEditorial', String(params.idEditorial));
    if (params?.idAutor) qs.set('idAutor', String(params.idAutor));
    if (params?.idEstado) qs.set('idEstado', String(params.idEstado));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString();
    const endpoint = query ? `/libros?${query}` : '/libros';
    // Sin límite explícito se recorren todas las páginas del backend
    const cargar = params?.limit ? fetchAPI<Libro[]>(endpoint) : fetchAllPages<Libro>(endpoint);
    return cargar.then((arr) => (Array.isArray(arr) ? arr : []));
  },

  getById: (id: number | string): Promise<Libro> =>
    fetchAPI(`/libros/${id}`),

  create: (libroData: LibroPayload): Promise<Libro> =>
    fetchAPI('/libros', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify(libroData),
    }),

  update: (id: number | string, libroData: Partial<LibroPayload>): Promise<Libro> =>
    fetchAPI(`/libros/${id}`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(libroData),
    }),

  delete: (id: number | string): Promise<Libro> =>
    fetchAPI(`/libros/${id}`, {
      authenticated: true,
      method: 'DELETE',
    }),
};
