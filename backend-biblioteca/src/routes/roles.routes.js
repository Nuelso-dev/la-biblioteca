import { Router } from 'express';
import { getRoles, getRolById } from '../controllers/roles.controller.js';
import { authenticateSupabase } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validacion.js';

const router = Router();

router.get('/roles', authenticateSupabase, getRoles);
router.get('/roles/:id', authenticateSupabase, validarId('id'), getRolById);

export default router;
