import pool, { query } from '../config/database.js';

const SELECT_LISTADO = `
    SELECT 
      p.id_prestamo,
      p.id_solicitud,
      p.id_usuario,
      u.nombrecompleto_usuario,
      u.correo_usuario,
      p.id_ejemplar,
      ej.codinterno_ejemplar,
      l.id_libro,
      l.titulo_libro,
      l.isbn_libro,
      l.portada_libro,
      b.nombre_biblioteca,
      p.id_estado_prestamo,
      e.codigo_estado,
      e.nombre_estado,
      p.fechaprestamo_prestamo,
      p.fechavencimiento_prestamo,
      p.fechadevolucion_prestamo,
      p.observaciones_prestamo,
      p.registradopor_prestamo,
      reg.nombrecompleto_usuario AS registrado_por_nombre
`;

const FROM_LISTADO = `
    FROM public.prestamos p
    JOIN public.usuarios u ON p.id_usuario = u.id_usuario
    JOIN public.ejemplares ej ON p.id_ejemplar = ej.id_ejemplar
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.ubicaciones ub ON ej.id_ubicacion = ub.id_ubicacion
    JOIN public.bibliotecas b ON ub.id_biblioteca = b.id_biblioteca
    JOIN public.estados e ON p.id_estado_prestamo = e.id_estado
    JOIN public.usuarios reg ON p.registradopor_prestamo = reg.id_usuario
`;

/**
 * Arma el WHERE y los parámetros compartidos por el listado y el conteo.
 * `abiertos` limita a préstamos ACTIVO o VENCIDO; `busqueda` cruza libro, lector y código del ejemplar.
 */
