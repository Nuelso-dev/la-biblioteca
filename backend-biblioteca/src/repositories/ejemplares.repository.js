import pool, { query } from '../config/database.js';

const SELECT_LISTADO = `
    SELECT
      ej.id_ejemplar,
      ej.id_libro,
      l.titulo_libro,
      l.isbn_libro,
      l.portada_libro,
      ej.id_ubicacion,
      u.nombre_ubicacion,
      u.seccion_ubicacion,
      u.estanteria_ubicacion,
      u.id_biblioteca,
      b.nombre_biblioteca,
      ej.id_estado_ejemplar,
      e.codigo_estado,
      e.nombre_estado,
      ej.codinterno_ejemplar,
      ej.fechaadquisicion_ejemplar,
      ej.observacion_ejemplar
`;

const FROM_LISTADO = `
    FROM public.ejemplares ej
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.ubicaciones u ON ej.id_ubicacion = u.id_ubicacion
    JOIN public.bibliotecas b ON u.id_biblioteca = b.id_biblioteca
    JOIN public.estados e ON ej.id_estado_ejemplar = e.id_estado
`;

/** Arma el WHERE y los parámetros compartidos por el listado y el conteo. */
const construirFiltros = ({ idLibro, idBiblioteca, idUbicacion, idEstado, codigo } = {}) => {
  let where = ' WHERE 1=1';
  const params = [];

  if (idLibro) {
    params.push(idLibro);
    where += ` AND ej.id_libro = $${params.length}`;
  }

  if (idBiblioteca) {
    params.push(idBiblioteca);
    where += ` AND u.id_biblioteca = $${params.length}`;
  }

  if (idUbicacion) {
    params.push(idUbicacion);
    where += ` AND ej.id_ubicacion = $${params.length}`;
  }

  if (idEstado) {
    params.push(idEstado);
    where += ` AND ej.id_estado_ejemplar = $${params.length}`;
  }

  if (codigo) {
    params.push(`%${codigo}%`);
    where += ` AND (ej.codinterno_ejemplar ILIKE $${params.length} OR l.titulo_libro ILIKE $${params.length})`;
  }

  return { where, params };
};

