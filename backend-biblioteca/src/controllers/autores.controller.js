import * as autoresService from '../services/autores.service.js';

export const getAutores = async (req, res, next) => {
  try {
    const { busqueda } = req.query;
    const { limit, offset, page } = req.pagination;
    const autores = await autoresService.obtenerAutores({ busqueda, limit, offset });
    res.json({ success: true, page, limit, data: autores });
  } catch (error) {
    next(error);
  }
};

export const getAutorById = async (req, res, next) => {
  try {
    const autor = await autoresService.obtenerAutorPorId(req.params.id);
    res.json({ success: true, data: autor });
  } catch (error) {
    next(error);
  }
};

export const createAutor = async (req, res, next) => {
  try {
    const creado = await autoresService.crearAutor(req.body, req.usuario);
    res.status(201).json({ success: true, data: creado, message: 'Autor creado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const updateAutor = async (req, res, next) => {
  try {
    const actualizado = await autoresService.actualizarAutor(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: actualizado, message: 'Autor actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteAutor = async (req, res, next) => {
  try {
    const eliminado = await autoresService.eliminarAutor(req.params.id, req.usuario);
    res.json({ success: true, data: eliminado, message: 'Autor eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
};
