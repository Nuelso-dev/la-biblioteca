import { query } from '../config/database.js';

export const findAll = async ({ busqueda, limit = 50, offset = 0 } = {}) => {
  let text = `
    SELECT 
      a.id_autor,
      a.nombrecompleto_autor,
      a.biografia_autor,
      a.fechanacimiento_autor,
      COUNT(la.id_libro)::int AS libros_count
    FROM public.autores a
    LEFT JOIN public.libros_autores la ON a.id_autor = la.id_autor
    WHERE 1=1
  `;
  const params = [];

  if (busqueda) {
    params.push(`%${busqueda}%`);
    text += ` AND a.nombrecompleto_autor ILIKE $${params.length}`;
  }

  text += ` GROUP BY a.id_autor ORDER BY a.nombrecompleto_autor ASC`;
  params.push(limit, offset);
  text += ` LIMIT $${params.length - 1} OFFSET $${params.length};`;

  const res = await query(text, params);
  return res.rows;
};

export const findById = async (id) => {
  const text = `
    SELECT 
      a.id_autor,
      a.nombrecompleto_autor,
      a.biografia_autor,
      a.fechanacimiento_autor,
      COALESCE(
        json_agg(
          json_build_object('id_libro', l.id_libro, 'titulo', l.titulo_libro, 'portada', l.portada_libro)
        ) FILTER (WHERE l.id_libro IS NOT NULL), '[]'
      ) AS libros
    FROM public.autores a
    LEFT JOIN public.libros_autores la ON a.id_autor = la.id_autor
    LEFT JOIN public.libros l ON la.id_libro = l.id_libro
    WHERE a.id_autor = $1
    GROUP BY a.id_autor;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findByNombre = async (nombre) => {
  const text = 'SELECT * FROM public.autores WHERE LOWER(TRIM(nombrecompleto_autor)) = LOWER(TRIM($1));';
  const res = await query(text, [nombre]);
  return res.rows[0] || null;
};

export const create = async ({ nombre, biografia, fechaNacimiento }) => {
  const text = `
    INSERT INTO public.autores (nombrecompleto_autor, biografia_autor, fechanacimiento_autor)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const res = await query(text, [nombre.trim(), biografia || null, fechaNacimiento || null]);
  return res.rows[0];
};

export const update = async (id, { nombre, biografia, fechaNacimiento }) => {
  const text = `
    UPDATE public.autores
    SET nombrecompleto_autor = COALESCE($2, nombrecompleto_autor),
        biografia_autor = COALESCE($3, biografia_autor),
        fechanacimiento_autor = COALESCE($4, fechanacimiento_autor)
    WHERE id_autor = $1
    RETURNING *;
  `;
  const res = await query(text, [id, nombre ? nombre.trim() : null, biografia, fechaNacimiento]);
  return res.rows[0] || null;
};

export const remove = async (id) => {
  const text = 'DELETE FROM public.autores WHERE id_autor = $1 RETURNING *;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const hasBooks = async (id) => {
  const res = await query(
    'SELECT EXISTS(SELECT 1 FROM public.libros_autores WHERE id_autor = $1) AS "hasBooks";',
    [id]
  );
  return res.rows[0].hasBooks;
};
