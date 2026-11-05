import * as ejemplaresService from '../services/ejemplares.service.js';
import { metaPaginacion } from '../utils/paginacion.js';

export const getEjemplares = async (req, res, next) => {
  try {
    const { idLibro, idBiblioteca, idUbicacion, idEstado, codigo } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await ejemplaresService.listarEjemplares({
      idLibro: idLibro ? Number(idLibro) : undefined,
      idBiblioteca: idBiblioteca ? Number(idBiblioteca) : undefined,
      idUbicacion: idUbicacion ? Number(idUbicacion) : undefined,
      idEstado: idEstado ? Number(idEstado) : undefined,
      codigo: typeof codigo === 'string' ? codigo.trim().slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};

export const getEjemplarById = async (req, res, next) => {
  try {
    const ejemplar = await ejemplaresService.obtenerEjemplarPorId(req.params.id);
    res.json({ success: true, data: ejemplar });
  } catch (error) {
    next(error);
  }
};

export const createEjemplar = async (req, res, next) => {
  try {
    const creado = await ejemplaresService.crearEjemplar(req.body, req.usuario);
    res.status(201).json({ success: true, data: creado, message: 'Ejemplar registrado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const createEjemplaresLote = async (req, res, next) => {
  try {
    const creados = await ejemplaresService.crearEjemplaresLote(req.body, req.usuario);
    res.status(201).json({ success: true, data: creados, message: `${creados.length} ejemplares registrados exitosamente.` });
  } catch (error) {
    next(error);
  }
};

export const updateEjemplar = async (req, res, next) => {
  try {
    const actualizado = await ejemplaresService.actualizarEjemplar(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: actualizado, message: 'Ejemplar actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteEjemplar = async (req, res, next) => {
  try {
    const eliminado = await ejemplaresService.eliminarEjemplar(req.params.id, req.usuario);
    res.json({ success: true, data: eliminado, message: 'Ejemplar eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
};
