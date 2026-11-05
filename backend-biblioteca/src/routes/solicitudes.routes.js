import { Router } from 'express';
import {
  getMisSolicitudes,
  getSolicitudes,
  getSolicitudById,
  createSolicitud,
  cancelarSolicitud,
  responderSolicitud,
} from '../controllers/solicitudes.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarPaginacion, validarBody } from '../middlewares/validacion.js';

const router = Router();

// Rutas de usuario (Lector)
router.get('/solicitudes/mis-solicitudes', authenticateSupabase, validarPaginacion, getMisSolicitudes);
router.post(
  '/solicitudes',
  authenticateSupabase,
  validarBody(['idEjemplar'], { idEjemplar: 'integer', observaciones: 'string' }),
  createSolicitud
);
router.delete('/solicitudes/:id/cancelar', authenticateSupabase, validarId('id'), cancelarSolicitud);

// Rutas administrativas
router.get(
  '/solicitudes',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarPaginacion,
  getSolicitudes
);

router.get('/solicitudes/:id', authenticateSupabase, validarId('id'), getSolicitudById);

router.put(
  '/solicitudes/:id/responder',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  validarBody(['accion'], { accion: 'string', observaciones: 'string' }),
  responderSolicitud
);

export default router;
