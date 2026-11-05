import { query } from '../config/database.js';

/**
 * Inserta un registro de auditoría en la base de datos.
 */
export const create = async ({ idUsuario, idRegistro, accion, tablaAfectada, datosAnteriores, datosNuevos, ip }) => {
  const text = `
    INSERT INTO public.auditorias (
      id_usuario, idregistro_auditoria, accion_auditoria, tablaafectada_auditoria,
      datosanteriores_auditoria, datosnuevos_auditoria, direccionip_auditoria
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [
    idUsuario,
    idRegistro || null,
    accion,
    tablaAfectada,
    datosAnteriores ? JSON.stringify(datosAnteriores) : null,
    datosNuevos ? JSON.stringify(datosNuevos) : null,
    ip || null,
  ];
  const res = await query(text, values);
  return res.rows[0];
};

const FROM_LISTADO = `
    FROM public.auditorias a
    JOIN public.usuarios u ON a.id_usuario = u.id_usuario
`;

/** Arma el WHERE y los parámetros compartidos por el listado y el conteo. */
const construirFiltros = ({ tabla, idUsuario, busqueda } = {}) => {
  let where = ' WHERE 1=1';
  const params = [];

  if (tabla) {
    params.push(tabla);
    where += ` AND a.tablaafectada_auditoria ILIKE $${params.length}`;
  }

  if (idUsuario) {
    params.push(idUsuario);
    where += ` AND a.id_usuario = $${params.length}`;
  }

  if (busqueda) {
    params.push(`%${busqueda}%`);
    where += ` AND (a.accion_auditoria ILIKE $${params.length} OR u.nombrecompleto_usuario ILIKE $${params.length} OR u.correo_usuario ILIKE $${params.length})`;
  }

  return { where, params };
};

/**
 * Obtiene registros de auditoría con filtros y paginación.
 */
export const findAll = async ({ limit = 50, offset = 0, ...filtros } = {}) => {
  const { where, params } = construirFiltros(filtros);
  params.push(limit, offset);
  const text = `
    SELECT a.*, u.nombrecompleto_usuario, u.correo_usuario
    ${FROM_LISTADO} ${where}
    ORDER BY a.fecha_auditoria DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;
  const res = await query(text, params);
  return res.rows;
};

export const count = async (filtros = {}) => {
  const { where, params } = construirFiltros(filtros);
  const res = await query(`SELECT COUNT(*)::int AS total ${FROM_LISTADO} ${where};`, params);
  return res.rows[0].total;
};
