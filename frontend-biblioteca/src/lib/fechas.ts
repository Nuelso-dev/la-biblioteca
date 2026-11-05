/**
 * Zona horaria de la biblioteca. Colombia no aplica horario de verano, por lo que el desfase es fijo (UTC-5).
 * El backend usa la misma zona (src/utils/fechas.js): las fechas se ven igual en cualquier navegador
 * y coinciden con los vencimientos que calcula el servidor.
 */
export const ZONA_HORARIA = "America/Bogota";
const DESFASE = "-05:00";

const valida = (valor?: string | Date | null): Date | null => {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/** Fecha y hora (momentos como préstamos o auditoría) en la zona de la biblioteca. */
export function formatearFecha(valor?: string | Date | null, vacio = "—"): string {
  const fecha = valida(valor);
  return fecha ? fecha.toLocaleDateString("es-CO", { timeZone: ZONA_HORARIA }) : vacio;
}

export function formatearFechaHora(valor?: string | Date | null, vacio = "—"): string {
  const fecha = valida(valor);
  return fecha ? fecha.toLocaleString("es-CO", { timeZone: ZONA_HORARIA }) : vacio;
}

/** Fecha corta con mes abreviado (ej. "23 sept 2026"). */
export function formatearFechaCorta(valor?: string | Date | null, vacio = "—"): string {
  const fecha = valida(valor);
  return fecha ? fecha.toLocaleDateString("es-CO", { timeZone: ZONA_HORARIA, day: "2-digit", month: "short", year: "numeric" }) : vacio;
}

/** Columnas de solo fecha (adquisición, nacimiento): son un día de calendario, no un instante, por eso se leen en UTC. */
export function formatearDiaCalendario(valor?: string | Date | null, opciones?: Intl.DateTimeFormatOptions, vacio = "—"): string {
  const fecha = valida(valor);
  return fecha ? fecha.toLocaleDateString("es-CO", { timeZone: "UTC", ...opciones }) : vacio;
}

/** Hoy como YYYY-MM-DD en la zona de la biblioteca (para el atributo min de los campos de fecha). */
export function hoyISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

/** Convierte un día YYYY-MM-DD en el último instante de ese día (23:59:59) en la zona de la biblioteca. */
export function finDelDiaISO(dia: string): string {
  return new Date(`${dia}T23:59:59${DESFASE}`).toISOString();
}
