import { query } from '../config/database.js';

const SELECT_LISTADO = `
    SELECT
      m.id_multa,
      m.id_prestamo,
      p.id_usuario,
      u.nombrecompleto_usuario,
      u.correo_usuario,
      l.titulo_libro,
      ej.codinterno_ejemplar,
      m.id_estado_multa,
      e.codigo_estado,
      e.nombre_estado,
      m.motivo_multa,
      m.diasretraso_multa,
      m.valor_multa,
      m.fechageneracion_multa,
      m.fechapago_multa,
      m.observaciones_multa
`;

const FROM_LISTADO = `
    FROM public.multas m
    JOIN public.prestamos p ON m.id_prestamo = p.id_prestamo
    JOIN public.usuarios u ON p.id_usuario = u.id_usuario
    JOIN public.ejemplares ej ON p.id_ejemplar = ej.id_ejemplar
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.estados e ON m.id_estado_multa = e.id_estado
`;

/**
 * Arma el WHERE y los parámetros compartidos por el listado y el conteo.
 * `codigoEstado` filtra por código (p. ej. PENDIENTE) sin necesidad de conocer el id del estado.
 */
const construirFiltros = ({ idUsuario, idEstado, codigoEstado, busqueda } = {}) => {
  let where = ' WHERE 1=1';
  const params = [];

  if (idUsuario) {
    params.push(idUsuario);
    where += ` AND p.id_usuario = $${params.length}`;
  }

  if (idEstado) {
    params.push(idEstado);
    where += ` AND m.id_estado_multa = $${params.length}`;
  }

  if (codigoEstado) {
    params.push(codigoEstado);
    where += ` AND e.codigo_estado = $${params.length}`;
  }

  if (busqueda) {
    params.push(`%${busqueda}%`);
    where += ` AND (l.titulo_libro ILIKE $${params.length} OR u.nombrecompleto_usuario ILIKE $${params.length} OR u.correo_usuario ILIKE $${params.length} OR ej.codinterno_ejemplar ILIKE $${params.length})`;
  }

  return { where, params };
};

export const findAll = async ({ limit = 50, offset = 0, ...filtros } = {}) => {
  const { where, params } = construirFiltros(filtros);
  params.push(limit, offset);
  const text = `${SELECT_LISTADO} ${FROM_LISTADO} ${where} ORDER BY m.fechageneracion_multa DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;
  const res = await query(text, params);
  return res.rows;
};

export const count = async (filtros = {}) => {
  const { where, params } = construirFiltros(filtros);
  const res = await query(`SELECT COUNT(*)::int AS total ${FROM_LISTADO} ${where};`, params);
  return res.rows[0].total;
};

/** Suma el valor de las multas que cumplen los filtros (saldo pendiente del panel). */
export const sumarValor = async (filtros = {}) => {
  const { where, params } = construirFiltros(filtros);
  const res = await query(`SELECT COALESCE(SUM(m.valor_multa), 0)::float AS total ${FROM_LISTADO} ${where};`, params);
  return res.rows[0].total;
};

export const findById = async (id) => {
  const text = `
    SELECT 
      m.id_multa,
      m.id_prestamo,
      p.id_usuario,
      u.nombrecompleto_usuario,
      u.correo_usuario,
      l.titulo_libro,
      ej.codinterno_ejemplar,
      m.id_estado_multa,
      e.codigo_estado,
      e.nombre_estado,
      m.motivo_multa,
      m.diasretraso_multa,
      m.valor_multa,
      m.fechageneracion_multa,
      m.fechapago_multa,
      m.observaciones_multa
    FROM public.multas m
    JOIN public.prestamos p ON m.id_prestamo = p.id_prestamo
    JOIN public.usuarios u ON p.id_usuario = u.id_usuario
    JOIN public.ejemplares ej ON p.id_ejemplar = ej.id_ejemplar
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.estados e ON m.id_estado_multa = e.id_estado
    WHERE m.id_multa = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const pagar = async (idMulta, observaciones) => {
  const text = `
    UPDATE public.multas
    SET id_estado_multa = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'multa' AND codigo_estado = 'PAGADA' LIMIT 1),
        fechapago_multa = CURRENT_TIMESTAMP,
        observaciones_multa = COALESCE($2, observaciones_multa)
    WHERE id_multa = $1
    RETURNING *;
  `;
  const res = await query(text, [idMulta, observaciones || null]);
  return res.rows[0] || null;
};

export const cancelar = async (idMulta, motivo) => {
  const text = `
    UPDATE public.multas
    SET id_estado_multa = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'multa' AND codigo_estado = 'CANCELADA' LIMIT 1),
        observaciones_multa = COALESCE($2, observaciones_multa)
    WHERE id_multa = $1
    RETURNING *;
  `;
  const res = await query(text, [idMulta, motivo || null]);
  return res.rows[0] || null;
};
