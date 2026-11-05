import { query } from '../config/database.js';

export const findByUsuario = async (idUsuario, { limit = 50, offset = 0 } = {}) => {
  const text = `
    SELECT 
      n.id_notificacion,
      n.id_usuario,
      n.titulo_notificacion,
      n.mensaje_notificacion,
      n.tipo_notificacion,
      n.fechacreacion_notificacion,
      n.id_estado_notificacion,
      e.codigo_estado,
      e.nombre_estado
    FROM public.notificaciones n
    JOIN public.estados e ON n.id_estado_notificacion = e.id_estado
    WHERE n.id_usuario = $1
    ORDER BY n.fechacreacion_notificacion DESC
    LIMIT $2 OFFSET $3;
  `;
  const res = await query(text, [idUsuario, limit, offset]);
  return res.rows;
};

export const contarPorUsuario = async (idUsuario) => {
  const res = await query('SELECT COUNT(*)::int AS total FROM public.notificaciones WHERE id_usuario = $1;', [idUsuario]);
  return res.rows[0].total;
};

export const findById = async (id) => {
  const text = `
    SELECT 
      n.*,
      e.codigo_estado,
      e.nombre_estado
    FROM public.notificaciones n
    JOIN public.estados e ON n.id_estado_notificacion = e.id_estado
    WHERE n.id_notificacion = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const marcarLeida = async (idNotificacion, idUsuario) => {
  const text = `
    UPDATE public.notificaciones
    SET id_estado_notificacion = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'notificacion' AND codigo_estado = 'LEIDA' LIMIT 1)
    WHERE id_notificacion = $1 AND id_usuario = $2
    RETURNING *;
  `;
  const res = await query(text, [idNotificacion, idUsuario]);
  return res.rows[0] || null;
};

export const marcarTodasLeidas = async (idUsuario) => {
  const text = `
    UPDATE public.notificaciones
    SET id_estado_notificacion = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'notificacion' AND codigo_estado = 'LEIDA' LIMIT 1)
    WHERE id_usuario = $1
    RETURNING id_notificacion;
  `;
  const res = await query(text, [idUsuario]);
  return res.rowCount;
};

export const remove = async (idNotificacion, idUsuario) => {
  const text = 'DELETE FROM public.notificaciones WHERE id_notificacion = $1 AND id_usuario = $2 RETURNING *;';
  const res = await query(text, [idNotificacion, idUsuario]);
  return res.rows[0] || null;
};

export const create = async ({ idUsuario, titulo, mensaje, tipo }) => {
  const text = `
    INSERT INTO public.notificaciones (
      id_usuario, id_estado_notificacion, entidad_estado_notificacion, titulo_notificacion, mensaje_notificacion, tipo_notificacion
    ) VALUES (
      $1,
      (SELECT id_estado FROM public.estados WHERE entidad_estado = 'notificacion' AND codigo_estado = 'NO_LEIDA' LIMIT 1),
      'notificacion', $2, $3, $4
    )
    RETURNING *;
  `;
  const res = await query(text, [idUsuario, titulo, mensaje || null, tipo || null]);
  return res.rows[0];
};

export const contarNoLeidas = async (idUsuario) => {
  const text = `
    SELECT COUNT(*)::int AS total
    FROM public.notificaciones n
    JOIN public.estados e ON n.id_estado_notificacion = e.id_estado
    WHERE n.id_usuario = $1 AND e.codigo_estado = 'NO_LEIDA';
  `;
  const res = await query(text, [idUsuario]);
  return res.rows[0].total;
};
