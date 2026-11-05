import * as bibliotecasRepo from '../repositories/bibliotecas.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerBibliotecas = async (filtros) => {
  return await bibliotecasRepo.findAll(filtros);
};

export const obtenerBibliotecaPorId = async (id) => {
  const biblioteca = await bibliotecasRepo.findById(id);
  if (!biblioteca) {
    const error = new Error('Biblioteca no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return biblioteca;
};

/** Las coordenadas van juntas y dentro de rango: latitud -90..90, longitud -180..180. */
const validarCoordenadas = ({ latitud, longitud }) => {
  const hayLat = latitud !== undefined && latitud !== null;
  const hayLng = longitud !== undefined && longitud !== null;
  if (!hayLat && !hayLng) return;
  const valida = hayLat && hayLng && Number.isFinite(latitud) && Number.isFinite(longitud) &&
    Math.abs(latitud) <= 90 && Math.abs(longitud) <= 180;
  if (!valida) {
    const error = new Error('La ubicación en el mapa no es válida: indica latitud (-90 a 90) y longitud (-180 a 180).');
    error.statusCode = 400;
    throw error;
  }
};

export const crearBiblioteca = async (datos, usuarioActual) => {
  validarCoordenadas(datos);
  const creada = await bibliotecasRepo.create(datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creada.id_biblioteca,
      accion: 'CREAR_BIBLIOTECA',
      tablaAfectada: 'Bibliotecas',
      datosAnteriores: null,
      datosNuevos: creada,
    });
  }
  return creada;
};

export const actualizarBiblioteca = async (id, datos, usuarioActual) => {
  validarCoordenadas(datos);
  const anterior = await obtenerBibliotecaPorId(id);
  const actualizada = await bibliotecasRepo.update(id, datos);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ACTUALIZAR_BIBLIOTECA',
      tablaAfectada: 'Bibliotecas',
      datosAnteriores: anterior,
      datosNuevos: actualizada,
    });
  }
  return actualizada;
};

export const eliminarBiblioteca = async (id, usuarioActual) => {
  const anterior = await obtenerBibliotecaPorId(id);
  const eliminada = await bibliotecasRepo.remove(id);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ELIMINAR_BIBLIOTECA',
      tablaAfectada: 'Bibliotecas',
      datosAnteriores: anterior,
      datosNuevos: null,
    });
  }
  return eliminada;
};
