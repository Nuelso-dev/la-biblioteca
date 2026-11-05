import { query } from '../config/database.js';

export const associate = async (idLibro, idAutor) => {
  const text = `
    INSERT INTO public.libros_autores (id_libro, id_autor)
    VALUES ($1, $2)
    ON CONFLICT (id_libro, id_autor) DO NOTHING
    RETURNING *;
  `;
  const res = await query(text, [idLibro, idAutor]);
  return res.rows[0] || null;
};

export const disassociate = async (idLibro, idAutor) => {
  const text = 'DELETE FROM public.libros_autores WHERE id_libro = $1 AND id_autor = $2 RETURNING *;';
  const res = await query(text, [idLibro, idAutor]);
  return res.rows[0] || null;
};

export const findByLibro = async (idLibro) => {
  const text = `
    SELECT a.*
    FROM public.autores a
    JOIN public.libros_autores la ON a.id_autor = la.id_autor
    WHERE la.id_libro = $1
    ORDER BY a.nombrecompleto_autor ASC;
  `;
  const res = await query(text, [idLibro]);
  return res.rows;
};
