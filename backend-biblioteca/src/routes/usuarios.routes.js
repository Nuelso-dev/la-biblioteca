import { Router } from 'express';
import {
  getMiPerfil,
  updateMiPerfil,
  getUsuarios,
  getUsuarioById,
  updateRolEstadoUsuario,
} from '../controllers/usuarios.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarUUID, validarPaginacion, validarBody } from '../middlewares/validacion.js';

const router = Router();

// Rutas de perfil personal (cualquier usuario autenticado)
router.get('/usuarios/me', authenticateSupabase, getMiPerfil);
router.put(
  '/usuarios/me',
  authenticateSupabase,
  validarBody([], { nombre: 'string', documento: 'string', telefono: 'string' }),
  updateMiPerfil
);

// Rutas de administración de usuarios (solo Administrador)
router.get('/usuarios', authenticateSupabase, requireRole('Administrador', 'Bibliotecario'), validarPaginacion, getUsuarios);
router.get('/usuarios/:id', authenticateSupabase, requireRole('Administrador'), validarUUID('id'), getUsuarioById);
router.put(
  '/usuarios/:id/rol-estado',
  authenticateSupabase,
  requireRole('Administrador'),
  validarUUID('id'),
  validarBody([], { idRol: 'integer', idEstado: 'integer' }),
  updateRolEstadoUsuario
);

export default router;
