import { Router } from 'express';
import {
  getLibros,
  getLibroById,
  createLibro,
  updateLibro,
  deleteLibro,
} from '../controllers/libros.controller.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';
import { validarId, validarPaginacion, validarBody } from '../middlewares/validacion.js';

const router = Router();

const reglasLibro = {
  titulo: 'string',
  isbn: 'string',
  editorial: 'string',
  descripcion: 'string',
  sinopsis: 'string',
  portada: 'string',
  idioma: 'string',
  fechaPublicacion: 'string',
  idCategoria: 'integer',
  idEditorial: 'integer',
  idEstado: 'integer',
  numPaginas: 'integer',
};

// Catálogo público
router.get('/libros', validarPaginacion, getLibros);
router.get('/libros/:id', validarId('id'), getLibroById);

// Gestión editorial
router.post(
  '/libros',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarBody(['titulo', 'idCategoria'], reglasLibro),
  createLibro
);

router.put(
  '/libros/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  validarBody([], reglasLibro),
  updateLibro
);

router.delete(
  '/libros/:id',
  authenticateSupabase,
  requireRole('Administrador', 'Bibliotecario'),
  validarId('id'),
  deleteLibro
);

export default router;
