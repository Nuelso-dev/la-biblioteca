import { supabase } from '@/lib/supabase';
import { ENV } from '@/config/env';

export interface FetchOptions extends RequestInit {
  authenticated?: boolean;
}


/** Devuelve un token vigente: renueva la sesión si el actual ya venció o está por vencer. */
async function obtenerToken(forzarRenovacion = false): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return undefined;
  const venceEn = (session.expires_at ?? 0) * 1000 - Date.now();
  if (forzarRenovacion || venceEn < 60_000) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) return data.session.access_token;
  }
  return session.access_token;
}

/**
 * Realiza peticiones HTTP al backend de Express administrando el formato Envelope Pattern.
 * En peticiones autenticadas, ante un 401 renueva el token y reintenta una vez antes de dar la sesión por expirada.
 */
async function solicitar(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const baseUrl = ENV.API_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const url = `${baseUrl}${cleanEndpoint}`;
  const { authenticated = false, ...requestOptions } = options;

  const enviar = async (forzarRenovacion: boolean) => {
    const accessToken = authenticated ? await obtenerToken(forzarRenovacion) : undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(requestOptions.headers as Record<string, string> || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    return fetch(url, { ...requestOptions, headers });
  };

  try {
    let response = await enviar(false);
    if (response.status === 401 && authenticated) {
      response = await enviar(true);
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
      }
      throw new Error(result?.error?.message || `Error en el servidor (${response.status})`);
    }

    return result;
  } catch (err: unknown) {
    console.error(`[fetchAPI] Error al conectar con ${url}:`, err);
    if (err instanceof Error && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      throw new Error(`No se pudo establecer conexión con el backend en ${url}. Verifica que el servidor esté en ejecución.`);
    }
    throw err;
  }
}

export async function fetchAPI<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const result = await solicitar(endpoint, options);
  return result?.data;
}

export interface PaginaAPI<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

/** Arma un query string omitiendo los valores vacíos. */
export function armarQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '' && valor !== false) qs.set(clave, String(valor));
  });
  const texto = qs.toString();
  return texto ? `?${texto}` : '';
}

/** Igual que fetchAPI pero conserva los metadatos de paginación que envía el backend. */
export async function fetchPagina<T = any>(endpoint: string, options: FetchOptions = {}): Promise<PaginaAPI<T>> {
  const result = await solicitar(endpoint, options);
  const data: T[] = Array.isArray(result?.data) ? result.data : [];
  return {
    data,
    total: Number(result?.total ?? data.length),
    totalPages: Number(result?.totalPages ?? 1),
    page: Number(result?.page ?? 1),
    limit: Number(result?.limit ?? data.length),
  };
}

/**
 * Recorre todas las páginas de un endpoint paginado del backend (limit máx. 100)
 * y devuelve la lista completa concatenada.
 */
export async function fetchAllPages<T = any>(
  endpoint: string,
  options: FetchOptions = {},
  pageSize = 100,
  maxPages = 50,
): Promise<T[]> {
  const separador = endpoint.includes('?') ? '&' : '?';
  const acumulado: T[] = [];

  for (let pagina = 1; pagina <= maxPages; pagina++) {
    const bloque = await fetchAPI<T[]>(`${endpoint}${separador}limit=${pageSize}&page=${pagina}`, options);
    if (!Array.isArray(bloque)) break;
    acumulado.push(...bloque);
    if (bloque.length < pageSize) break;
  }

  return acumulado;
}
