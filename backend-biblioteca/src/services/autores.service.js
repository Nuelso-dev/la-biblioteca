import * as autoresRepo from '../repositories/autores.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerAutores = async (filtros) => {
  return await autoresRepo.findAll(filtros);
};

export const obtenerAutorPorId = async (id) => {
  const autor = await autoresRepo.findById(id);
  if (!autor) {
    const error = new Error('Autor no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return autor;
};

export const crearAutor = async (datos, usuarioActual) => {
  const existente = await autoresRepo.findByNombre(datos.nombre);
  if (existente) {
    const error = new Error(`Ya existe un autor registrado con el nombre '${datos.nombre}'.`);
    error.statusCode = 409;
    throw error;
  }

  const creado = await autoresRepo.create(datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creado.id_autor,
      accion: 'CREAR_AUTOR',
      tablaAfectada: 'Autores',
      datosAnteriores: null,
      datosNuevos: creado,
    });
  }
  return creado;
};

export const actualizarAutor = async (id, datos, usuarioActual) => {
  const anterior = await obtenerAutorPorId(id);

  if (datos.nombre && datos.nombre.toLowerCase().trim() !== anterior.nombrecompleto_autor.toLowerCase().trim()) {
    const duplicado = await autoresRepo.findByNombre(datos.nombre);
    if (duplicado && duplicado.id_autor !== id) {
      const error = new Error(`Ya existe otro autor registrado con el nombre '${datos.nombre}'.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const actualizado = await autoresRepo.update(id, datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ACTUALIZAR_AUTOR',
      tablaAfectada: 'Autores',
      datosAnteriores: anterior,
      datosNuevos: actualizado,
    });
  }
  return actualizado;
};

export const eliminarAutor = async (id, usuarioActual) => {
  const anterior = await obtenerAutorPorId(id);
  const tieneLibros = await autoresRepo.hasBooks(id);
  if (tieneLibros) {
    const error = new Error('No es posible eliminar el autor porque tiene libros asociados en el catálogo.');
    error.statusCode = 400;
    throw error;
  }

  const eliminado = await autoresRepo.remove(id);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ELIMINAR_AUTOR',
      tablaAfectada: 'Autores',
      datosAnteriores: anterior,
      datosNuevos: null,
    });
  }
  return eliminado;
};
