/**
 * Zona horaria de la biblioteca. Colombia no aplica horario de verano, por lo que el desfase es fijo (UTC-5).
 * El frontend usa la misma zona (src/lib/fechas.ts): así los vencimientos y las fechas mostradas coinciden
 * sin importar dónde corra el servidor o el navegador.
 */
export const ZONA_HORARIA = 'America/Bogota';
const DESFASE = '-05:00';
const MS_DIA = 24 * 60 * 60 * 1000;

/** Fecha (día/mes/año) en la zona de la biblioteca, ej. "23/9/2026". */
export const formatearFecha = (valor) =>
  new Date(valor).toLocaleDateString('es-CO', { timeZone: ZONA_HORARIA });

/** Último instante (23:59:59) del día que queda `dias` días después de hoy, en la zona de la biblioteca. */
export const finDelDia = (dias = 0) => {
  const objetivo = new Date(Date.now() + dias * MS_DIA);
  const ymd = objetivo.toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });
  return new Date(`${ymd}T23:59:59${DESFASE}`);
};

/** Suma `dias` días exactos a una fecha (sin depender de la zona del servidor). */
export const sumarDias = (fecha, dias) => new Date(new Date(fecha).getTime() + dias * MS_DIA);
