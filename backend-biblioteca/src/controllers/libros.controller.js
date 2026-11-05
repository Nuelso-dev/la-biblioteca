import * as librosService from '../services/libros.service.js';

export const getLibros = async (req, res, next) => {
  try {
    const { busqueda, idCategoria, idEditorial, idAutor, idBiblioteca, idEstado, disponible, catalogo } = req.query;
    const { limit, offset, page } = req.pagination;
    const filtros = {
      busqueda: typeof busqueda === 'string' ? busqueda.slice(0, 100) : undefined,
      idCategoria: idCategoria ? Number(idCategoria) : undefined,
      idEditorial: idEditorial ? Number(idEditorial) : undefined,
      idAutor: idAutor ? Number(idAutor) : undefined,
      idBiblioteca: idBiblioteca ? Number(idBiblioteca) : undefined,
      idEstado: idEstado ? Number(idEstado) : undefined,
      disponible: disponible === 'true',
      catalogo: catalogo === 'true',
    };
    const [libros, total] = await Promise.all([
      librosService.obtenerLibros({ ...filtros, limit, offset }),
      librosService.contarLibros(filtros),
    ]);
    res.json({ success: true, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), data: libros });
  } catch (error) {
    next(error);
  }
};

export const getLibroById = async (req, res, next) => {
  try {
    const libro = await librosService.obtenerLibroPorId(req.params.id);
    res.json({ success: true, data: libro });
  } catch (error) {
    next(error);
  }
};

export const createLibro = async (req, res, next) => {
  try {
    const nuevo = await librosService.crearLibro(req.body, req.usuario);
    res.status(201).json({ success: true, data: nuevo, message: 'Libro creado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const updateLibro = async (req, res, next) => {
  try {
    const actualizado = await librosService.actualizarLibro(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: actualizado, message: 'Libro actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteLibro = async (req, res, next) => {
  try {
    const eliminado = await librosService.eliminarLibro(req.params.id, req.usuario);
    res.json({ success: true, data: eliminado, message: 'Libro eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
};
