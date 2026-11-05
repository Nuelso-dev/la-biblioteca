import { Router } from 'express';
import {
  getMisNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  getNoLeidas,
  deleteNotificacion,
} from '../controllers/notificaciones.controller.js';
import { authenticateSupabase } from '../middlewares/auth.js';
import { validarId, validarPaginacion } from '../middlewares/validacion.js';

const router = Router();

router.get('/notificaciones/no-leidas', authenticateSupabase, getNoLeidas);
router.get('/notificaciones', authenticateSupabase, validarPaginacion, getMisNotificaciones);
router.put('/notificaciones/leer-todas', authenticateSupabase, marcarTodasLeidas);
router.put('/notificaciones/:id/leer', authenticateSupabase, validarId('id'), marcarLeida);
router.delete('/notificaciones/:id', authenticateSupabase, validarId('id'), deleteNotificacion);

export default router;
