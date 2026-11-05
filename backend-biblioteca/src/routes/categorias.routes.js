import { Router } from 'express';
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '../controllers/categorias.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarBody } from '../middlewares/validacion.js';

const router = Router();

router.get('/categorias', getCategorias);
router.get('/categorias/:id', validarId('id'), getCategoriaById);

router.post(
  '/categorias',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['nombre'], { nombre: 'string', descripcion: 'string' }),
  createCategoria
);

router.put(
  '/categorias/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  updateCategoria
);

router.delete(
  '/categorias/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  deleteCategoria
);

export default router;
