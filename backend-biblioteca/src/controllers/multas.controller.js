import * as multasService from '../services/multas.service.js';
import { metaPaginacion } from '../utils/paginacion.js';

export const getMisMultas = async (req, res, next) => {
  try {
    const { idEstado } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await multasService.listarMultas({
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

export const getMultas = async (req, res, next) => {
  try {
    const { idUsuario, idEstado, estado, busqueda } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await multasService.listarMultas({
      idUsuario,
      idEstado: idEstado ? Number(idEstado) : undefined,
      codigoEstado: typeof estado === 'string' && estado ? estado.toUpperCase() : undefined,
      busqueda: typeof busqueda === 'string' ? busqueda.trim().slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};

/** Totales de multas pendientes (cantidad y saldo) sin traer el listado. */
export const getResumenMultas = async (req, res, next) => {
  try {
    const resumen = await multasService.obtenerResumenPendientes(req.usuario.rol === 'Lector' ? req.usuario.id : undefined);
    res.json({ success: true, data: resumen });
  } catch (error) {
    next(error);
  }
};

export const getMultaById = async (req, res, next) => {
  try {
    const multa = await multasService.obtenerMultaPorId(req.params.id);
    if (req.usuario.rol === 'Lector' && multa.id_usuario !== req.usuario.id) {
      return res.status(403).json({ success: false, error: { message: 'No tienes permiso para ver esta multa.' } });
    }
    res.json({ success: true, data: multa });
  } catch (error) {
    next(error);
  }
};

export const pagarMulta = async (req, res, next) => {
  try {
    const { observaciones } = req.body;
    const pagada = await multasService.registrarPagoMulta(req.params.id, observaciones, req.usuario);
    res.json({ success: true, data: pagada, message: 'Pago de multa registrado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const cancelarMulta = async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const cancelada = await multasService.cancelarMulta(req.params.id, motivo, req.usuario);
    res.json({ success: true, data: cancelada, message: 'Multa cancelada o exonerada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const getMultasPendientes = async (req, res, next) => {
  try {
    const { datos } = await multasService.listarMultas({
      idUsuario: req.usuario.rol === 'Lector' ? req.usuario.id : undefined,
      codigoEstado: 'PENDIENTE',
      limit: 100,
      offset: 0,
    });
    res.json({ success: true, data: datos });
  } catch (error) {
    next(error);
  }
};

export const getMultasByUsuario = async (req, res, next) => {
  try {
    const { idUsuario } = req.params;
    if (req.usuario.rol === 'Lector' && req.usuario.id !== idUsuario) {
      return res.status(403).json({ success: false, error: { message: 'No tienes permiso para ver multas de otro usuario.' } });
    }
    const multas = await multasService.obtenerMultas({ idUsuario });
    res.json({ success: true, data: multas });
  } catch (error) {
    next(error);
  }
};
