import { Router } from 'express';
import {
  getEjemplares,
  getEjemplarById,
  createEjemplar,
  createEjemplaresLote,
  updateEjemplar,
  deleteEjemplar,
} from '../controllers/ejemplares.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarPaginacion, validarBody } from '../middlewares/validacion.js';

const router = Router();

router.get('/ejemplares', validarPaginacion, getEjemplares);
router.get('/ejemplares/:id', validarId('id'), getEjemplarById);

router.post(
  '/ejemplares',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['idLibro', 'idUbicacion'], { idLibro: 'integer', idUbicacion: 'integer', codigoInterno: 'string' }),
  createEjemplar
);

router.post(
  '/ejemplares/lote',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['idLibro', 'idUbicacion', 'cantidad'], {
    idLibro: 'integer',
    idUbicacion: 'integer',
    cantidad: 'integer',
    idEstado: 'integer',
    fechaAdquisicion: 'string',
    observacion: 'string',
  }),
  createEjemplaresLote
);

router.put(
  '/ejemplares/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  updateEjemplar
);

router.delete(
  '/ejemplares/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  deleteEjemplar
);

export default router;
