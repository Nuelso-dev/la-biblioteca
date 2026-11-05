import { Router } from 'express';
import {
  getUbicaciones,
  getUbicacionById,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion,
} from '../controllers/ubicaciones.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarBody } from '../middlewares/validacion.js';

const router = Router();

// Rutas públicas (catálogo/información de ubicación)
router.get('/ubicaciones', getUbicaciones);
router.get('/ubicaciones/:id', validarId('id'), getUbicacionById);

// Rutas de gestión (Admin / Bibliotecario)
router.post(
  '/ubicaciones',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['idBiblioteca', 'nombre'], { idBiblioteca: 'integer', nombre: 'string' }),
  createUbicacion
);

router.put(
  '/ubicaciones/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  updateUbicacion
);

router.delete(
  '/ubicaciones/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  deleteUbicacion
);

export default router;
