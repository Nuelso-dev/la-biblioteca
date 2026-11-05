import { query } from '../config/database.js';

export const findAll = async ({ idBiblioteca, idEstado } = {}) => {
  let text = `
    SELECT u.*, b.nombre_biblioteca, e.nombre_estado, e.codigo_estado
    FROM public.ubicaciones u
    JOIN public.bibliotecas b ON u.id_biblioteca = b.id_biblioteca
    JOIN public.estados e ON u.id_estado_ubicacion = e.id_estado
    WHERE 1=1
  `;
  const params = [];

  if (idBiblioteca) {
    params.push(idBiblioteca);
    text += ` AND u.id_biblioteca = $${params.length}`;
  }

  if (idEstado) {
    params.push(idEstado);
    text += ` AND u.id_estado_ubicacion = $${params.length}`;
  }

  text += ' ORDER BY b.nombre_biblioteca ASC, u.nombre_ubicacion ASC;';
  const res = await query(text, params);
  return res.rows;
};

export const findById = async (id) => {
  const text = `
    SELECT u.*, b.nombre_biblioteca, e.nombre_estado, e.codigo_estado
    FROM public.ubicaciones u
    JOIN public.bibliotecas b ON u.id_biblioteca = b.id_biblioteca
    JOIN public.estados e ON u.id_estado_ubicacion = e.id_estado
    WHERE u.id_ubicacion = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const create = async ({ idBiblioteca, nombre, seccion, estanteria, descripcion, idEstado }) => {
  const estadoQuery = idEstado
    ? idEstado
    : `(SELECT id_estado FROM public.estados WHERE entidad_estado = 'ubicacion' AND codigo_estado = 'ACTIVA' LIMIT 1)`;

  const text = `
    INSERT INTO public.ubicaciones (
      id_biblioteca, id_estado_ubicacion, entidad_estado_ubicacion,
      nombre_ubicacion, seccion_ubicacion, estanteria_ubicacion, descripcion_ubicacion
    ) VALUES (
      $1, ${idEstado ? '$2' : estadoQuery}, 'ubicacion',
      $${idEstado ? '3' : '2'}, $${idEstado ? '4' : '3'}, $${idEstado ? '5' : '4'}, $${idEstado ? '6' : '5'}
    )
    RETURNING *;
  `;

  const params = idEstado
    ? [idBiblioteca, idEstado, nombre, seccion || null, estanteria || null, descripcion || null]
    : [idBiblioteca, nombre, seccion || null, estanteria || null, descripcion || null];

  const res = await query(text, params);
  return res.rows[0];
};

export const update = async (id, { idBiblioteca, nombre, seccion, estanteria, descripcion, idEstado }) => {
  const text = `
    UPDATE public.ubicaciones
    SET id_biblioteca = COALESCE($2, id_biblioteca),
        nombre_ubicacion = COALESCE($3, nombre_ubicacion),
        seccion_ubicacion = COALESCE($4, seccion_ubicacion),
        estanteria_ubicacion = COALESCE($5, estanteria_ubicacion),
        descripcion_ubicacion = COALESCE($6, descripcion_ubicacion),
        id_estado_ubicacion = COALESCE($7, id_estado_ubicacion)
    WHERE id_ubicacion = $1
    RETURNING *;
  `;
  const params = [id, idBiblioteca, nombre, seccion, estanteria, descripcion, idEstado];
  const res = await query(text, params);
  return res.rows[0] || null;
};

export const remove = async (id) => {
  const text = 'DELETE FROM public.ubicaciones WHERE id_ubicacion = $1 RETURNING *;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};
