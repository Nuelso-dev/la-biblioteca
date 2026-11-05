import { Router } from 'express';
import {
  getMisPrestamos,
  getPrestamos,
  getPrestamoById,
  createPrestamo,
  registrarDevolucion,
  renovarPrestamo,
} from '../controllers/prestamos.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarPaginacion, validarBody } from '../middlewares/validacion.js';

const router = Router();

// Lector
router.get('/prestamos/mis-prestamos', authenticateSupabase, validarPaginacion, getMisPrestamos);
router.get('/prestamos/:id', authenticateSupabase, validarId('id'), getPrestamoById);

// Gestión administrativa
router.get(
  '/prestamos',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarPaginacion,
  getPrestamos
);

router.post(
  '/prestamos',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['idUsuario', 'idEjemplar'], {
    idUsuario: 'string',
    idEjemplar: 'integer',
    idSolicitud: 'integer',
    fechaVencimiento: 'string',
    observaciones: 'string',
  }),
  createPrestamo
);

router.put(
  '/prestamos/:id/devolucion',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  registrarDevolucion
);

router.put(
  '/prestamos/:id/renovar',
  authenticateSupabase,
  validarId('id'),
  validarBody([], { dias: 'integer' }),
  renovarPrestamo
);

export default router;
