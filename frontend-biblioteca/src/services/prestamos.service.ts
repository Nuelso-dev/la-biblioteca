import { armarQuery, fetchAPI, fetchAllPages, fetchPagina, type PaginaAPI } from './api-client';

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Prestamos
// ────────────────────────────────────────────────────────────

export interface Prestamo {
  id_prestamo: number | string;
  id_solicitud?: number | string;

  /** FK a Usuarios */
  id_usuario?: string;
  nombrecompleto_usuario?: string;
  correo_usuario?: string;

  /** FK a Ejemplares */
  id_ejemplar?: number | string;
  codinterno_ejemplar?: string;

  /** Datos del Libro (JOIN Ejemplares → Libros) */
  id_libro?: number | string;
  titulo_libro?: string;
  isbn_libro?: string;
  portada_libro?: string;

  /** Sede (JOIN Ubicaciones → Bibliotecas) */
  nombre_biblioteca?: string;

  /** Estado del préstamo (JOIN Estados) */
  id_estado_prestamo?: number | string;
  codigo_estado?: string;
  nombre_estado?: string;

  /** Fechas canónicas */
  fechaprestamo_prestamo?: string;
  fechavencimiento_prestamo?: string;
  fechadevolucion_prestamo?: string;

  observaciones_prestamo?: string;
  registradopor_prestamo?: string;
}

export interface FiltrosPrestamos {
  idUsuario?: string;
  idEstado?: number | string;
  /** Solo préstamos activos y vencidos */
  abiertos?: boolean;
  busqueda?: string;
  page?: number;
  limit?: number;
}

export const prestamosService = {
  /** Una página de préstamos (Administrador/Bibliotecario), filtrada y paginada en el servidor */
  getPagina: (filtros: FiltrosPrestamos = {}): Promise<PaginaAPI<Prestamo>> =>
    fetchPagina<Prestamo>(`/prestamos${armarQuery({ ...filtros })}`, { authenticated: true }),

  /** Préstamos del usuario autenticado */
  getMios: (): Promise<Prestamo[]> =>
    fetchAllPages<Prestamo>('/prestamos/mis-prestamos', { authenticated: true }),

  /** Registra un préstamo (Administrador/Bibliotecario), opcionalmente ligado a una solicitud aprobada */
  crear: (data: {
    id_usuario: string;
    id_ejemplar: number | string;
    id_solicitud?: number | string | null;
    observaciones?: string;
    fecha_vencimiento?: string;
  }): Promise<Prestamo> =>
    fetchAPI('/prestamos', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify({
        idUsuario: data.id_usuario,
        idEjemplar: Number(data.id_ejemplar),
        ...(data.id_solicitud ? { idSolicitud: Number(data.id_solicitud) } : {}),
        ...(data.observaciones ? { observaciones: data.observaciones } : {}),
        ...(data.fecha_vencimiento ? { fechaVencimiento: data.fecha_vencimiento } : {}),
      }),
    }),

  /** Registra la devolución (Administrador/Bibliotecario). Puede generar una multa. */
  devolver: (id: number | string, observaciones?: string): Promise<{ multa?: { valor_multa?: number } | null } & Record<string, unknown>> =>
    fetchAPI(`/prestamos/${id}/devolucion`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(observaciones ? { observaciones } : {}),
    }),

  /** Renueva un préstamo activo (el dueño o el personal) */
  renovar: (id: number | string, dias = 7): Promise<Prestamo> =>
    fetchAPI(`/prestamos/${id}/renovar`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify({ dias }),
    }),
};
