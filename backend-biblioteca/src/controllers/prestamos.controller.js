import * as prestamosService from '../services/prestamos.service.js';
import { metaPaginacion } from '../utils/paginacion.js';

export const getMisPrestamos = async (req, res, next) => {
  try {
    const { idEstado } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await prestamosService.listarPrestamos({
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

export const getPrestamos = async (req, res, next) => {
  try {
    const { idUsuario, idEstado, abiertos, busqueda } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await prestamosService.listarPrestamos({
      idUsuario,
      idEstado: idEstado ? Number(idEstado) : undefined,
      abiertos: abiertos === 'true',
      busqueda: typeof busqueda === 'string' ? busqueda.trim().slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};

export const getPrestamoById = async (req, res, next) => {
  try {
    const prestamo = await prestamosService.obtenerPrestamoPorId(req.params.id);
    if (req.usuario.rol === 'Lector' && prestamo.id_usuario !== req.usuario.id) {
      return res.status(403).json({ success: false, error: { message: 'No tienes permiso para ver este préstamo.' } });
    }
    res.json({ success: true, data: prestamo });
  } catch (error) {
    next(error);
  }
};

export const createPrestamo = async (req, res, next) => {
  try {
    const nuevo = await prestamosService.crearPrestamo(req.body, req.usuario);
    res.status(201).json({ success: true, data: nuevo, message: 'Préstamo registrado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const registrarDevolucion = async (req, res, next) => {
  try {
    const { observaciones } = req.body;
    const resultado = await prestamosService.registrarDevolucion(req.params.id, observaciones, req.usuario);
    res.json({
      success: true,
      data: resultado,
      message: resultado.multa
        ? `Devolución registrada con retraso. Se generó una multa por $${resultado.multa.valor_multa}.`
        : 'Devolución registrada sin multa.',
    });
  } catch (error) {
    next(error);
  }
};

export const renovarPrestamo = async (req, res, next) => {
  try {
    const { dias } = req.body;
    if (req.usuario.rol === 'Lector') {
      const prestamo = await prestamosService.obtenerPrestamoPorId(req.params.id);
      if (prestamo.id_usuario !== req.usuario.id) {
        return res.status(403).json({ success: false, error: { message: 'No tienes permiso para renovar este préstamo.' } });
      }
    }
    const renovado = await prestamosService.renovarPrestamo(req.params.id, { dias }, req.usuario);
    res.json({ success: true, data: renovado, message: 'Préstamo renovado exitosamente.' });
  } catch (error) {
    next(error);
  }
};
