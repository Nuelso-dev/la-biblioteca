import { Router } from 'express';
import {
  getConfiguraciones,
  getReglasPublicas,
  getConfiguracionByClave,
  setConfiguracion,
  deleteConfiguracion,
} from '../controllers/config.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';

const router = Router();

// Reglas del servicio para el público (antes de las rutas con :clave)
router.get('/config/publica', getReglasPublicas);

// Consultar configuraciones (solo personal: Administrador y Bibliotecario)
router.get('/config', authenticateSupabase, requireRole('Administrador', 'Bibliotecario'), getConfiguraciones);
router.get('/config/:clave', authenticateSupabase, requireRole('Administrador', 'Bibliotecario'), getConfiguracionByClave);

// Modificar/eliminar configuraciones (solo Administrador)
router.put('/config/:clave', authenticateSupabase, requireRole('Administrador'), setConfiguracion);
router.delete('/config/:clave', authenticateSupabase, requireRole('Administrador'), deleteConfiguracion);

export default router;
