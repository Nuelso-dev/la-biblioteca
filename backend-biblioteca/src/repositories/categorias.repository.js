import { query } from '../config/database.js';

export const findAll = async ({ idEstado, busqueda } = {}) => {
  let text = `
    SELECT c.*, e.nombre_estado, e.codigo_estado
    FROM public.categorias_libros c
    JOIN public.estados e ON c.id_estado_categlib = e.id_estado
    WHERE 1=1
  `;
  const params = [];

  if (idEstado) {
    params.push(idEstado);
    text += ` AND c.id_estado_categlib = $${params.length}`;
  }

  if (busqueda) {
    params.push(`%${busqueda}%`);
    text += ` AND c.nombre_categlib ILIKE $${params.length}`;
  }

  text += ' ORDER BY c.nombre_categlib ASC;';
  const res = await query(text, params);
  return res.rows;
};

export const findById = async (id) => {
  const text = `
    SELECT c.*, e.nombre_estado, e.codigo_estado
    FROM public.categorias_libros c
    JOIN public.estados e ON c.id_estado_categlib = e.id_estado
    WHERE c.id_categorias_libros = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findByNombre = async (nombre) => {
  const text = 'SELECT * FROM public.categorias_libros WHERE LOWER(TRIM(nombre_categlib)) = LOWER(TRIM($1));';
  const res = await query(text, [nombre]);
  return res.rows[0] || null;
};

export const create = async ({ nombre, descripcion, idEstado }) => {
  const estadoQuery = idEstado
    ? idEstado
    : `(SELECT id_estado FROM public.estados WHERE entidad_estado = 'categoria_libro' AND codigo_estado = 'ACTIVA' LIMIT 1)`;

  const text = `
    INSERT INTO public.categorias_libros (
      id_estado_categlib, entidad_estado_categlib, nombre_categlib, descripcion_categlib
    ) VALUES (
      ${idEstado ? '$1' : estadoQuery}, 'categoria_libro', $${idEstado ? '2' : '1'}, $${idEstado ? '3' : '2'}
    )
    RETURNING *;
  `;

  const params = idEstado ? [idEstado, nombre.trim(), descripcion || null] : [nombre.trim(), descripcion || null];
  const res = await query(text, params);
  return res.rows[0];
};

export const update = async (id, { nombre, descripcion, idEstado }) => {
  const text = `
    UPDATE public.categorias_libros
    SET nombre_categlib = COALESCE($2, nombre_categlib),
        descripcion_categlib = COALESCE($3, descripcion_categlib),
        id_estado_categlib = COALESCE($4, id_estado_categlib)
    WHERE id_categorias_libros = $1
    RETURNING *;
  `;
  const res = await query(text, [id, nombre ? nombre.trim() : null, descripcion, idEstado]);
  return res.rows[0] || null;
};

export const remove = async (id) => {
  const text = 'DELETE FROM public.categorias_libros WHERE id_categorias_libros = $1 RETURNING *;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};
