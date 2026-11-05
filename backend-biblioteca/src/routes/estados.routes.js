import { Router } from 'express';
import { getEstados, getEstadoById, createEstado, updateEstado } from '../controllers/estados.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarBody } from '../middlewares/validacion.js';

const router = Router();

// Lectura pública de catálogo de estados
router.get('/estados', getEstados);
router.get('/estados/:id', validarId('id'), getEstadoById);

// Modificación reservada para Administrador
router.post(
  '/estados',
  authenticateSupabase,
  requireRole('Administrador'),
  validarBody(['entidad', 'codigo', 'nombre'], { entidad: 'string', codigo: 'string', nombre: 'string' }),
  createEstado
);

router.put(
  '/estados/:id',
  authenticateSupabase,
  requireRole('Administrador'),
  validarId('id'),
  updateEstado
);

export default router;
