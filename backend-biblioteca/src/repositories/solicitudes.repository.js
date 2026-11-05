import pool, { query } from '../config/database.js';

const SELECT_LISTADO = `
    SELECT
      s.id_solicitud,
      s.fechasolicitud_solicitud,
      s.fecharespuesta_solicitud,
      s.observaciones_solicitud,
      s.id_estado_solicitud,
      e.codigo_estado,
      e.nombre_estado,
      s.id_usuario,
      u.nombrecompleto_usuario,
      u.correo_usuario,
      s.id_ejemplar,
      ej.codinterno_ejemplar,
      l.id_libro,
      l.titulo_libro,
      l.portada_libro,
      b.nombre_biblioteca,
      s.atendidopor_solicitud,
      at.nombrecompleto_usuario AS atendido_por_nombre
`;

const FROM_LISTADO = `
    FROM public.solicitudes s
    JOIN public.usuarios u ON s.id_usuario = u.id_usuario
    JOIN public.estados e ON s.id_estado_solicitud = e.id_estado
    JOIN public.ejemplares ej ON s.id_ejemplar = ej.id_ejemplar
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.ubicaciones ub ON ej.id_ubicacion = ub.id_ubicacion
    JOIN public.bibliotecas b ON ub.id_biblioteca = b.id_biblioteca
    LEFT JOIN public.usuarios at ON s.atendidopor_solicitud = at.id_usuario
`;

/** Solicitud que el personal aún debe atender: pendiente de respuesta o aprobada sin préstamo registrado. */
const POR_ATENDER = `(e.codigo_estado = 'PENDIENTE' OR (e.codigo_estado = 'APROBADA' AND NOT EXISTS (SELECT 1 FROM public.prestamos pr WHERE pr.id_solicitud = s.id_solicitud)))`;

/**
 * Arma el WHERE y los parámetros compartidos por el listado y el conteo.
 * `vista` = 'porAtender' | 'historial' separa la bandeja de trabajo del historial ya resuelto.
 */
const construirFiltros = ({ idUsuario, idEstado, vista, busqueda } = {}) => {
  let where = ' WHERE 1=1';
  const params = [];

  if (idUsuario) {
    params.push(idUsuario);
    where += ` AND s.id_usuario = $${params.length}`;
  }

  if (idEstado) {
    params.push(idEstado);
    where += ` AND s.id_estado_solicitud = $${params.length}`;
  }

  if (vista === 'porAtender') where += ` AND ${POR_ATENDER}`;
  if (vista === 'historial') where += ` AND NOT ${POR_ATENDER}`;

  if (busqueda) {
    params.push(`%${busqueda}%`);
    where += ` AND (l.titulo_libro ILIKE $${params.length} OR u.nombrecompleto_usuario ILIKE $${params.length} OR u.correo_usuario ILIKE $${params.length} OR ej.codinterno_ejemplar ILIKE $${params.length})`;
  }

  return { where, params };
};

