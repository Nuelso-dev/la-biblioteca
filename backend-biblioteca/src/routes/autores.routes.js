import { Router } from 'express';
import {
  getAutores,
  getAutorById,
  createAutor,
  updateAutor,
  deleteAutor,
} from '../controllers/autores.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarPaginacion, validarBody } from '../middlewares/validacion.js';

const router = Router();

router.get('/autores', validarPaginacion, getAutores);
router.get('/autores/:id', validarId('id'), getAutorById);

router.post(
  '/autores',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['nombre'], { nombre: 'string', biografia: 'string', fechaNacimiento: 'string' }),
  createAutor
);

router.put(
  '/autores/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  updateAutor
);

router.delete(
  '/autores/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  deleteAutor
);

export default router;
