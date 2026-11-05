import { query } from '../config/database.js';

export const findAll = async ({ idEstado, activo } = {}) => {
  let text = `
    SELECT b.*, e.codigo_estado, e.nombre_estado, e.activo_estado
    FROM public.bibliotecas b
    JOIN public.estados e ON b.id_estado_biblioteca = e.id_estado
    WHERE 1=1
  `;
  const params = [];

  if (idEstado) {
    params.push(idEstado);
    text += ` AND b.id_estado_biblioteca = $${params.length}`;
  }

  if (activo !== undefined) {
    params.push(activo === 'true' || activo === true);
    text += ` AND e.activo_estado = $${params.length}`;
  }

  text += ' ORDER BY b.nombre_biblioteca ASC;';
  const res = await query(text, params);
  return res.rows;
};

export const findById = async (id) => {
  const text = `
    SELECT b.*, e.codigo_estado, e.nombre_estado, e.activo_estado
    FROM public.bibliotecas b
    JOIN public.estados e ON b.id_estado_biblioteca = e.id_estado
    WHERE b.id_biblioteca = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const create = async ({ nombre, direccion, telefono, descripcion, latitud, longitud, idEstado }) => {
  // Sin idEstado la sede queda ACTIVA
  const text = `
    INSERT INTO public.bibliotecas (
      id_estado_biblioteca, entidad_estado_biblioteca, nombre_biblioteca,
      direccion_biblioteca, telefono_biblioteca, descripcion_biblioteca,
      latitud_biblioteca, longitud_biblioteca
    ) VALUES (
      COALESCE($1::int, (SELECT id_estado FROM public.estados WHERE entidad_estado = 'biblioteca' AND codigo_estado = 'ACTIVA' LIMIT 1)),
      'biblioteca', $2, $3, $4, $5, $6, $7
    )
    RETURNING *;
  `;
  const params = [idEstado || null, nombre, direccion || null, telefono || null, descripcion || null, latitud ?? null, longitud ?? null];
  const res = await query(text, params);
  return res.rows[0];
};

export const update = async (id, { nombre, direccion, telefono, descripcion, latitud, longitud, quitarUbicacion, idEstado }) => {
  const text = `
    UPDATE public.bibliotecas
    SET nombre_biblioteca = COALESCE($2, nombre_biblioteca),
        direccion_biblioteca = COALESCE($3, direccion_biblioteca),
        telefono_biblioteca = COALESCE($4, telefono_biblioteca),
        descripcion_biblioteca = COALESCE($5, descripcion_biblioteca),
        id_estado_biblioteca = COALESCE($6, id_estado_biblioteca),
        latitud_biblioteca = CASE WHEN $9::boolean THEN NULL ELSE COALESCE($7::numeric, latitud_biblioteca) END,
        longitud_biblioteca = CASE WHEN $9::boolean THEN NULL ELSE COALESCE($8::numeric, longitud_biblioteca) END
    WHERE id_biblioteca = $1
    RETURNING *;
  `;
  const params = [id, nombre, direccion, telefono, descripcion, idEstado, latitud ?? null, longitud ?? null, quitarUbicacion === true];
  const res = await query(text, params);
  return res.rows[0] || null;
};

export const remove = async (id) => {
  const text = 'DELETE FROM public.bibliotecas WHERE id_biblioteca = $1 RETURNING *;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};