export const findAll = async ({ limit = 50, offset = 0, ...filtros } = {}) => {
  const { where, params } = construirFiltros(filtros);
  params.push(limit, offset);
  const text = `${SELECT_LISTADO} ${FROM_LISTADO} ${where} ORDER BY ej.id_ejemplar DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;
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
      ej.id_ejemplar,
      ej.id_libro,
      l.titulo_libro,
      l.isbn_libro,
      l.portada_libro,
      ej.id_ubicacion,
      u.nombre_ubicacion,
      u.seccion_ubicacion,
      u.estanteria_ubicacion,
      u.id_biblioteca,
      b.nombre_biblioteca,
      ej.id_estado_ejemplar,
      e.codigo_estado,
      e.nombre_estado,
      ej.codinterno_ejemplar,
      ej.fechaadquisicion_ejemplar,
      ej.observacion_ejemplar
    FROM public.ejemplares ej
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.ubicaciones u ON ej.id_ubicacion = u.id_ubicacion
    JOIN public.bibliotecas b ON u.id_biblioteca = b.id_biblioteca
    JOIN public.estados e ON ej.id_estado_ejemplar = e.id_estado
    WHERE ej.id_ejemplar = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findByCodigo = async (codigo) => {
  if (!codigo) return null;
  const text = 'SELECT * FROM public.ejemplares WHERE LOWER(TRIM(codinterno_ejemplar)) = LOWER(TRIM($1));';
  const res = await query(text, [codigo]);
  return res.rows[0] || null;
};

export const create = async (data) => {
  const estadoQuery = data.idEstado
    ? data.idEstado
    : `(SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'DISPONIBLE' LIMIT 1)`;

  const text = `
    INSERT INTO public.ejemplares (
      id_libro, id_ubicacion, id_estado_ejemplar, entidad_estado_ejemplar,
      codinterno_ejemplar, fechaadquisicion_ejemplar, observacion_ejemplar
    ) VALUES (
      $1, $2, ${data.idEstado ? '$3' : estadoQuery}, 'ejemplar',
      $${data.idEstado ? '4' : '3'}, $${data.idEstado ? '5' : '4'}, $${data.idEstado ? '6' : '5'}
    )
    RETURNING *;
  `;

  const params = data.idEstado
    ? [data.idLibro, data.idUbicacion, data.idEstado, data.codigoInterno, data.fechaAdquisicion || null, data.observacion || null]
    : [data.idLibro, data.idUbicacion, data.codigoInterno, data.fechaAdquisicion || null, data.observacion || null];

  const res = await query(text, params);
  return res.rows[0];
};

/**
 * Inserta varios ejemplares en una sola transacción: o se crean todos o ninguno.
 * Sin idEstado, cada uno queda DISPONIBLE.
 */
export const createLote = async (items) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const creados = [];
    for (const item of items) {
      const res = await client.query(
        `INSERT INTO public.ejemplares (
           id_libro, id_ubicacion, id_estado_ejemplar, entidad_estado_ejemplar,
           codinterno_ejemplar, fechaadquisicion_ejemplar, observacion_ejemplar
         ) VALUES (
           $1, $2,
           COALESCE($3::int, (SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'DISPONIBLE' LIMIT 1)),
           'ejemplar', $4, $5, $6
         )
         RETURNING *;`,
        [item.idLibro, item.idUbicacion, item.idEstado || null, item.codigoInterno, item.fechaAdquisicion || null, item.observacion || null]
      );
      creados.push(res.rows[0]);
    }
    await client.query('COMMIT');
    return creados;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const update = async (id, data) => {
  const text = `
    UPDATE public.ejemplares
    SET id_ubicacion = COALESCE($2, id_ubicacion),
        id_estado_ejemplar = COALESCE($3, id_estado_ejemplar),
        codinterno_ejemplar = COALESCE($4, codinterno_ejemplar),
        fechaadquisicion_ejemplar = COALESCE($5, fechaadquisicion_ejemplar),
        observacion_ejemplar = COALESCE($6, observacion_ejemplar)
    WHERE id_ejemplar = $1
    RETURNING *;
  `;
  const params = [
    id,
    data.idUbicacion,
    data.idEstado,
    data.codigoInterno ? data.codigoInterno.trim() : null,
    data.fechaAdquisicion,
    data.observacion,
  ];
  const res = await query(text, params);
  return res.rows[0] || null;
};

/**
 * Elimina un ejemplar junto con sus solicitudes ya resueltas sin préstamo (rechazadas o canceladas),
 * que solo son historial. Si tiene préstamos o solicitudes vigentes (pendientes o aprobadas) no se toca nada.
 *
 * @returns {Promise<{ejemplar: object|null, solicitudesEliminadas: number}>}
 */
export const removeConHistorialInactivo = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const prestamos = await client.query('SELECT COUNT(*)::int AS total FROM public.prestamos WHERE id_ejemplar = $1;', [id]);
    if (prestamos.rows[0].total > 0) {
      const error = new Error('No se puede eliminar el ejemplar porque tiene préstamos registrados. Márcalo como Perdido o En mantenimiento.');
      error.statusCode = 409;
      throw error;
    }

    const vigentes = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM public.solicitudes s JOIN public.estados e ON s.id_estado_solicitud = e.id_estado
       WHERE s.id_ejemplar = $1 AND e.codigo_estado IN ('PENDIENTE', 'APROBADA');`,
      [id]
    );
    if (vigentes.rows[0].total > 0) {
      const error = new Error('No se puede eliminar el ejemplar porque tiene solicitudes pendientes o aprobadas. Resuélvelas o cancélalas primero.');
      error.statusCode = 409;
      throw error;
    }

    const solicitudes = await client.query('DELETE FROM public.solicitudes WHERE id_ejemplar = $1;', [id]);
    const ejemplar = await client.query('DELETE FROM public.ejemplares WHERE id_ejemplar = $1 RETURNING *;', [id]);

    await client.query('COMMIT');
    return { ejemplar: ejemplar.rows[0] || null, solicitudesEliminadas: solicitudes.rowCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const remove = async (id) => {
  const text = 'DELETE FROM public.ejemplares WHERE id_ejemplar = $1 RETURNING *;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};
