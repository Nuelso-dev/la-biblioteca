import * as estadosService from '../services/estados.service.js';

export const getEstados = async (req, res, next) => {
  try {
    const { entidad, activo } = req.query;
    const estados = await estadosService.obtenerEstados({ entidad, activo });
    res.json({ success: true, data: estados });
  } catch (error) {
    next(error);
  }
};

export const getEstadoById = async (req, res, next) => {
  try {
    const estado = await estadosService.obtenerEstadoPorId(req.params.id);
    res.json({ success: true, data: estado });
  } catch (error) {
    next(error);
  }
};

export const createEstado = async (req, res, next) => {
  try {
    const nuevo = await estadosService.crearEstado(req.body);
    res.status(201).json({ success: true, data: nuevo, message: 'Estado creado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const updateEstado = async (req, res, next) => {
  try {
    const actualizado = await estadosService.actualizarEstado(req.params.id, req.body);
    res.json({ success: true, data: actualizado, message: 'Estado actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
};
