import * as editorialesRepo from '../repositories/editoriales.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerEditoriales = async (filtros) => {
  return await editorialesRepo.findAll(filtros);
};

export const obtenerEditorialPorId = async (id) => {
  const editorial = await editorialesRepo.findById(id);
  if (!editorial) {
    const error = new Error('Editorial no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return editorial;
};

export const crearEditorial = async (datos, usuarioActual) => {
  const existente = await editorialesRepo.findByNombre(datos.nombre);
  if (existente) {
    const error = new Error(`Ya existe una editorial registrada con el nombre '${datos.nombre}'.`);
    error.statusCode = 409;
    throw error;
  }

  const creada = await editorialesRepo.create(datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creada.id_editorial,
      accion: 'CREAR_EDITORIAL',
      tablaAfectada: 'Editoriales',
      datosAnteriores: null,
      datosNuevos: creada,
    });
  }
  return creada;
};

export const actualizarEditorial = async (id, datos, usuarioActual) => {
  const anterior = await obtenerEditorialPorId(id);

  if (datos.nombre && datos.nombre.toLowerCase().trim() !== anterior.nombre_editorial.toLowerCase().trim()) {
    const duplicada = await editorialesRepo.findByNombre(datos.nombre);
    if (duplicada && duplicada.id_editorial !== id) {
      const error = new Error(`Ya existe otra editorial registrada con el nombre '${datos.nombre}'.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const actualizada = await editorialesRepo.update(id, datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ACTUALIZAR_EDITORIAL',
      tablaAfectada: 'Editoriales',
      datosAnteriores: anterior,
      datosNuevos: actualizada,
    });
  }
  return actualizada;
};

export const eliminarEditorial = async (id, usuarioActual) => {
  const anterior = await obtenerEditorialPorId(id);
  const eliminada = await editorialesRepo.remove(id);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ELIMINAR_EDITORIAL',
      tablaAfectada: 'Editoriales',
      datosAnteriores: anterior,
      datosNuevos: null,
    });
  }
  return eliminada;
};
