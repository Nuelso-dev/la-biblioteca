import { query } from '../config/database.js';

export const findAll = async ({ entidad, activo }) => {
  let text = 'SELECT * FROM public.estados WHERE 1=1';
  const params = [];

  if (entidad) {
    params.push(entidad.toLowerCase());
    text += ` AND entidad_estado = $${params.length}`;
  }

  if (activo !== undefined) {
    params.push(activo === 'true' || activo === true);
    text += ` AND activo_estado = $${params.length}`;
  }

  text += ' ORDER BY entidad_estado ASC, orden_estado ASC, id_estado ASC;';
  const res = await query(text, params);
  return res.rows;
};

export const findById = async (id) => {
  const text = 'SELECT * FROM public.estados WHERE id_estado = $1;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findByEntidadAndCodigo = async (entidad, codigo) => {
  const text = 'SELECT * FROM public.estados WHERE entidad_estado = $1 AND codigo_estado = $2;';
  const res = await query(text, [entidad.toLowerCase(), codigo.toUpperCase()]);
  return res.rows[0] || null;
};

export const create = async ({ entidad, codigo, nombre, descripcion, activo = true, orden }) => {
  const text = `
    INSERT INTO public.estados (entidad_estado, codigo_estado, nombre_estado, descripcion_estado, activo_estado, orden_estado)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [entidad.toLowerCase(), codigo.toUpperCase(), nombre, descripcion || null, activo, orden || null];
  const res = await query(text, values);
  return res.rows[0];
};

export const update = async (id, { nombre, descripcion, activo, orden }) => {
  const text = `
    UPDATE public.estados
    SET nombre_estado = COALESCE($1, nombre_estado),
        descripcion_estado = COALESCE($2, descripcion_estado),
        activo_estado = COALESCE($3, activo_estado),
        orden_estado = COALESCE($4, orden_estado)
    WHERE id_estado = $5
    RETURNING *;
  `;
  const values = [nombre, descripcion, activo, orden, id];
  const res = await query(text, values);
  return res.rows[0] || null;
};
