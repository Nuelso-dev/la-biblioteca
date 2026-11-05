import { armarQuery, fetchAPI, fetchAllPages, fetchPagina, type PaginaAPI } from './api-client';

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Solicitudes
// ────────────────────────────────────────────────────────────

export interface Solicitud {
  id_solicitud: number | string;

  /** FK a Usuarios */
  id_usuario?: string;
  nombrecompleto_usuario?: string;
  correo_usuario?: string;

  /** FK a Ejemplares */
  id_ejemplar?: number | string;
  codinterno_ejemplar?: string;

  /** Datos del Libro (JOIN Ejemplares → Libros) */
  titulo_libro?: string;
  isbn_libro?: string;
  portada_libro?: string;

  /** Datos de sede (JOIN Ubicaciones → Bibliotecas) */
  nombre_biblioteca?: string;

  /** Estado de la solicitud (JOIN Estados) */
  id_estado_solicitud?: number | string;
  codigo_estado?: string;
  nombre_estado?: string;

  /** Fechas */
  fechasolicitud_solicitud?: string;
  fecharespuesta_solicitud?: string | null;

  observaciones_solicitud?: string | null;
  atendidopor_solicitud?: string | null;
  atendido_por_nombre?: string | null;
  id_libro?: number | string;
}

export interface FiltrosSolicitudes {
  idUsuario?: string;
  idEstado?: number | string;
  /** porAtender: pendientes y aprobadas sin retirar · historial: el resto */
  vista?: 'porAtender' | 'historial';
  busqueda?: string;
  page?: number;
  limit?: number;
}

export const solicitudesService = {
  /** Una página de solicitudes (Administrador/Bibliotecario), filtrada y paginada en el servidor */
  getPagina: (filtros: FiltrosSolicitudes = {}): Promise<PaginaAPI<Solicitud>> =>
    fetchPagina<Solicitud>(`/solicitudes${armarQuery({ ...filtros })}`, { authenticated: true }),

  /** Solicitudes del usuario autenticado */
  getMias: (): Promise<Solicitud[]> =>
    fetchAllPages<Solicitud>('/solicitudes/mis-solicitudes', { authenticated: true }),

  /** Crear una solicitud de préstamo para un ejemplar */
  crear: (data: { id_ejemplar: number | string; observaciones?: string }): Promise<Solicitud> =>
    fetchAPI('/solicitudes', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify({
        idEjemplar: Number(data.id_ejemplar),
        ...(data.observaciones ? { observaciones: data.observaciones } : {}),
      }),
    }),

  /** Aprobar o rechazar una solicitud (Administrador/Bibliotecario) */
  responder: (id: number | string, accion: 'APROBAR' | 'RECHAZAR', observaciones?: string): Promise<Solicitud> =>
    fetchAPI(`/solicitudes/${id}/responder`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify({ accion, ...(observaciones ? { observaciones } : {}) }),
    }),

  aprobar: (id: number | string, observaciones?: string): Promise<Solicitud> =>
    solicitudesService.responder(id, 'APROBAR', observaciones),

  rechazar: (id: number | string, observaciones?: string): Promise<Solicitud> =>
    solicitudesService.responder(id, 'RECHAZAR', observaciones),

  /** Cancelar una solicitud propia pendiente */
  cancelar: (id: number | string): Promise<Solicitud> =>
    fetchAPI(`/solicitudes/${id}/cancelar`, {
      authenticated: true,
      method: 'DELETE',
    }),
};
