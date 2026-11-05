import * as solicitudesService from '../services/solicitudes.service.js';
import { metaPaginacion } from '../utils/paginacion.js';

export const getMisSolicitudes = async (req, res, next) => {
  try {
    const { idEstado } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await solicitudesService.listarSolicitudes({
      idUsuario: req.usuario.id,
      idEstado: idEstado ? Number(idEstado) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};

export const getSolicitudes = async (req, res, next) => {
  try {
    const { idUsuario, idEstado, vista, busqueda } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await solicitudesService.listarSolicitudes({
      idUsuario,
      idEstado: idEstado ? Number(idEstado) : undefined,
      vista: vista === 'porAtender' || vista === 'historial' ? vista : undefined,
      busqueda: typeof busqueda === 'string' ? busqueda.trim().slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};

export const getSolicitudById = async (req, res, next) => {
  try {
    const solicitud = await solicitudesService.obtenerSolicitudPorId(req.params.id);
    if (req.usuario.rol === 'Lector' && solicitud.id_usuario !== req.usuario.id) {
      return res.status(403).json({ success: false, error: { message: 'No tienes permiso para ver esta solicitud.' } });
    }
    res.json({ success: true, data: solicitud });
  } catch (error) {
    next(error);
  }
};

export const createSolicitud = async (req, res, next) => {
  try {
    const { idEjemplar, observaciones } = req.body;
    const nueva = await solicitudesService.crearSolicitud({ idEjemplar, observaciones }, req.usuario);
    res.status(201).json({ success: true, data: nueva, message: 'Solicitud creada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const cancelarSolicitud = async (req, res, next) => {
  try {
    const cancelada = await solicitudesService.cancelarSolicitud(req.params.id, req.usuario);
    res.json({ success: true, data: cancelada, message: 'Solicitud cancelada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const responderSolicitud = async (req, res, next) => {
  try {
    const { accion, observaciones } = req.body;
    const respondida = await solicitudesService.responderSolicitud(req.params.id, { accion, observaciones }, req.usuario);
    res.json({ success: true, data: respondida, message: `Solicitud ${accion.toLowerCase()} exitosamente.` });
  } catch (error) {
    next(error);
  }
};
