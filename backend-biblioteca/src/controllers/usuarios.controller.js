import * as usuariosService from '../services/usuarios.service.js';
import { metaPaginacion } from '../utils/paginacion.js';

export const getMiPerfil = async (req, res, next) => {
  try {
    const perfil = await usuariosService.obtenerUsuarioPorId(req.usuario.id);
    res.json({ success: true, data: perfil });
  } catch (error) {
    next(error);
  }
};

export const updateMiPerfil = async (req, res, next) => {
  try {
    const { nombre, documento, telefono } = req.body;
    const actualizado = await usuariosService.actualizarMiPerfil(req.usuario.id, { nombre, documento, telefono });
    res.json({ success: true, data: actualizado, message: 'Perfil actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const getUsuarios = async (req, res, next) => {
  try {
    const { idRol, idEstado, busqueda, personal } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await usuariosService.listarUsuarios({
      idRol,
      idEstado,
      personal: personal === 'true',
      busqueda: typeof busqueda === 'string' ? busqueda.trim().slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};

export const getUsuarioById = async (req, res, next) => {
  try {
    const usuario = await usuariosService.obtenerUsuarioPorId(req.params.id);
    res.json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
};

export const updateRolEstadoUsuario = async (req, res, next) => {
  try {
    const { idRol, idEstado } = req.body;
    const actualizado = await usuariosService.cambiarRolOEstado(req.params.id, { idRol, idEstado }, req.usuario);
    res.json({ success: true, data: actualizado, message: 'Rol o estado de usuario modificado exitosamente.' });
  } catch (error) {
    next(error);
  }
};
