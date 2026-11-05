import * as editorialesService from '../services/editoriales.service.js';

export const getEditoriales = async (req, res, next) => {
  try {
    const { idEstado, busqueda } = req.query;
    const editoriales = await editorialesService.obtenerEditoriales({ idEstado, busqueda });
    res.json({ success: true, data: editoriales });
  } catch (error) {
    next(error);
  }
};

export const getEditorialById = async (req, res, next) => {
  try {
    const editorial = await editorialesService.obtenerEditorialPorId(req.params.id);
    res.json({ success: true, data: editorial });
  } catch (error) {
    next(error);
  }
};

export const createEditorial = async (req, res, next) => {
  try {
    const creada = await editorialesService.crearEditorial(req.body, req.usuario);
    res.status(201).json({ success: true, data: creada, message: 'Editorial creada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const updateEditorial = async (req, res, next) => {
  try {
    const actualizada = await editorialesService.actualizarEditorial(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: actualizada, message: 'Editorial actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteEditorial = async (req, res, next) => {
  try {
    const eliminada = await editorialesService.eliminarEditorial(req.params.id, req.usuario);
    res.json({ success: true, data: eliminada, message: 'Editorial eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};
