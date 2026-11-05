import * as ubicacionesService from '../services/ubicaciones.service.js';

export const getUbicaciones = async (req, res, next) => {
  try {
    const { idBiblioteca, idEstado } = req.query;
    const ubicaciones = await ubicacionesService.obtenerUbicaciones({ idBiblioteca, idEstado });
    res.json({ success: true, data: ubicaciones });
  } catch (error) {
    next(error);
  }
};

export const getUbicacionById = async (req, res, next) => {
  try {
    const ubicacion = await ubicacionesService.obtenerUbicacionPorId(req.params.id);
    res.json({ success: true, data: ubicacion });
  } catch (error) {
    next(error);
  }
};

export const createUbicacion = async (req, res, next) => {
  try {
    const creada = await ubicacionesService.crearUbicacion(req.body, req.usuario);
    res.status(201).json({ success: true, data: creada, message: 'Ubicación creada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const updateUbicacion = async (req, res, next) => {
  try {
    const actualizada = await ubicacionesService.actualizarUbicacion(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: actualizada, message: 'Ubicación actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteUbicacion = async (req, res, next) => {
  try {
    const eliminada = await ubicacionesService.eliminarUbicacion(req.params.id, req.usuario);
    res.json({ success: true, data: eliminada, message: 'Ubicación eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};
