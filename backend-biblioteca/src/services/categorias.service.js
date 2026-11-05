import * as categoriasRepo from '../repositories/categorias.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerCategorias = async (filtros) => {
  return await categoriasRepo.findAll(filtros);
};

export const obtenerCategoriaPorId = async (id) => {
  const categoria = await categoriasRepo.findById(id);
  if (!categoria) {
    const error = new Error('Categoría no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return categoria;
};

export const crearCategoria = async (datos, usuarioActual) => {
  const existente = await categoriasRepo.findByNombre(datos.nombre);
  if (existente) {
    const error = new Error(`Ya existe una categoría registrada con el nombre '${datos.nombre}'.`);
    error.statusCode = 409;
    throw error;
  }

  const creada = await categoriasRepo.create(datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creada.id_categorias_libros,
      accion: 'CREAR_CATEGORIA',
      tablaAfectada: 'Categorias_Libros',
      datosAnteriores: null,
      datosNuevos: creada,
    });
  }
  return creada;
};

export const actualizarCategoria = async (id, datos, usuarioActual) => {
  const anterior = await obtenerCategoriaPorId(id);

  if (datos.nombre && datos.nombre.toLowerCase().trim() !== anterior.nombre_categlib.toLowerCase().trim()) {
    const duplicada = await categoriasRepo.findByNombre(datos.nombre);
    if (duplicada && duplicada.id_categorias_libros !== id) {
      const error = new Error(`Ya existe otra categoría registrada con el nombre '${datos.nombre}'.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const actualizada = await categoriasRepo.update(id, datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ACTUALIZAR_CATEGORIA',
      tablaAfectada: 'Categorias_Libros',
      datosAnteriores: anterior,
      datosNuevos: actualizada,
    });
  }
  return actualizada;
};

export const eliminarCategoria = async (id, usuarioActual) => {
  const anterior = await obtenerCategoriaPorId(id);
  const eliminada = await categoriasRepo.remove(id);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ELIMINAR_CATEGORIA',
      tablaAfectada: 'Categorias_Libros',
      datosAnteriores: anterior,
      datosNuevos: null,
    });
  }
  return eliminada;
};
