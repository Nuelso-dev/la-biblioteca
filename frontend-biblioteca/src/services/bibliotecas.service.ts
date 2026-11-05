import { fetchAPI } from './api-client';

// ────────────────────────────────────────────────────────────
// Tipos alineados con migration_supabase.sql → public.Bibliotecas
// ────────────────────────────────────────────────────────────

export interface Biblioteca {
  id_biblioteca: number | string;

  /** Campos canónicos de la DB */
  nombre_biblioteca?: string;
  direccion_biblioteca?: string;
  telefono_biblioteca?: string;
  descripcion_biblioteca?: string;
  /** Ubicación en el mapa (la base de datos las devuelve como texto numérico) */
  latitud_biblioteca?: number | string | null;
  longitud_biblioteca?: number | string | null;

  /** Estado de la biblioteca (JOIN con Estados) */
  id_estado_biblioteca?: number | string;
  codigo_estado?: string;
  nombre_estado?: string;
  activo_estado?: boolean;
}

export interface BibliotecaPayload {
  nombre: string;
  direccion?: string;
  telefono?: string;
  descripcion?: string;
  latitud?: number | null;
  longitud?: number | null;
  /** En una edición, borra la ubicación guardada en el mapa */
  quitarUbicacion?: boolean;
  idEstado?: number;
}

function construirPayload(d: BibliotecaPayload) {
  return {
    nombre: d.nombre.trim(),
    direccion: d.direccion?.trim() || undefined,
    telefono: d.telefono?.trim() || undefined,
    descripcion: d.descripcion?.trim() || undefined,
    ...(d.latitud != null && d.longitud != null ? { latitud: d.latitud, longitud: d.longitud } : {}),
    ...(d.quitarUbicacion ? { quitarUbicacion: true } : {}),
    ...(d.idEstado ? { idEstado: d.idEstado } : {}),
  };
}

export const bibliotecasService = {
  getAll: (): Promise<Biblioteca[]> =>
    fetchAPI('/bibliotecas').then((arr: Biblioteca[]) => (Array.isArray(arr) ? arr : [])),

  /** Solo sedes en estado ACTIVA (para las páginas públicas) */
  getActivas: (): Promise<Biblioteca[]> =>
    fetchAPI('/bibliotecas?activo=true').then((arr: Biblioteca[]) => (Array.isArray(arr) ? arr : [])),

  getById: (id: number | string): Promise<Biblioteca> =>
    fetchAPI(`/bibliotecas/${id}`),

  create: (data: BibliotecaPayload): Promise<Biblioteca> =>
    fetchAPI('/bibliotecas', {
      authenticated: true,
      method: 'POST',
      body: JSON.stringify(construirPayload(data)),
    }),

  update: (id: number | string, data: BibliotecaPayload): Promise<Biblioteca> =>
    fetchAPI(`/bibliotecas/${id}`, {
      authenticated: true,
      method: 'PUT',
      body: JSON.stringify(construirPayload(data)),
    }),

  delete: (id: number | string): Promise<Biblioteca> =>
    fetchAPI(`/bibliotecas/${id}`, {
      authenticated: true,
      method: 'DELETE',
    }),
};

/** Coordenadas de una sede como números, o null si no tiene ubicación en el mapa. */
export function coordenadasDeSede(b: Pick<Biblioteca, 'latitud_biblioteca' | 'longitud_biblioteca'>): { lat: number; lng: number } | null {
  if (b.latitud_biblioteca == null || b.longitud_biblioteca == null) return null;
  const lat = Number(b.latitud_biblioteca);
  const lng = Number(b.longitud_biblioteca);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}
