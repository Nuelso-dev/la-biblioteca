import * as bibliotecasService from '../services/bibliotecas.service.js';

export const getBibliotecas = async (req, res, next) => {
  try {
    const { idEstado, activo } = req.query;
    const bibliotecas = await bibliotecasService.obtenerBibliotecas({ idEstado, activo });
    res.json({ success: true, data: bibliotecas });
  } catch (error) {
    next(error);
  }
};

export const getBibliotecaById = async (req, res, next) => {
  try {
    const biblioteca = await bibliotecasService.obtenerBibliotecaPorId(req.params.id);
    res.json({ success: true, data: biblioteca });
  } catch (error) {
    next(error);
  }
};

export const createBiblioteca = async (req, res, next) => {
  try {
    const creada = await bibliotecasService.crearBiblioteca(req.body, req.usuario);
    res.status(201).json({ success: true, data: creada, message: 'Biblioteca creada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const updateBiblioteca = async (req, res, next) => {
  try {
    const actualizada = await bibliotecasService.actualizarBiblioteca(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: actualizada, message: 'Biblioteca actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteBiblioteca = async (req, res, next) => {
  try {
    const eliminada = await bibliotecasService.eliminarBiblioteca(req.params.id, req.usuario);
    res.json({ success: true, data: eliminada, message: 'Biblioteca eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};
