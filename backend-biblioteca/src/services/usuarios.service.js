import * as usuariosRepo from '../repositories/usuarios.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const obtenerUsuarios = async (filtros) => {
  return await usuariosRepo.findAll(filtros);
};

export const listarUsuarios = async (filtros) => {
  const [datos, total] = await Promise.all([usuariosRepo.findAll(filtros), usuariosRepo.count(filtros)]);
  return { datos, total };
};

export const obtenerUsuarioPorId = async (id) => {
  const usuario = await usuariosRepo.findById(id);
  if (!usuario) {
    const error = new Error('Usuario no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return usuario;
};

export const actualizarMiPerfil = async (idUsuario, datos) => {
  const anterior = await obtenerUsuarioPorId(idUsuario);
  return await usuariosRepo.updatePerfil(idUsuario, datos);
};

export const cambiarRolOEstado = async (idUsuario, { idRol, idEstado }, adminEjecutor) => {
  const anterior = await obtenerUsuarioPorId(idUsuario);
  const actualizado = await usuariosRepo.updateRolEstado(idUsuario, { idRol, idEstado });

  if (adminEjecutor) {
    await auditoriasService.registrarAuditoria({
      idUsuario: adminEjecutor.id,
      idRegistro: null,
      accion: 'MODIFICAR_ROL_ESTADO_USUARIO',
      tablaAfectada: 'Usuarios',
      datosAnteriores: anterior,
      datosNuevos: actualizado,
    });
  }

  return actualizado;
};
