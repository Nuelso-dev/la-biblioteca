import * as categoriasService from '../services/categorias.service.js';

export const getCategorias = async (req, res, next) => {
  try {
    const { idEstado, busqueda } = req.query;
    const categorias = await categoriasService.obtenerCategorias({ idEstado, busqueda });
    res.json({ success: true, data: categorias });
  } catch (error) {
    next(error);
  }
};

export const getCategoriaById = async (req, res, next) => {
  try {
    const categoria = await categoriasService.obtenerCategoriaPorId(req.params.id);
    res.json({ success: true, data: categoria });
  } catch (error) {
    next(error);
  }
};

export const createCategoria = async (req, res, next) => {
  try {
    const creada = await categoriasService.crearCategoria(req.body, req.usuario);
    res.status(201).json({ success: true, data: creada, message: 'Categoría creada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const updateCategoria = async (req, res, next) => {
  try {
    const actualizada = await categoriasService.actualizarCategoria(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: actualizada, message: 'Categoría actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoria = async (req, res, next) => {
  try {
    const eliminada = await categoriasService.eliminarCategoria(req.params.id, req.usuario);
    res.json({ success: true, data: eliminada, message: 'Categoría eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};
