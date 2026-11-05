import { SUPABASE_URL } from "@/lib/supabase";

/**
 * Obtiene la URL exacta de la portada del libro proveniente de la base de datos o Supabase Storage.
 * Retorna null si el libro no posee imagen registrada.
 */
export function obtenerImagenPortada(libro?: {
  portada_libro?: string | null;
  portada?: string | null;
  imagenPortada?: string | null;
} | null): string | null {
  if (!libro) return null;
  const p = libro.portada_libro ?? libro.portada ?? libro.imagenPortada;

  if (!p || typeof p !== "string" || p.trim() === "") {
    return null;
  }

  const portadaTrim = p.trim();

  // Si ya es una URL HTTP/HTTPS completa
  if (portadaTrim.startsWith("http://") || portadaTrim.startsWith("https://")) {
    return portadaTrim;
  }

  const baseUrl = (SUPABASE_URL || "").replace(/\/$/, "");

  // Si la ruta ya incluye el path de storage
  if (portadaTrim.startsWith("/storage/") || portadaTrim.startsWith("storage/")) {
    const cleanPath = portadaTrim.startsWith("/") ? portadaTrim : `/${portadaTrim}`;
    return `${baseUrl}${cleanPath}`;
  }

  // Si ya viene con el nombre del bucket (ej: covers/xxx.jpg o portadas/xxx.jpg)
  const cleanPath = portadaTrim.replace(/^\/+/, "");
  if (cleanPath.startsWith("covers/") || cleanPath.startsWith("portadas/")) {
    return `${baseUrl}/storage/v1/object/public/${cleanPath}`;
  }

  // Construir la URL del bucket público 'covers' en Supabase Storage
  return `${baseUrl}/storage/v1/object/public/covers/${cleanPath}`;
}

/** Convierte un título en un fragmento de URL: minúsculas, sin acentos, con guiones. */
export function slugDeTitulo(titulo?: string | null): string {
  return (titulo ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** URL de la ficha de un libro: /libros/detalle/7-cien-anos-de-soledad (el id va primero y es lo que usa el backend). */
export function urlDetalleLibro(id: number | string, titulo?: string | null): string {
  const slug = slugDeTitulo(titulo);
  return `/libros/detalle/${id}${slug ? `-${slug}` : ""}`;
}

/** Extrae el id numérico de un parámetro de ruta como "7-cien-anos-de-soledad" o "7". Devuelve null si no es válido. */
export function idDesdeParametroLibro(parametro?: string | null): string | null {
  const coincidencia = /^(\d+)(?:-|$)/.exec(parametro ?? "");
  return coincidencia && Number(coincidencia[1]) > 0 ? String(Number(coincidencia[1])) : null;
}

/** Etiqueta de disponibilidad de un libro según sus ejemplares (Disponible, En préstamo o Sin ejemplares). */
export function estadoDisponibilidad(libro: { ejemplares_disponibles?: number | null; total_ejemplares?: number | null }): string {
  if (Number(libro.ejemplares_disponibles ?? 0) > 0) return "Disponible";
  return Number(libro.total_ejemplares ?? 0) > 0 ? "En préstamo" : "No disponible";
}

/**
 * El backend entrega las sedes de un libro unidas por ", ". Devuelve la primera y cuántas más hay,
 * por ejemplo "Biblioteca Piloto +3 sedes".
 */
export function resumenSedes(sedes?: string | null): string | null {
  const lista = (sedes ?? "").split(", ").map((s) => s.trim()).filter(Boolean);
  if (lista.length === 0) return null;
  if (lista.length === 1) return lista[0];
  const otras = lista.length - 1;
  return `${lista[0]} +${otras} ${otras === 1 ? "sede" : "sedes"}`;
}
