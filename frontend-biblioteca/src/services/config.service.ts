import { armarQuery, fetchAPI, fetchAllPages, fetchPagina, type PaginaAPI } from './api-client';

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Configuraciones
// ────────────────────────────────────────────────────────────

export interface Configuracion {
  id_configuracion?: number | string;
  clave_configuracion: string;
  valor_configuracion?: string | null;
  descripcion_configuracion?: string;
}

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Usuarios (perfil)
// ────────────────────────────────────────────────────────────

export interface UsuarioBackend {
  id_usuario: string;
  id_rol?: number;
  nombre_rol?: string;
  id_estado_usuario?: number;
  codigo_estado?: string;
  nombre_estado?: string;
  nombrecompleto_usuario?: string;
  correo_usuario?: string;
  documento_usuario?: string | null;
  telefono_usuario?: string | null;
  fecharegistro_usuario?: string;
  fechaultimaactualizacion_usuario?: string | null;
}

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Estados
// ────────────────────────────────────────────────────────────

export interface Estado {
  id_estado: number | string;
  entidad_estado: string;
  codigo_estado: string;
  nombre_estado: string;
  descripcion_estado?: string;
  activo_estado: boolean;
  orden_estado?: number;
}

// ────────────────────────────────────────────────────────────
// Servicios
// ────────────────────────────────────────────────────────────

export const configService = {
  /** Obtiene todas las configuraciones del sistema (requiere auth) */
  getAll: (): Promise<Configuracion[]> =>
    fetchAPI('/config', { authenticated: true }),

  getByKey: (clave: string): Promise<Configuracion> =>
    fetchAPI(`/config/${clave}`, { authenticated: true }),

  set: (clave: string, valor: string, descripcion?: string): Promise<Configuracion> =>
    fetchAPI(`/config/${clave}`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify({ valor_configuracion: valor, ...(descripcion ? { descripcion_configuracion: descripcion } : {}) }),
    }),
};

/** Reglas del servicio que ve el público (préstamos, plazos y multas), definidas por la biblioteca. */
export interface ReglasServicio {
  maxPrestamos: number;
  diasPrestamo: number;
  diasRetiro: number;
  tarifaMultaDiaria: number;
}

export const configPublicaService = {
  getReglas: (): Promise<ReglasServicio> => fetchAPI('/config/publica'),
};

export const estadosService = {
  getAll: (entidad?: string): Promise<Estado[]> => {
    const url = entidad ? `/estados?entidad=${encodeURIComponent(entidad)}` : '/estados';
    return fetchAPI(url);
  },

  getByEntidad: (entidad: string): Promise<Estado[]> =>
    fetchAPI(`/estados?entidad=${encodeURIComponent(entidad)}`),
};

export interface FiltrosUsuarios {
  idRol?: number | string;
  idEstado?: number | string;
  /** Solo bibliotecarios y administradores */
  personal?: boolean;
  busqueda?: string;
  page?: number;
  limit?: number;
}

export const usuariosService = {
  /** Una página del directorio de usuarios, filtrada y paginada en el servidor */
  getPagina: (filtros: FiltrosUsuarios = {}): Promise<PaginaAPI<UsuarioBackend>> =>
    fetchPagina<UsuarioBackend>(`/usuarios${armarQuery({ ...filtros })}`, { authenticated: true }),

  getById: (id: string): Promise<UsuarioBackend> =>
    fetchAPI(`/usuarios/${id}`, { authenticated: true }),

  /** Perfil del usuario autenticado según la base de datos (incluye rol y estado reales) */
  getMiPerfil: (): Promise<UsuarioBackend> =>
    fetchAPI('/usuarios/me', { authenticated: true }),

  /** Actualiza el perfil propio */
  updateMiPerfil: (datos: { nombre?: string; documento?: string; telefono?: string }): Promise<UsuarioBackend> =>
    fetchAPI('/usuarios/me', {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  /** Cambia rol y/o estado de un usuario (solo Administrador) */
  updateRolEstado: (id: string, datos: { idRol?: number; idEstado?: number }): Promise<UsuarioBackend> =>
    fetchAPI(`/usuarios/${id}/rol-estado`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
};

export interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion_rol?: string | null;
}

export const rolesService = {
  getAll: (): Promise<Rol[]> => fetchAPI('/roles', { authenticated: true }),
};
