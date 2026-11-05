import { Router } from 'express';
import * as favoritosRepo from '../repositories/favoritos.repository.js';
import { authenticateSupabase } from '../middlewares/auth.js';
import { metaPaginacion } from '../utils/paginacion.js';
import { validarBody, validarId, validarPaginacion } from '../middlewares/validacion.js';

const router = Router();

// Libros favoritos del usuario autenticado
router.get('/favoritos', authenticateSupabase, validarPaginacion, async (req, res, next) => {
  try {
    const { limit, offset } = req.pagination;
    const [favoritos, total] = await Promise.all([
      favoritosRepo.findByUsuario(req.usuario.id, { limit, offset }),
      favoritosRepo.countByUsuario(req.usuario.id),
    ]);
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: favoritos });
  } catch (error) {
    next(error);
  }
});

// Ids de los libros favoritos (para marcar los corazones en el catálogo)
router.get('/favoritos/ids', authenticateSupabase, async (req, res, next) => {
  try {
    res.json({ success: true, data: await favoritosRepo.idsByUsuario(req.usuario.id) });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/favoritos',
  authenticateSupabase,
  validarBody(['idLibro'], { idLibro: 'integer' }),
  async (req, res, next) => {
    try {
      const { idLibro } = req.body;
      if (!(await favoritosRepo.libroExiste(idLibro))) {
        return res.status(404).json({ success: false, error: { message: 'El libro no existe.' } });
      }
      // Es idempotente: si ya era favorito no se duplica
      await favoritosRepo.add(req.usuario.id, idLibro);
      res.status(201).json({ success: true, data: { id_libro: idLibro }, message: 'Libro guardado en favoritos.' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/favoritos/:idLibro', authenticateSupabase, validarId('idLibro'), async (req, res, next) => {
  try {
    await favoritosRepo.remove(req.usuario.id, req.params.idLibro);
    res.json({ success: true, data: { id_libro: req.params.idLibro }, message: 'Libro quitado de favoritos.' });
  } catch (error) {
    next(error);
  }
});

export default router;
