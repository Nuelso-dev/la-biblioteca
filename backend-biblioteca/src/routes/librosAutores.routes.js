import { Router } from 'express';
import {
  getAutoresByLibro,
  asociarAutor,
  desasociarAutor,
} from '../controllers/librosAutores.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarBody } from '../middlewares/validacion.js';

const router = Router();

router.get('/libros/:idLibro/autores', validarId('idLibro'), getAutoresByLibro);

router.post(
  '/libros-autores',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['idLibro', 'idAutor'], { idLibro: 'integer', idAutor: 'integer' }),
  asociarAutor
);

router.delete(
  '/libros/:idLibro/autores/:idAutor',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('idLibro'),
  validarId('idAutor'),
  desasociarAutor
);

export default router;
