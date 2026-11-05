import env from '../config/env.js';

/**
 * Reenvía una llamada a la API de autenticación de Supabase (GoTrue) y devuelve su respuesta.
 *
 * @param {string} ruta - Ruta bajo /auth/v1 (ej: 'signup')
 * @param {object} cuerpo - Cuerpo JSON a enviar
 * @param {Record<string, string>} [query] - Parámetros de consulta
 * @returns {Promise<{status: number, data: any}>}
 */
const llamarSupabaseAuth = async (ruta, cuerpo, query = {}) => {
  const qs = new URLSearchParams(query).toString();
  const url = `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/${ruta}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: env.SUPABASE_ANON_KEY },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
};

/** Traduce un error de Supabase Auth a un mensaje claro para el usuario. */
const mensajeDeSupabase = (data, porDefecto) => {
  const texto = String(data?.msg || data?.message || data?.error_description || '').toLowerCase();
  if (texto.includes('already registered') || texto.includes('already exists')) {
    return 'Este correo ya está registrado. Inicia sesión.';
  }
  if (texto.includes('password')) {
    return 'La contraseña no cumple con los requisitos de seguridad.';
  }
  if (texto.includes('rate limit') || texto.includes('too many')) {
    return 'Se enviaron demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.';
  }
  return porDefecto;
};

/**
 * Solicita el correo de recuperación de contraseña. La respuesta es siempre neutra
 * para no revelar si el correo existe.
 */
export const recuperarClave = async (req, res, next) => {
  try {
    const { email, redirectTo } = req.body;
    const { status, data } = await llamarSupabaseAuth('recover', { email }, redirectTo ? { redirect_to: redirectTo } : {});

    if (status === 429) {
      return res.status(429).json({ success: false, error: { message: mensajeDeSupabase(data, 'Demasiadas solicitudes.') } });
    }
    if (status >= 500) {
      return res.status(502).json({ success: false, error: { message: 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo más tarde.' } });
    }

    return res.json({ success: true, data: null });
  } catch (error) {
    return next(error);
  }
};
