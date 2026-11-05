import { Router } from 'express';
import {
  getMisMultas,
  getMultas,
  getMultaById,
  pagarMulta,
  cancelarMulta,
  getMultasPendientes,
  getResumenMultas,
  getMultasByUsuario,
} from '../controllers/multas.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarPaginacion, validarBody } from '../middlewares/validacion.js';

const router = Router();

// Lector & Rutas con nombres específicos (deben ir antes de :id)
router.get('/multas/mis-multas', authenticateSupabase, validarPaginacion, getMisMultas);
router.get('/multas/resumen', authenticateSupabase, getResumenMultas);
router.get('/multas/pendientes', authenticateSupabase, getMultasPendientes);
router.get('/multas/usuario/:idUsuario', authenticateSupabase, getMultasByUsuario);
router.get('/multas/:id', authenticateSupabase, validarId('id'), getMultaById);

// Gestión administrativa
router.get(
  '/multas',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarPaginacion,
  getMultas
);

router.put(
  '/multas/:id/pagar',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  pagarMulta
);

router.put(
  '/multas/:id/cancelar',
  authenticateSupabase,
  requireRole('Administrador'),
  validarId('id'),
  cancelarMulta
);

export default router;
