import * as librosAutoresService from '../services/librosAutores.service.js';

export const getAutoresByLibro = async (req, res, next) => {
  try {
    const autores = await librosAutoresService.obtenerAutoresDeLibro(req.params.idLibro);
    res.json({ success: true, data: autores });
  } catch (error) {
    next(error);
  }
};

export const asociarAutor = async (req, res, next) => {
  try {
    const { idLibro, idAutor } = req.body;
    const asociacion = await librosAutoresService.asociarAutor(idLibro, idAutor, req.usuario);
    res.status(201).json({ success: true, data: asociacion, message: 'Autor asociado exitosamente al libro.' });
  } catch (error) {
    next(error);
  }
};

export const desasociarAutor = async (req, res, next) => {
  try {
    const { idLibro, idAutor } = req.params;
    const eliminada = await librosAutoresService.desasociarAutor(Number(idLibro), Number(idAutor), req.usuario);
    res.json({ success: true, data: eliminada, message: 'Autor desasociado del libro.' });
  } catch (error) {
    next(error);
  }
};
