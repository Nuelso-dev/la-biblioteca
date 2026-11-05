import * as librosRepo from '../repositories/libros.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerLibros = async (filtros) => {
  return await librosRepo.findAll(filtros);
};

export const contarLibros = async (filtros) => {
  return await librosRepo.count(filtros);
};

export const obtenerLibroPorId = async (id) => {
  const libro = await librosRepo.findById(id);
  if (!libro) {
    const error = new Error('Libro no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return libro;
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

/**
 * Valida y normaliza el cuerpo de un libro (reglas alineadas con el esquema de public.libros).
 */
const validarDatosLibro = (datos, { esCreacion }) => {
  if (esCreacion || datos.titulo !== undefined) {
    if (!datos.titulo || !String(datos.titulo).trim()) throw badRequest('El título del libro es obligatorio.');
  }
  if (esCreacion && !datos.idCategoria) throw badRequest('La categoría del libro es obligatoria.');
  if (esCreacion && !datos.idEditorial && !(datos.editorial && datos.editorial.trim())) {
    throw badRequest('La editorial del libro es obligatoria.');
  }
  if (datos.numPaginas !== undefined && datos.numPaginas !== null && datos.numPaginas <= 0) {
    throw badRequest('El número de páginas debe ser mayor que cero.');
  }
  if (datos.fechaPublicacion) {
    const fecha = new Date(datos.fechaPublicacion);
    if (Number.isNaN(fecha.getTime())) throw badRequest('La fecha de publicación no es válida.');
  }
  if (datos.autoresIds !== undefined) {
    if (!Array.isArray(datos.autoresIds) || !datos.autoresIds.every((n) => Number.isInteger(n) && n > 0)) {
      throw badRequest('autoresIds debe ser una lista de identificadores enteros positivos.');
    }
  }
};

export const crearLibro = async (datos, usuarioActual) => {
  validarDatosLibro(datos, { esCreacion: true });
  if (datos.isbn) {
    const existeIsbn = await librosRepo.findByIsbn(datos.isbn);
    if (existeIsbn) {
      const error = new Error(`Ya existe un libro registrado con el ISBN '${datos.isbn}'.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const creado = await librosRepo.create(datos, datos.autoresIds || []);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creado.id_libro,
      accion: 'CREAR_LIBRO',
      tablaAfectada: 'Libros',
      datosAnteriores: null,
      datosNuevos: creado,
    });
  }

  return await obtenerLibroPorId(creado.id_libro);
};

export const actualizarLibro = async (id, datos, usuarioActual) => {
  validarDatosLibro(datos, { esCreacion: false });
  const anterior = await obtenerLibroPorId(id);

  if (datos.isbn && datos.isbn.trim() !== (anterior.isbn_libro || '').trim()) {
    const existeIsbn = await librosRepo.findByIsbn(datos.isbn);
    if (existeIsbn && Number(existeIsbn.id_libro) !== Number(id)) {
      const error = new Error(`El ISBN '${datos.isbn}' ya pertenece a otro libro registrado.`);
      error.statusCode = 409;
      throw error;
    }
  }

  await librosRepo.update(id, datos, datos.autoresIds);
  const actualizado = await obtenerLibroPorId(id);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ACTUALIZAR_LIBRO',
      tablaAfectada: 'Libros',
      datosAnteriores: anterior,
      datosNuevos: actualizado,
    });
  }

  return actualizado;
};

export const eliminarLibro = async (id, usuarioActual) => {
  const anterior = await obtenerLibroPorId(id);
  const eliminado = await librosRepo.remove(id);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ELIMINAR_LIBRO',
      tablaAfectada: 'Libros',
      datosAnteriores: anterior,
      datosNuevos: null,
    });
  }

  return eliminado;
};
