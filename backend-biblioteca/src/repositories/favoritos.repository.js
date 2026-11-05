import { query } from '../config/database.js';

export const findByUsuario = async (idUsuario, { limit = 50, offset = 0 } = {}) => {
  const text = `
    SELECT
      f.id_favorito,
      f.id_libro,
      f.fechacreacion_favorito,
      l.titulo_libro,
      l.portada_libro,
      c.nombre_categlib AS categoria,
      COALESCE(STRING_AGG(DISTINCT a.nombrecompleto_autor, ', '), 'Sin autor asignado') AS autor,
      COUNT(DISTINCT ej.id_ejemplar) FILTER (WHERE es.codigo_estado = 'DISPONIBLE')::int AS ejemplares_disponibles
    FROM public.favoritos f
    JOIN public.libros l ON l.id_libro = f.id_libro
    JOIN public.categorias_libros c ON c.id_categorias_libros = l.id_categoria
    LEFT JOIN public.libros_autores la ON la.id_libro = l.id_libro
    LEFT JOIN public.autores a ON a.id_autor = la.id_autor
    LEFT JOIN public.ejemplares ej ON ej.id_libro = l.id_libro
    LEFT JOIN public.estados es ON es.id_estado = ej.id_estado_ejemplar
    WHERE f.id_usuario = $1
    GROUP BY f.id_favorito, l.id_libro, c.nombre_categlib
    ORDER BY f.fechacreacion_favorito DESC
    LIMIT $2 OFFSET $3;
  `;
  const res = await query(text, [idUsuario, limit, offset]);
  return res.rows;
};

export const countByUsuario = async (idUsuario) => {
  const res = await query('SELECT COUNT(*)::int AS total FROM public.favoritos WHERE id_usuario = $1;', [idUsuario]);
  return res.rows[0].total;
};

/** Solo los ids de los libros favoritos: alcanza para marcar los corazones sin traer cada ficha. */
export const idsByUsuario = async (idUsuario) => {
  const res = await query('SELECT id_libro FROM public.favoritos WHERE id_usuario = $1;', [idUsuario]);
  return res.rows.map((r) => r.id_libro);
};

export const libroExiste = async (idLibro) => {
  const res = await query('SELECT 1 FROM public.libros WHERE id_libro = $1;', [idLibro]);
  return res.rowCount > 0;
};

export const add = async (idUsuario, idLibro) => {
  const text = `
    INSERT INTO public.favoritos (id_usuario, id_libro)
    VALUES ($1, $2)
    ON CONFLICT (id_usuario, id_libro) DO NOTHING
    RETURNING *;
  `;
  const res = await query(text, [idUsuario, idLibro]);
  return res.rows[0] || null;
};

export const remove = async (idUsuario, idLibro) => {
  const res = await query('DELETE FROM public.favoritos WHERE id_usuario = $1 AND id_libro = $2 RETURNING *;', [idUsuario, idLibro]);
  return res.rows[0] || null;
};
