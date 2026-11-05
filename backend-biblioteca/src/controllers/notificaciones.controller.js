import * as notificacionesService from '../services/notificaciones.service.js';
import { metaPaginacion } from '../utils/paginacion.js';

export const getMisNotificaciones = async (req, res, next) => {
  try {
    const { limit, offset } = req.pagination;
    const { datos, total } = await notificacionesService.listarMisNotificaciones(req.usuario.id, { limit, offset });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};

export const marcarLeida = async (req, res, next) => {
  try {
    const actualizada = await notificacionesService.marcarComoLeida(req.params.id, req.usuario.id);
    res.json({ success: true, data: actualizada, message: 'Notificación marcada como leída.' });
  } catch (error) {
    next(error);
  }
};

export const marcarTodasLeidas = async (req, res, next) => {
  try {
    const resultado = await notificacionesService.marcarTodasComoLeidas(req.usuario.id);
    res.json({ success: true, data: resultado, message: 'Todas las notificaciones fueron marcadas como leídas.' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotificacion = async (req, res, next) => {
  try {
    const eliminada = await notificacionesService.eliminarNotificacion(req.params.id, req.usuario.id);
    res.json({ success: true, data: eliminada, message: 'Notificación eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const getNoLeidas = async (req, res, next) => {
  try {
    const resultado = await notificacionesService.contarNoLeidas(req.usuario.id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
};
