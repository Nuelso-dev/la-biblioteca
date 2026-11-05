import { armarQuery, fetchPagina, type PaginaAPI } from './api-client';

export interface Auditoria {
  id_auditoria: number;
  id_usuario: string;
  nombrecompleto_usuario?: string;
  correo_usuario?: string;
  idregistro_auditoria?: number | null;
  accion_auditoria: string;
  tablaafectada_auditoria: string;
  datosanteriores_auditoria?: unknown;
  datosnuevos_auditoria?: unknown;
  fecha_auditoria: string;
  direccionip_auditoria?: string | null;
}

export interface FiltrosAuditorias {
  tabla?: string;
  idUsuario?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

export const auditoriasService = {
  getPagina: (filtros: FiltrosAuditorias = {}): Promise<PaginaAPI<Auditoria>> =>
    fetchPagina<Auditoria>(`/auditorias${armarQuery({ ...filtros })}`, { authenticated: true }),
};
