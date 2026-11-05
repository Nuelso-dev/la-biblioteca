import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticateSupabase, requireRole } from '../middlewares/auth.js';

const router = Router();

const soloPersonal = [authenticateSupabase, requireRole('Administrador', 'Bibliotecario')];

/**
 * Imágenes del bucket público `covers` con los libros que usan cada una.
 * Sirve tanto al selector de portadas del formulario de libros como a la gestión de portadas.
 */
router.get('/storage/portadas', ...soloPersonal, async (req, res, next) => {
  try {
    const busqueda = typeof req.query.busqueda === 'string' && req.query.busqueda.trim() ? req.query.busqueda.trim() : null;
    const result = await query(
      `SELECT o.name,
              (o.metadata->>'size')::bigint AS size,
              o.created_at,
              COALESCE(
                json_agg(json_build_object('id_libro', l.id_libro, 'titulo', l.titulo_libro) ORDER BY l.titulo_libro)
                  FILTER (WHERE l.id_libro IS NOT NULL),
                '[]'
              ) AS libros
       FROM storage.objects o
       LEFT JOIN public.libros l ON l.portada_libro IN (o.name, 'covers/' || o.name)
       WHERE o.bucket_id = 'covers'
         AND o.name NOT LIKE '%.emptyFolderPlaceholder'
         AND ($1::text IS NULL OR o.name ILIKE '%' || $1 || '%')
       GROUP BY o.id, o.name, o.metadata, o.created_at
       ORDER BY o.name ASC
       LIMIT 2000;`,
      [busqueda]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * Libros cuya portada apunta a un archivo que ya no existe en el bucket.
 */
router.get('/storage/portadas/faltantes', ...soloPersonal, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT l.id_libro, l.titulo_libro, l.portada_libro
       FROM public.libros l
       WHERE l.portada_libro IS NOT NULL
         AND l.portada_libro <> ''
         AND l.portada_libro NOT LIKE 'http%'
         AND NOT EXISTS (
           SELECT 1 FROM storage.objects o
           WHERE o.bucket_id = 'covers' AND l.portada_libro IN (o.name, 'covers/' || o.name)
         )
       ORDER BY l.titulo_libro ASC;`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
