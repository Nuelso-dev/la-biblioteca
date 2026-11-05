/**
 * Crea un limitador de solicitudes por IP con ventana fija.
 *
 * @param {object} opciones - Configuración del limitador
 * @param {number} opciones.ventanaMs - Duración de la ventana en milisegundos
 * @param {number} opciones.max - Solicitudes permitidas por IP dentro de la ventana
 * @param {string} opciones.mensaje - Mensaje devuelto al exceder el límite
 * @returns {import('express').RequestHandler} Middleware de Express
 */
export const crearLimitador = ({ ventanaMs, max, mensaje }) => {
  const solicitudesPorIp = new Map();

  // Evita que el mapa crezca indefinidamente con IPs que ya no consultan
  setInterval(() => {
    const ahora = Date.now();
    for (const [ip, { inicio }] of solicitudesPorIp) {
      if (ahora - inicio >= ventanaMs) solicitudesPorIp.delete(ip);
    }
  }, ventanaMs).unref();

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'desconocida';
    const actual = solicitudesPorIp.get(ip);

    if (!actual || ahora - actual.inicio >= ventanaMs) {
      solicitudesPorIp.set(ip, { inicio: ahora, cantidad: 1 });
      return next();
    }

    actual.cantidad += 1;
    if (actual.cantidad > max) {
      res.setHeader('Retry-After', Math.ceil((ventanaMs - (ahora - actual.inicio)) / 1000));
      return res.status(429).json({ success: false, error: { message: mensaje } });
    }

    return next();
  };
};

/** Límite general de la API: 120 solicitudes por minuto y por IP. */
export const limitarSolicitudes = crearLimitador({
  ventanaMs: 60 * 1000,
  max: 120,
  mensaje: 'Demasiadas solicitudes. Inténtalo de nuevo en un momento.',
});

/** Límite estricto para rutas sensibles (registro y recuperación de clave): 5 intentos cada 15 minutos por IP. */
export const limitarAutenticacion = crearLimitador({
  ventanaMs: 15 * 60 * 1000,
  max: 5,
  mensaje: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
});