const construirFiltros = ({ idUsuario, idEstado, abiertos, busqueda } = {}) => {
  let where = ' WHERE 1=1';
  const params = [];

  if (idUsuario) {
    params.push(idUsuario);
    where += ` AND p.id_usuario = $${params.length}`;
  }

  if (idEstado) {
    params.push(idEstado);
    where += ` AND p.id_estado_prestamo = $${params.length}`;
  }

  if (abiertos) {
    where += ` AND e.codigo_estado IN ('ACTIVO', 'VENCIDO')`;
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
  const text = `${SELECT_LISTADO} ${FROM_LISTADO} ${where} ORDER BY p.fechaprestamo_prestamo DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;
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
      p.id_prestamo,
      p.id_solicitud,
      p.id_usuario,
      u.nombrecompleto_usuario,
      u.correo_usuario,
      p.id_ejemplar,
      ej.codinterno_ejemplar,
      l.id_libro,
      l.titulo_libro,
      l.isbn_libro,
      l.portada_libro,
      b.nombre_biblioteca,
      p.id_estado_prestamo,
      e.codigo_estado,
      e.nombre_estado,
      p.fechaprestamo_prestamo,
      p.fechavencimiento_prestamo,
      p.fechadevolucion_prestamo,
      p.observaciones_prestamo,
      p.registradopor_prestamo,
      reg.nombrecompleto_usuario AS registrado_por_nombre
    FROM public.prestamos p
    JOIN public.usuarios u ON p.id_usuario = u.id_usuario
    JOIN public.ejemplares ej ON p.id_ejemplar = ej.id_ejemplar
    JOIN public.libros l ON ej.id_libro = l.id_libro
    JOIN public.ubicaciones ub ON ej.id_ubicacion = ub.id_ubicacion
    JOIN public.bibliotecas b ON ub.id_biblioteca = b.id_biblioteca
    JOIN public.estados e ON p.id_estado_prestamo = e.id_estado
    JOIN public.usuarios reg ON p.registradopor_prestamo = reg.id_usuario
    WHERE p.id_prestamo = $1;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findPrestamoActivoByEjemplar = async (idEjemplar) => {
  const text = `
    SELECT p.*
    FROM public.prestamos p
    JOIN public.estados e ON p.id_estado_prestamo = e.id_estado
    WHERE p.id_ejemplar = $1 AND e.codigo_estado = 'ACTIVO';
  `;
  const res = await query(text, [idEjemplar]);
  return res.rows[0] || null;
};

export const create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Bloquea el ejemplar para que dos préstamos simultáneos no se lo lleven a la vez
    const ejemplar = (
      await client.query(
        `SELECT e.codigo_estado, e.nombre_estado
         FROM public.ejemplares ej JOIN public.estados e ON ej.id_estado_ejemplar = e.id_estado
         WHERE ej.id_ejemplar = $1 FOR UPDATE OF ej;`,
        [data.idEjemplar]
      )
    ).rows[0];
    const reservadoParaEstaSolicitud = ejemplar?.codigo_estado === 'RESERVADO' && data.idSolicitud;
    if (!ejemplar || (ejemplar.codigo_estado !== 'DISPONIBLE' && !reservadoParaEstaSolicitud)) {
      const error = new Error(
        ejemplar?.codigo_estado === 'RESERVADO'
          ? 'El ejemplar está reservado para otro lector.'
          : `El ejemplar no está disponible para préstamo (estado actual: ${ejemplar?.nombre_estado ?? 'inexistente'}).`
      );
      error.statusCode = 409;
      throw error;
    }

    // Obtener ID estado 'ACTIVO' para prestamo
    const estadoPrestamoId = (
      await client.query("SELECT id_estado FROM public.estados WHERE entidad_estado = 'prestamo' AND codigo_estado = 'ACTIVO' LIMIT 1")
    ).rows[0].id_estado;

    // Obtener ID estado 'PRESTADO' para ejemplar
    const estadoEjemplarId = (
      await client.query("SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'PRESTADO' LIMIT 1")
    ).rows[0].id_estado;

    const insertText = `
      INSERT INTO public.prestamos (
        id_solicitud, id_usuario, id_ejemplar, id_estado_prestamo, entidad_estado_prestamo,
        observaciones_prestamo, registradopor_prestamo, fechavencimiento_prestamo
      ) VALUES ($1, $2, $3, $4, 'prestamo', $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      data.idSolicitud || null,
      data.idUsuario,
      data.idEjemplar,
      estadoPrestamoId,
      data.observaciones || null,
      data.registradoPor,
      data.fechaVencimiento,
    ];
    const prestamoRes = await client.query(insertText, values);
    const nuevoPrestamo = prestamoRes.rows[0];

    // Actualizar estado del ejemplar a 'PRESTADO'
    await client.query(
      'UPDATE public.ejemplares SET id_estado_ejemplar = $1 WHERE id_ejemplar = $2;',
      [estadoEjemplarId, data.idEjemplar]
    );

    // Si provenía de solicitud, actualizarla a 'APROBADA' si aún no lo estaba
    if (data.idSolicitud) {
      const estadoAprobada = (
        await client.query("SELECT id_estado FROM public.estados WHERE entidad_estado = 'solicitud' AND codigo_estado = 'APROBADA' LIMIT 1")
      ).rows[0].id_estado;
      await client.query(
        'UPDATE public.solicitudes SET id_estado_solicitud = $1 WHERE id_solicitud = $2;',
        [estadoAprobada, data.idSolicitud]
      );
    }

    await client.query('COMMIT');
    return nuevoPrestamo;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const registrarDevolucion = async (idPrestamo, observaciones) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener datos del préstamo actual
    const prestamoRes = await client.query(
      `SELECT p.*, e.codigo_estado 
       FROM public.prestamos p 
       JOIN public.estados e ON p.id_estado_prestamo = e.id_estado 
       WHERE p.id_prestamo = $1 FOR UPDATE;`,
      [idPrestamo]
    );
    const prestamo = prestamoRes.rows[0];
    if (!prestamo) {
      const error = new Error('Préstamo no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (prestamo.codigo_estado !== 'ACTIVO' && prestamo.codigo_estado !== 'VENCIDO') {
      const error = new Error(`El préstamo ya fue devuelto o cerrado (estado actual: ${prestamo.codigo_estado}).`);
      error.statusCode = 400;
      throw error;
    }

    // IDs de estados
    const idEstadoDevuelto = (
      await client.query("SELECT id_estado FROM public.estados WHERE entidad_estado = 'prestamo' AND codigo_estado = 'DEVUELTO' LIMIT 1")
    ).rows[0].id_estado;

    const idEstadoDisponible = (
      await client.query("SELECT id_estado FROM public.estados WHERE entidad_estado = 'ejemplar' AND codigo_estado = 'DISPONIBLE' LIMIT 1")
    ).rows[0].id_estado;

    // Actualizar préstamo a DEVUELTO
    const updatePrestamoRes = await client.query(
      `UPDATE public.prestamos 
       SET id_estado_prestamo = $1, 
           fechadevolucion_prestamo = CURRENT_TIMESTAMP,
           observaciones_prestamo = COALESCE($2, observaciones_prestamo)
       WHERE id_prestamo = $3
       RETURNING *;`,
      [idEstadoDevuelto, observaciones, idPrestamo]
    );

    // Actualizar ejemplar a DISPONIBLE
    await client.query(
      'UPDATE public.ejemplares SET id_estado_ejemplar = $1 WHERE id_ejemplar = $2;',
      [idEstadoDisponible, prestamo.id_ejemplar]
    );

    // Verificar si hubo retraso en la devolución y generar multa automática si aplica
    let multaGenerada = null;
    const ahora = new Date();
    const fechaVencimiento = new Date(prestamo.fechavencimiento_prestamo);

    if (ahora > fechaVencimiento) {
      const diffMs = ahora - fechaVencimiento;
      const diasRetraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diasRetraso > 0) {
        // Consultar tarifa diaria de multa desde configuraciones o valor base (ej: 2000 por día)
        const configTarifaRes = await client.query(
          "SELECT valor_configuracion FROM public.configuraciones WHERE clave_configuracion = 'TARIFA_MULTA_DIARIA';"
        );
        const tarifaDiaria = parseFloat(configTarifaRes.rows[0]?.valor_configuracion) || 2000.0;
        const valorMulta = diasRetraso * tarifaDiaria;

        const idEstadoMultaPendiente = (
          await client.query("SELECT id_estado FROM public.estados WHERE entidad_estado = 'multa' AND codigo_estado = 'PENDIENTE' LIMIT 1")
        ).rows[0].id_estado;

        const insertMultaRes = await client.query(
          `INSERT INTO public.multas (
            id_prestamo, id_estado_multa, entidad_estado_multa, motivo_multa,
            diasretraso_multa, valor_multa
          ) VALUES ($1, $2, 'multa', $3, $4, $5)
          RETURNING *;`,
          [
            idPrestamo,
            idEstadoMultaPendiente,
            `Devolución con ${diasRetraso} día(s) de retraso`,
            diasRetraso,
            valorMulta,
          ]
        );
        multaGenerada = insertMultaRes.rows[0];
      }
    }

    await client.query('COMMIT');
    return {
      prestamo: updatePrestamoRes.rows[0],
      multa: multaGenerada,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const renovar = async (idPrestamo, nuevaFechaVencimiento) => {
  const text = `
    UPDATE public.prestamos
    SET fechavencimiento_prestamo = $2
    WHERE id_prestamo = $1
    RETURNING *;
  `;
  const res = await query(text, [idPrestamo, nuevaFechaVencimiento]);
  return res.rows[0] || null;
};

/**
 * Marca como VENCIDO los préstamos ACTIVO cuya fecha de vencimiento ya pasó.
 */
export const marcarVencidos = async () => {
  const text = `
    WITH vencidos AS (
      UPDATE public.prestamos
      SET id_estado_prestamo = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'prestamo' AND codigo_estado = 'VENCIDO' LIMIT 1)
      WHERE fechavencimiento_prestamo < CURRENT_TIMESTAMP
        AND id_estado_prestamo = (SELECT id_estado FROM public.estados WHERE entidad_estado = 'prestamo' AND codigo_estado = 'ACTIVO' LIMIT 1)
      RETURNING id_usuario, id_ejemplar
    )
    INSERT INTO public.notificaciones (
      id_usuario, id_estado_notificacion, entidad_estado_notificacion, titulo_notificacion, mensaje_notificacion, tipo_notificacion
    )
    SELECT v.id_usuario,
           (SELECT id_estado FROM public.estados WHERE entidad_estado = 'notificacion' AND codigo_estado = 'NO_LEIDA' LIMIT 1),
           'notificacion',
           'Préstamo vencido',
           'Tu préstamo de "' || l.titulo_libro || '" ya venció. Devuélvelo lo antes posible: se genera una multa por cada día de retraso.',
           'PRESTAMO'
    FROM vencidos v
    JOIN public.ejemplares ej ON v.id_ejemplar = ej.id_ejemplar
    JOIN public.libros l ON ej.id_libro = l.id_libro;
  `;
  await query(text);
};

/**
 * Cuenta los préstamos abiertos (ACTIVO o VENCIDO) de un usuario.
 */
export const contarAbiertosPorUsuario = async (idUsuario) => {
  const text = `
    SELECT COUNT(*)::int AS total
    FROM public.prestamos p
    JOIN public.estados e ON p.id_estado_prestamo = e.id_estado
    WHERE p.id_usuario = $1 AND e.codigo_estado IN ('ACTIVO', 'VENCIDO');
  `;
  const res = await query(text, [idUsuario]);
  return res.rows[0].total;
};
