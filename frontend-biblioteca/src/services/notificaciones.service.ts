import { armarQuery, fetchAPI, fetchPagina, type PaginaAPI } from './api-client';

export interface Notificacion {
  id_notificacion: number;
  titulo_notificacion: string;
  mensaje_notificacion?: string | null;
  tipo_notificacion?: string | null;
  fechacreacion_notificacion: string;
  codigo_estado?: string;
  nombre_estado?: string;
}

export const notificacionesService = {
  contarNoLeidas: (): Promise<number> =>
    fetchAPI<{ total: number }>('/notificaciones/no-leidas', { authenticated: true }).then((r) => r?.total ?? 0),

  /** Una página de las notificaciones del usuario autenticado */
  getPagina: (filtros: { page?: number; limit?: number } = {}): Promise<PaginaAPI<Notificacion>> =>
    fetchPagina<Notificacion>(`/notificaciones${armarQuery(filtros)}`, { authenticated: true }),

  marcarLeida: (id: number | string): Promise<Notificacion> =>
    fetchAPI(`/notificaciones/${id}/leer`, { authenticated: true, method: 'PUT' }),

  marcarTodasLeidas: (): Promise<unknown> =>
    fetchAPI('/notificaciones/leer-todas', { authenticated: true, method: 'PUT' }),

  eliminar: (id: number | string): Promise<unknown> =>
    fetchAPI(`/notificaciones/${id}`, { authenticated: true, method: 'DELETE' }),
};
