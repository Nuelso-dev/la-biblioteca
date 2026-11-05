import * as notificacionesRepo from '../repositories/notificaciones.repository.js';

export const obtenerMisNotificaciones = async (idUsuario, filtros) => {
  return await notificacionesRepo.findByUsuario(idUsuario, filtros);
};

export const listarMisNotificaciones = async (idUsuario, filtros) => {
  const [datos, total] = await Promise.all([
    notificacionesRepo.findByUsuario(idUsuario, filtros),
    notificacionesRepo.contarPorUsuario(idUsuario),
  ]);
  return { datos, total };
};

export const marcarComoLeida = async (idNotificacion, idUsuario) => {
  const notificacion = await notificacionesRepo.findById(idNotificacion);
  if (!notificacion) {
    const error = new Error('Notificación no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  if (notificacion.id_usuario !== idUsuario) {
    const error = new Error('No tienes permiso para modificar esta notificación.');
    error.statusCode = 403;
    throw error;
  }
  return await notificacionesRepo.marcarLeida(idNotificacion, idUsuario);
};

export const marcarTodasComoLeidas = async (idUsuario) => {
  const total = await notificacionesRepo.marcarTodasLeidas(idUsuario);
  return { totalActualizadas: total };
};

export const eliminarNotificacion = async (idNotificacion, idUsuario) => {
  const notificacion = await notificacionesRepo.findById(idNotificacion);
  if (!notificacion) {
    const error = new Error('Notificación no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  if (notificacion.id_usuario !== idUsuario) {
    const error = new Error('No tienes permiso para eliminar esta notificación.');
    error.statusCode = 403;
    throw error;
  }
  return await notificacionesRepo.remove(idNotificacion, idUsuario);
};

/**
 * Crea una notificación para un usuario. Un fallo aquí nunca debe bloquear la operación que la origina.
 */
export const notificar = async ({ idUsuario, titulo, mensaje, tipo }) => {
  try {
    return await notificacionesRepo.create({ idUsuario, titulo, mensaje, tipo });
  } catch {
    return null;
  }
};

export const contarNoLeidas = async (idUsuario) => {
  const total = await notificacionesRepo.contarNoLeidas(idUsuario);
  return { total };
};
