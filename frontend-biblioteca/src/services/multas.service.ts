import { armarQuery, fetchAPI, fetchAllPages, fetchPagina, type PaginaAPI } from './api-client';

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Multas
// ────────────────────────────────────────────────────────────

export interface Multa {
  id_multa: number | string;
  id_prestamo?: number | string;
  id_usuario?: string;

  /** Nombre completo del usuario (JOIN con Usuarios) */
  nombrecompleto_usuario?: string;
  correo_usuario?: string;

  /** Título del libro (JOIN vía Ejemplares → Libros) */
  titulo_libro?: string;
  codinterno_ejemplar?: string;

  /** Estado de la multa ('PENDIENTE' | 'PAGADA' | 'CANCELADA') */
  id_estado_multa?: number | string;
  codigo_estado?: string;
  nombre_estado?: string;

  /** Campos propios de Multas */
  motivo_multa?: string;
  diasretraso_multa?: number;
  valor_multa?: number;
  fechageneracion_multa?: string;
  fechapago_multa?: string;
  observaciones_multa?: string;
}

export interface FiltrosMultas {
  idUsuario?: string;
  /** Código del estado: PENDIENTE, PAGADA o CANCELADA */
  estado?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

export interface ResumenMultas {
  pendientes: number;
  saldoPendiente: number;
}

export const multasService = {
  /** Una página de multas (Administrador/Bibliotecario), filtrada y paginada en el servidor */
  getPagina: (filtros: FiltrosMultas = {}): Promise<PaginaAPI<Multa>> =>
    fetchPagina<Multa>(`/multas${armarQuery({ ...filtros })}`, { authenticated: true }),

  /** Cantidad y saldo de multas pendientes (todas para el personal, solo las propias para el lector) */
  getResumen: (): Promise<ResumenMultas> => fetchAPI('/multas/resumen', { authenticated: true }),

  /** Multas del usuario autenticado */
  getMias: (): Promise<Multa[]> => fetchAllPages<Multa>('/multas/mis-multas', { authenticated: true }),

  getByUsuario: (idUsuario: string): Promise<Multa[]> =>
    fetchAPI(`/multas/usuario/${idUsuario}`, { authenticated: true }).then((arr: Multa[]) => (Array.isArray(arr) ? arr : [])),

  registrarPago: (id: number | string, observaciones?: string): Promise<Multa> =>
    fetchAPI(`/multas/${id}/pagar`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(observaciones ? { observaciones } : {}),
    }),

  /** Cancelar/exonerar una multa (solo Administrador) */
  cancelar: (id: number | string, motivo?: string): Promise<Multa> =>
    fetchAPI(`/multas/${id}/cancelar`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(motivo ? { motivo } : {}),
    }),
};
