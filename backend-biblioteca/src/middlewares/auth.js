import env from '../config/env.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Obtiene la configuración de Supabase desde el entorno.
 */
const getSupabaseConfig = () => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return null;
  }
  return { url: env.SUPABASE_URL.replace(/\/$/, ''), anonKey: env.SUPABASE_ANON_KEY };
};

/**
 * Valida el token con Supabase y busca el perfil del usuario en la base de datos.
 *
 * @param {string} token - Token JWT de Supabase Auth
 * @returns {Promise<object|null>} Información del usuario o null si no es válido
 */
const resolverUsuario = async (token) => {
  const config = getSupabaseConfig();
  if (!config || !token) return null;

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: config.anonKey,
    },
    signal: AbortSignal.timeout(5000),
  });

  // Solo un rechazo explícito del token es una sesión inválida; otros fallos son del servicio de autenticación
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Supabase Auth respondió ${response.status}`);

  const authUser = await response.json();
  if (!authUser?.id) return null;

  // Consultar rol y estado en la base de datos de la biblioteca
  const dbUserRes = await query(
    `SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.id_estado_usuario, e.codigo_estado, 
            u.nombrecompleto_usuario, u.correo_usuario, u.documento_usuario, u.telefono_usuario
     FROM public.usuarios u
     JOIN public.roles r ON u.id_rol = r.id_rol
     JOIN public.estados e ON u.id_estado_usuario = e.id_estado
     WHERE u.id_usuario = $1;`,
    [authUser.id]
  );

  let perfil = dbUserRes.rows[0];

  // Si el usuario existe en auth.users pero no tiene registro en public.usuarios, crearlo con rol Lector
  if (!perfil) {
    try {
      const nombre = authUser.user_metadata?.nombre_completo || 
                     authUser.user_metadata?.full_name || 
                     authUser.email?.split('@')[0] || 'Usuario';
      
      const insertRes = await query(
        `INSERT INTO public.usuarios (id_usuario, id_rol, id_estado_usuario, entidad_estado_usuario, nombrecompleto_usuario, correo_usuario)
         VALUES (
           $1, 
           (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Lector' LIMIT 1),
           (SELECT id_estado FROM public.estados WHERE entidad_estado = 'usuario' AND codigo_estado = 'ACTIVO' LIMIT 1),
           'usuario',
           $2,
           $3
         )
         ON CONFLICT (id_usuario) DO NOTHING
         RETURNING id_usuario;`,
        [authUser.id, nombre, authUser.email]
      );

      if (insertRes.rows.length > 0) {
        const nuevoRes = await query(
          `SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.id_estado_usuario, e.codigo_estado, 
                  u.nombrecompleto_usuario, u.correo_usuario, u.documento_usuario, u.telefono_usuario
           FROM public.usuarios u
           JOIN public.roles r ON u.id_rol = r.id_rol
           JOIN public.estados e ON u.id_estado_usuario = e.id_estado
           WHERE u.id_usuario = $1;`,
          [authUser.id]
        );
        perfil = nuevoRes.rows[0];
      }
    } catch (syncErr) {
      logger.warn('No se pudo auto-sincronizar el perfil del usuario:', syncErr.message);
    }
  }

  return {
    id: authUser.id,
    email: authUser.email,
    id_rol: perfil?.id_rol || 3,
    rol: perfil?.nombre_rol || 'Lector',
    estado: perfil?.codigo_estado || 'ACTIVO',
    nombre: perfil?.nombrecompleto_usuario || authUser.email,
    documento: perfil?.documento_usuario || null,
    telefono: perfil?.telefono_usuario || null,
  };
};

/**
 * Middleware obligatorio de autenticación con Supabase.
 */
export const authenticateSupabase = async (req, res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      error: { message: 'Autenticación requerida. Token no proporcionado.' },
    });
  }

  try {
    const usuario = await resolverUsuario(match[1]);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: { message: 'Sesión inválida o expirada.' },
      });
    }

    if (usuario.estado === 'SUSPENDIDO' || usuario.estado === 'INACTIVO') {
      return res.status(403).json({
        success: false,
        error: { message: `Tu cuenta se encuentra ${usuario.estado.toLowerCase()}. Contacta a la administración.` },
      });
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    logger.error('Error durante autenticación de Supabase:', error.message || error);
    return res.status(503).json({
      success: false,
      error: { message: 'No se pudo verificar la sesión por un problema temporal. Inténtalo de nuevo.' },
    });
  }
};

/**
 * Middleware para restringir el acceso según roles.
 *
 * @param {...string} rolesPermitidos - Roles autorizados (ej: 'Administrador', 'Bibliotecario')
 */
export const requireRole = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      error: { message: 'Debes iniciar sesión para acceder a este recurso.' },
    });
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({
      success: false,
      error: { message: 'No tienes los permisos requeridos para realizar esta acción.' },
    });
  }

  return next();
};
