import { query } from '../config/database.js';

const FROM_LISTADO = `
    FROM public.usuarios u
    JOIN public.roles r ON u.id_rol = r.id_rol
    JOIN public.estados e ON u.id_estado_usuario = e.id_estado
`;

/** Arma el WHERE y los parámetros compartidos por el listado y el conteo. `personal` excluye a los lectores. */
const construirFiltros = ({ idRol, idEstado, busqueda, personal } = {}) => {
  let where = ' WHERE 1=1';
  const params = [];

  if (idRol) {
    params.push(idRol);
    where += ` AND u.id_rol = $${params.length}`;
  }

  if (idEstado) {
    params.push(idEstado);
    where += ` AND u.id_estado_usuario = $${params.length}`;
  }

  if (personal) {
    where += ` AND r.nombre_rol <> 'Lector'`;
  }

  if (busqueda) {
    params.push(`%${busqueda}%`);
    where += ` AND (u.nombrecompleto_usuario ILIKE $${params.length} OR u.correo_usuario ILIKE $${params.length} OR u.documento_usuario ILIKE $${params.length})`;
  }

  return { where, params };
};

export const findAll = async ({ limit = 50, offset = 0, ...filtros } = {}) => {
  const { where, params } = construirFiltros(filtros);
  params.push(limit, offset);
  const text = `
    SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.id_estado_usuario, e.codigo_estado, e.nombre_estado,
           u.nombrecompleto_usuario, u.correo_usuario, u.documento_usuario, u.telefono_usuario,
           u.fecharegistro_usuario, u.fechaultimaactualizacion_usuario
    ${FROM_LISTADO} ${where}
    ORDER BY u.nombrecompleto_usuario ASC LIMIT $${params.length - 1} OFFSET $${params.length};`;
  const res = await query(text, params);
  return res.rows;
};

export const count = async (filtros = {}) => {
  const { where, params } = construirFiltros(filtros);
  const res = await query(`SELECT COUNT(*)::int AS total ${FROM_LISTADO} ${where};`, params);
  return res.rows[0].total;
};

export const findById = async (id) => {
  const text = `
    SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.id_estado_usuario, e.codigo_estado, e.nombre_estado,
           u.nombrecompleto_usuario, u.correo_usuario, u.documento_usuario, u.telefono_usuario,
           u.fecharegistro_usuario, u.fechaultimaactualizacion_usuario
    FROM public.usuarios u
    JOIN public.roles r ON u.id_rol = r.id_rol
    JOIN public.estados e ON u.id_estado_usuario = e.id_estado
    WHERE u.id_usuario = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const updatePerfil = async (id, { nombre, documento, telefono }) => {
  const text = `
    UPDATE public.usuarios
    SET nombrecompleto_usuario = COALESCE($2, nombrecompleto_usuario),
        documento_usuario = COALESCE($3, documento_usuario),
        telefono_usuario = COALESCE($4, telefono_usuario),
        fechaultimaactualizacion_usuario = CURRENT_TIMESTAMP
    WHERE id_usuario = $1
    RETURNING *;
  `;
  const res = await query(text, [id, nombre, documento, telefono]);
  return res.rows[0] || null;
};

export const updateRolEstado = async (id, { idRol, idEstado }) => {
  const text = `
    UPDATE public.usuarios
    SET id_rol = COALESCE($2, id_rol),
        id_estado_usuario = COALESCE($3, id_estado_usuario),
        fechaultimaactualizacion_usuario = CURRENT_TIMESTAMP
    WHERE id_usuario = $1
    RETURNING *;
  `;
  const res = await query(text, [id, idRol, idEstado]);
  return res.rows[0] || null;
};
