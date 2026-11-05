import * as ubicacionesRepo from '../repositories/ubicaciones.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerUbicaciones = async (filtros) => {
  return await ubicacionesRepo.findAll(filtros);
};

export const obtenerUbicacionPorId = async (id) => {
  const ubicacion = await ubicacionesRepo.findById(id);
  if (!ubicacion) {
    const error = new Error('Ubicación no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return ubicacion;
};

export const crearUbicacion = async (datos, usuarioActual) => {
  const creada = await ubicacionesRepo.create(datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creada.id_ubicacion,
      accion: 'CREAR_UBICACION',
      tablaAfectada: 'Ubicaciones',
      datosAnteriores: null,
      datosNuevos: creada,
    });
  }
  return creada;
};

export const actualizarUbicacion = async (id, datos, usuarioActual) => {
  const anterior = await obtenerUbicacionPorId(id);
  const actualizada = await ubicacionesRepo.update(id, datos);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ACTUALIZAR_UBICACION',
      tablaAfectada: 'Ubicaciones',
      datosAnteriores: anterior,
      datosNuevos: actualizada,
    });
  }
  return actualizada;
};

export const eliminarUbicacion = async (id, usuarioActual) => {
  const anterior = await obtenerUbicacionPorId(id);
  const eliminada = await ubicacionesRepo.remove(id);
  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ELIMINAR_UBICACION',
      tablaAfectada: 'Ubicaciones',
      datosAnteriores: anterior,
      datosNuevos: null,
    });
  }
  return eliminada;
};
