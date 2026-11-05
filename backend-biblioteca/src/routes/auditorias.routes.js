import { Router } from 'express';
import { getAuditorias } from '../controllers/auditorias.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarPaginacion } from '../middlewares/validacion.js';

const router = Router();

// Solo Administrador puede consultar auditorías
router.get('/auditorias', authenticateSupabase, requireRole('Administrador'), validarPaginacion, getAuditorias);

export default router;
