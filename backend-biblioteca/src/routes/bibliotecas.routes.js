import { Router } from 'express';
import {
  getBibliotecas,
  getBibliotecaById,
  createBiblioteca,
  updateBiblioteca,
  deleteBiblioteca,
} from '../controllers/bibliotecas.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarBody } from '../middlewares/validacion.js';

const router = Router();

// Rutas públicas (catálogo de sedes)
router.get('/bibliotecas', getBibliotecas);
router.get('/bibliotecas/:id', validarId('id'), getBibliotecaById);

// Rutas de administración
router.post(
  '/bibliotecas',
  authenticateSupabase,
  requireRole('Administrador'),
  validarBody(['nombre'], { nombre: 'string', direccion: 'string', telefono: 'string', descripcion: 'string', latitud: 'number', longitud: 'number' }),
  createBiblioteca
);

router.put(
  '/bibliotecas/:id',
  authenticateSupabase,
  requireRole('Administrador'),
  validarId('id'),
  updateBiblioteca
);

router.delete(
  '/bibliotecas/:id',
  authenticateSupabase,
  requireRole('Administrador'),
  validarId('id'),
  deleteBiblioteca
);

export default router;