export const findAll = async ({ limit = 50, offset = 0, ...filtros } = {}) => {
  const { where, params } = construirFiltros(filtros);
  params.push(limit, offset);
  const text = `${SELECT_LISTADO} ${FROM_LISTADO} ${where} ORDER BY s.fechasolicitud_solicitud DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;
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
    SELECT 
      s.id_solicitud,
      s.fechasolicitud_solicitud,
      s.fecharespuesta_solicitud,
      s.observaciones_solicitud,
      s.id_estado_solicitud,
      e.codigo_estado,
      e.nombre_estado,
      s.id_usuario,
      u.nombrecompleto_usuario,
      u.correo_usuario,
      s.id_ejemplar,
      ej.codinterno_ejemplar,
      l.id_libro,
      l.titulo_libro,
      l.portada_libro,
      b.nombre_biblioteca,
      s.atendidopor_solicitud,
      at.nombrecompleto_usuario AS atendido_por_nombre
    FROM public.solicitudes s
    JOIN public.usuarios u ON s.id_usuario = u.id_usuario
    JOIN public.estados e ON s.id_estado_solicitud = e.id_estado
    JOIN public.ejemplares ej ON s.id_ejemplar = ej.id_ejemplar
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.ubicaciones ub ON ej.id_ubicacion = ub.id_ubicacion
    JOIN public.bibliotecas b ON ub.id_biblioteca = b.id_biblioteca
    LEFT JOIN public.usuarios at ON s.atendidopor_solicitud = at.id_usuario
    WHERE s.id_solicitud = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findPendiente = async (idUsuario, idEjemplar) => {
  const text = `
    SELECT s.*
    FROM public.solicitudes s
    JOIN public.estados e ON s.id_estado_solicitud = e.id_estado
    WHERE s.id_usuario = $1 AND s.id_ejemplar = $2 AND e.codigo_estado = 'PENDIENTE';
  `;
  const res = await query(text, [idUsuario, idEjemplar]);
  return res.rows[0] || null;
};

export const create = async ({ idUsuario, idEjemplar, observaciones }) => {
  const text = `
    INSERT INTO public.solicitudes (
      id_usuario, id_ejemplar, id_estado_solicitud, entidad_estado_solicitud, observaciones_solicitud
    ) VALUES (
      $1, $2,
      (SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'PENDIENTE' LIMIT 1),
      'solicitud', $3
    )
    RETURNING *;
  `;
  const res = await query(text, [idUsuario, idEjemplar, observaciones || null]);
  return res.rows[0];
};

export const responder = async (id, { idEstado, atendidopor, observaciones }) => {
  const text = `
    UPDATE public.solicitudes
    SET id_estado_solicitud = $2,
        fecharespuesta_solicitud = CURRENT_TIMESTAMP,
        atendidopor_solicitud = $3,
        observaciones_solicitud = COALESCE($4, observaciones_solicitud)
    WHERE id_solicitud = $1
    RETURNING *;
  `;
  const res = await query(text, [id, idEstado, atendidopor, observaciones || null]);
  return res.rows[0] || null;
};

/** Error HTTP controlado para violaciones de reglas de negocio dentro de una transacción. */
const errorNegocio = (mensaje, statusCode = 409) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

/**
 * Aprueba una solicitud PENDIENTE y reserva el ejemplar en una sola transacción.
 * Bloquea la fila del ejemplar para que dos aprobaciones (o un préstamo directo) no se lo lleven a la vez.
 */
export const aprobarReservando = async (idSolicitud, { atendidopor, observaciones }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const solicitud = (
      await client.query(
        `SELECT s.id_ejemplar, e.codigo_estado
         FROM public.solicitudes s JOIN public.estados e ON s.id_estado_solicitud = e.id_estado
         WHERE s.id_solicitud = $1 FOR UPDATE OF s;`,
        [idSolicitud]
      )
    ).rows[0];
    if (!solicitud) throw errorNegocio('Solicitud no encontrada.', 404);
    if (solicitud.codigo_estado !== 'PENDIENTE') {
      throw errorNegocio(`La solicitud ya fue procesada anteriormente (estado actual: ${solicitud.codigo_estado}).`, 400);
    }

    const ejemplar = (
      await client.query(
        `SELECT e.codigo_estado, e.nombre_estado
         FROM public.ejemplares ej JOIN public.estados e ON ej.id_estado_ejemplar = e.id_estado
         WHERE ej.id_ejemplar = $1 FOR UPDATE OF ej;`,
        [solicitud.id_ejemplar]
      )
    ).rows[0];
    if (!ejemplar || ejemplar.codigo_estado !== 'DISPONIBLE') {
      throw errorNegocio(
        `No se puede aprobar: el ejemplar ya no está disponible (estado actual: ${ejemplar?.nombre_estado ?? 'inexistente'}). Rechaza la solicitud o pide otro ejemplar.`
      );
    }

    await client.query(
      `UPDATE public.ejemplares
       SET id_estado_ejemplar = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'RESERVADO' LIMIT 1)
       WHERE id_ejemplar = $1;`,
      [solicitud.id_ejemplar]
    );

    const aprobada = (
      await client.query(
        `UPDATE public.solicitudes
         SET id_estado_solicitud = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'APROBADA' LIMIT 1),
             fecharespuesta_solicitud = CURRENT_TIMESTAMP,
             atendidopor_solicitud = $2,
             observaciones_solicitud = COALESCE($3, observaciones_solicitud)
         WHERE id_solicitud = $1
         RETURNING *;`,
        [idSolicitud, atendidopor, observaciones || null]
      )
    ).rows[0];

    await client.query('COMMIT');
    return aprobada;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cancela una solicitud PENDIENTE o una APROBADA sin préstamo y, si tenía el ejemplar reservado, lo libera.
 */
export const cancelarLiberando = async (idSolicitud, { atendidopor, observaciones }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const solicitud = (
      await client.query(
        `SELECT s.id_ejemplar, e.codigo_estado,
                EXISTS (SELECT 1 FROM public.prestamos pr WHERE pr.id_solicitud = s.id_solicitud) AS tiene_prestamo
         FROM public.solicitudes s JOIN public.estados e ON s.id_estado_solicitud = e.id_estado
         WHERE s.id_solicitud = $1 FOR UPDATE OF s;`,
        [idSolicitud]
      )
    ).rows[0];
    if (!solicitud) throw errorNegocio('Solicitud no encontrada.', 404);
    if (solicitud.codigo_estado === 'APROBADA' && solicitud.tiene_prestamo) {
      throw errorNegocio('La solicitud ya tiene un préstamo registrado; registra la devolución en su lugar.', 400);
    }
    if (solicitud.codigo_estado !== 'PENDIENTE' && solicitud.codigo_estado !== 'APROBADA') {
      throw errorNegocio(`Solo se pueden cancelar solicitudes pendientes o aprobadas sin retirar. Estado actual: ${solicitud.codigo_estado}`, 400);
    }

    if (solicitud.codigo_estado === 'APROBADA') {
      await client.query(
        `UPDATE public.ejemplares
         SET id_estado_ejemplar = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'DISPONIBLE' LIMIT 1)
         WHERE id_ejemplar = $1
           AND id_estado_ejemplar = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'RESERVADO' LIMIT 1);`,
        [solicitud.id_ejemplar]
      );
    }

    const cancelada = (
      await client.query(
        `UPDATE public.solicitudes
         SET id_estado_solicitud = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'CANCELADA' LIMIT 1),
             fecharespuesta_solicitud = CURRENT_TIMESTAMP,
             atendidopor_solicitud = $2,
             observaciones_solicitud = COALESCE($3, observaciones_solicitud)
         WHERE id_solicitud = $1
         RETURNING *;`,
        [idSolicitud, atendidopor, observaciones || null]
      )
    ).rows[0];

    await client.query('COMMIT');
    return cancelada;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cancela las solicitudes PENDIENTE que llevan más de `dias` días sin respuesta.
 */
export const expirarPendientes = async (dias) => {
  const text = `
    UPDATE public.solicitudes
    SET id_estado_solicitud = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'CANCELADA' LIMIT 1),
        fecharespuesta_solicitud = CURRENT_TIMESTAMP,
        observaciones_solicitud = COALESCE(observaciones_solicitud || ' | ', '') || 'Vencida por falta de respuesta.'
    WHERE id_estado_solicitud = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'PENDIENTE' LIMIT 1)
      AND fechasolicitud_solicitud < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day');
  `;
  await query(text, [dias]);

  // Las aprobadas cuyo libro no se retiró dentro del mismo plazo se cancelan y liberan el ejemplar reservado
  const liberarReservas = `
    WITH liberadas AS (
      UPDATE public.solicitudes s
      SET id_estado_solicitud = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'CANCELADA' LIMIT 1),
          observaciones_solicitud = COALESCE(s.observaciones_solicitud || ' | ', '') || 'Reserva vencida: el libro no se retiró a tiempo.'
      WHERE s.id_estado_solicitud = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'APROBADA' LIMIT 1)
        AND s.fecharespuesta_solicitud < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
        AND NOT EXISTS (SELECT 1 FROM public.prestamos pr WHERE pr.id_solicitud = s.id_solicitud)
      RETURNING s.id_ejemplar
    )
    UPDATE public.ejemplares
    SET id_estado_ejemplar = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'DISPONIBLE' LIMIT 1)
    WHERE id_ejemplar IN (SELECT id_ejemplar FROM liberadas)
      AND id_estado_ejemplar = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'RESERVADO' LIMIT 1);
  `;
  await query(liberarReservas, [dias]);
};
