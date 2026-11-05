import { query } from '../config/database.js';

export const findAll = async ({ idEstado, busqueda } = {}) => {
  let text = `
    SELECT ed.*, e.nombre_estado, e.codigo_estado
    FROM public.editoriales ed
    JOIN public.estados e ON ed.id_estado_editorial = e.id_estado
    WHERE 1=1
  `;
  const params = [];

  if (idEstado) {
    params.push(idEstado);
    text += ` AND ed.id_estado_editorial = $${params.length}`;
  }

  if (busqueda) {
    params.push(`%${busqueda}%`);
    text += ` AND ed.nombre_editorial ILIKE $${params.length}`;
  }

  text += ' ORDER BY ed.nombre_editorial ASC;';
  const res = await query(text, params);
  return res.rows;
};

export const findById = async (id) => {
  const text = `
    SELECT ed.*, e.nombre_estado, e.codigo_estado
    FROM public.editoriales ed
    JOIN public.estados e ON ed.id_estado_editorial = e.id_estado
    WHERE ed.id_editorial = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findByNombre = async (nombre) => {
  const text = 'SELECT * FROM public.editoriales WHERE LOWER(TRIM(nombre_editorial)) = LOWER(TRIM($1));';
  const res = await query(text, [nombre]);
  return res.rows[0] || null;
};

export const create = async ({ nombre, pais, idEstado }) => {
  const estadoQuery = idEstado
    ? idEstado
    : `(SELECT id_estado FROM public.estados WHERE entidad_estado = 'editorial' AND codigo_estado = 'ACTIVA' LIMIT 1)`;

  const text = `
    INSERT INTO public.editoriales (id_estado_editorial, entidad_estado_editorial, nombre_editorial, pais_editorial)
    VALUES (${idEstado ? '$1' : estadoQuery}, 'editorial', $${idEstado ? '2' : '1'}, $${idEstado ? '3' : '2'})
    RETURNING *;
  `;

  const params = idEstado ? [idEstado, nombre.trim(), pais || null] : [nombre.trim(), pais || null];
  const res = await query(text, params);
  return res.rows[0];
};

export const update = async (id, { nombre, pais, idEstado }) => {
  const text = `
    UPDATE public.editoriales
    SET nombre_editorial = COALESCE($2, nombre_editorial),
        pais_editorial = COALESCE($3, pais_editorial),
        id_estado_editorial = COALESCE($4, id_estado_editorial)
    WHERE id_editorial = $1
    RETURNING *;
  `;
  const res = await query(text, [id, nombre ? nombre.trim() : null, pais, idEstado]);
  return res.rows[0] || null;
};

export const remove = async (id) => {
  const text = 'DELETE FROM public.editoriales WHERE id_editorial = $1 RETURNING *;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};
