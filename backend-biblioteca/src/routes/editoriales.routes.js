import { Router } from 'express';
import {
  getEditoriales,
  getEditorialById,
  createEditorial,
  updateEditorial,
  deleteEditorial,
} from '../controllers/editoriales.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarBody } from '../middlewares/validacion.js';

const router = Router();

router.get('/editoriales', getEditoriales);
router.get('/editoriales/:id', validarId('id'), getEditorialById);

router.post(
  '/editoriales',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['nombre'], { nombre: 'string', pais: 'string' }),
  createEditorial
);

router.put(
  '/editoriales/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  updateEditorial
);

router.delete(
  '/editoriales/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  deleteEditorial
);

export default router;
