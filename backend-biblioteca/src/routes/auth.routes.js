import { Router } from 'express';
import { recuperarClave } from '../controllers/auth.controller.js';
import { limitarAutenticacion } from '../middlewares/rate-limit.js';
import { validarBody } from '../middlewares/validacion.js';

const router = Router();

// Ruta sensible sin sesión previa: con límite estricto de intentos por IP
router.post(
  '/auth/recuperar-contrasena',
  limitarAutenticacion,
  validarBody(['email'], { email: 'string', redirectTo: 'string' }),
  recuperarClave
);

export default router;
