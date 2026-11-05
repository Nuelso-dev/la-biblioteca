import * as configRepo from '../repositories/config.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerConfiguraciones = async () => {
  return await configRepo.findAll();
};

export const obtenerConfiguracionPorClave = async (clave) => {
  const config = await configRepo.findByClave(clave);
  if (!config) {
    const error = new Error(`Configuración con clave '${clave}' no encontrada.`);
    error.statusCode = 404;
    throw error;
  }
  return config;
};

export const guardarConfiguracion = async (clave, valor, descripcion, usuarioActual) => {
  const anterior = await configRepo.findByClave(clave);
  const guardada = await configRepo.createOrUpdate(clave, valor, descripcion);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: guardada.id_configuracion,
      accion: anterior ? 'ACTUALIZAR_CONFIG' : 'CREAR_CONFIG',
      tablaAfectada: 'Configuraciones',
      datosAnteriores: anterior,
      datosNuevos: guardada,
    });
  }

  return guardada;
};

export const eliminarConfiguracion = async (clave, usuarioActual) => {
  const anterior = await obtenerConfiguracionPorClave(clave);
  const eliminada = await configRepo.remove(clave);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: anterior.id_configuracion,
      accion: 'ELIMINAR_CONFIG',
      tablaAfectada: 'Configuraciones',
      datosAnteriores: anterior,
      datosNuevos: null,
    });
  }

  return eliminada;
};
