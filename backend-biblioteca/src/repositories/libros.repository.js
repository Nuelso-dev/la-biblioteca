import pool, { query } from '../config/database.js';

// Tablas que los filtros pueden referenciar; el conteo solo necesita estas (sin multiplicar filas por autor/ejemplar)
const FROM_FILTRABLE = `
    FROM public.libros l
    JOIN public.categorias_libros c ON l.id_categoria = c.id_categorias_libros
    JOIN public.editoriales ed ON l.id_editorial = ed.id_editorial
    JOIN public.estados e ON l.id_estado_libro = e.id_estado
`;

const FROM_LISTADO = `
    ${FROM_FILTRABLE}
    LEFT JOIN public.libros_autores la ON l.id_libro = la.id_libro
    LEFT JOIN public.autores a ON la.id_autor = a.id_autor
    LEFT JOIN public.ejemplares ej ON l.id_libro = ej.id_libro
    LEFT JOIN public.estados ej_est ON ej.id_estado_ejemplar = ej_est.id_estado
    LEFT JOIN public.ubicaciones ub ON ej.id_ubicacion = ub.id_ubicacion
    LEFT JOIN public.bibliotecas bib ON ub.id_biblioteca = bib.id_biblioteca
`;

/**
 * Construye WHERE / HAVING y parámetros a partir de los filtros del catálogo.
 * Los filtros por autor y búsqueda usan EXISTS para no recortar la lista de autores que se muestra.
 */
const construirFiltros = ({ busqueda, idCategoria, idEditorial, idAutor, idBiblioteca, idEstado, disponible, catalogo } = {}) => {
  const params = [];
  const donde = ['1=1'];
  let orden = '';
  const push = (valor) => {
    params.push(valor);
    return `$${params.length}`;
  };

  if (idCategoria) donde.push(`l.id_categoria = ${push(idCategoria)}`);
  if (idEditorial) donde.push(`l.id_editorial = ${push(idEditorial)}`);
  if (idEstado) donde.push(`l.id_estado_libro = ${push(idEstado)}`);
  if (idAutor) {
    donde.push(`EXISTS (SELECT 1 FROM public.libros_autores x WHERE x.id_libro = l.id_libro AND x.id_autor = ${push(idAutor)})`);
  }
  if (idBiblioteca) {
    donde.push(`EXISTS (
      SELECT 1 FROM public.ejemplares xe
      JOIN public.ubicaciones xu ON xu.id_ubicacion = xe.id_ubicacion
      WHERE xe.id_libro = l.id_libro AND xu.id_biblioteca = ${push(idBiblioteca)}
    )`);
  }
  // El catálogo público no muestra libros descatalogados
  if (catalogo) donde.push("e.codigo_estado <> 'DESCATALOGADO'");

  if (busqueda && busqueda.trim()) {
    const termino = busqueda.trim();
    const like = push(`%${termino}%`);
    const crudo = push(termino);
    // Sin distinguir acentos ni mayúsculas, y tolerante a errores de tipeo en el título (pg_trgm)
    const sinAcento = (col) => `public.unaccent(lower(${col}))`;
    // Con búsqueda, primero los títulos que la contienen y luego los más parecidos
    orden = `(${sinAcento('l.titulo_libro')} LIKE ${sinAcento(like)}) DESC, public.similarity(${sinAcento('l.titulo_libro')}, ${sinAcento(crudo)}) DESC, `;
    donde.push(`(
      ${sinAcento('l.titulo_libro')} LIKE ${sinAcento(like)}
      OR public.similarity(${sinAcento('l.titulo_libro')}, ${sinAcento(crudo)}) > 0.3
      OR l.isbn_libro ILIKE ${like}
      OR ${sinAcento('ed.nombre_editorial')} LIKE ${sinAcento(like)}
      OR ${sinAcento('c.nombre_categlib')} LIKE ${sinAcento(like)}
      OR EXISTS (
        SELECT 1 FROM public.libros_autores x
        JOIN public.autores a2 ON a2.id_autor = x.id_autor
        WHERE x.id_libro = l.id_libro AND ${sinAcento('a2.nombrecompleto_autor')} LIKE ${sinAcento(like)}
      )
    )`);
  }

  if (disponible) {
    donde.push(`EXISTS (
      SELECT 1 FROM public.ejemplares xd
      JOIN public.estados xde ON xde.id_estado = xd.id_estado_ejemplar
      WHERE xd.id_libro = l.id_libro AND xde.codigo_estado = 'DISPONIBLE'
    )`);
  }

  return { donde: donde.join(' AND '), params, orden };
};

export const findAll = async ({ limit = 20, offset = 0, ...filtros } = {}) => {
  const { donde, params, orden } = construirFiltros(filtros);
  params.push(limit, offset);

  const text = `
    SELECT
      l.id_libro,
      l.isbn_libro,
      l.titulo_libro,
      l.descripcion_libro,
      l.portada_libro,
      l.numpaginas_libro,
      l.idioma_libro,
      l.fechapublicacion_libro,
      l.fecharegistro_libro,
      l.id_categoria,
      c.nombre_categlib AS categoria,
      l.id_editorial,
      ed.nombre_editorial AS editorial,
      l.id_estado_libro,
      e.nombre_estado AS estado,
      e.codigo_estado,
      COALESCE(STRING_AGG(DISTINCT a.nombrecompleto_autor, ', '), 'Sin autor asignado') AS autor,
      COUNT(DISTINCT ej.id_ejemplar)::int AS total_ejemplares,
      COUNT(DISTINCT ej.id_ejemplar) FILTER (WHERE ej_est.codigo_estado = 'DISPONIBLE')::int AS ejemplares_disponibles,
      (ARRAY_AGG(ej.id_ejemplar ORDER BY ej.id_ejemplar) FILTER (WHERE ej_est.codigo_estado = 'DISPONIBLE'))[1] AS id_ejemplar,
      STRING_AGG(DISTINCT bib.nombre_biblioteca, ', ') AS nombre_biblioteca
    ${FROM_LISTADO}
    WHERE ${donde}
    GROUP BY l.id_libro, c.nombre_categlib, ed.nombre_editorial, e.nombre_estado, e.codigo_estado
    ORDER BY ${orden}l.id_libro DESC
    LIMIT $${params.length - 1} OFFSET $${params.length};
  `;

  const res = await query(text, params);
  return res.rows;
};

/** Cantidad total de libros que cumplen los filtros (ignora limit/offset). */
export const count = async (filtros = {}) => {
  const { donde, params } = construirFiltros(filtros);
  const text = `SELECT COUNT(*)::int AS total ${FROM_FILTRABLE} WHERE ${donde};`;
  const res = await query(text, params);
  return res.rows[0].total;
};

export const findById = async (id) => {
  const text = `
    SELECT 
      l.id_libro,
      l.isbn_libro,
      l.titulo_libro,
      l.descripcion_libro,
      l.portada_libro,
      l.numpaginas_libro,
      l.idioma_libro,
      l.fechapublicacion_libro,
      l.fecharegistro_libro,
      l.id_categoria,
      c.nombre_categlib AS categoria,
      l.id_editorial,
      ed.nombre_editorial AS editorial,
      l.id_estado_libro,
      e.nombre_estado AS estado,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('id_autor', a.id_autor, 'nombre', a.nombrecompleto_autor)
        ) FILTER (WHERE a.id_autor IS NOT NULL), '[]'
      ) AS autores,
      COALESCE(STRING_AGG(DISTINCT a.nombrecompleto_autor, ', '), 'Sin autor asignado') AS autor,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_ejemplar', ej.id_ejemplar,
            'id_libro', ej.id_libro,
            'codinterno_ejemplar', ej.codinterno_ejemplar,
            'id_ubicacion', ej.id_ubicacion,
            'nombre_ubicacion', ub.nombre_ubicacion,
            'id_biblioteca', bib.id_biblioteca,
            'nombre_biblioteca', bib.nombre_biblioteca,
            'id_estado_ejemplar', ej.id_estado_ejemplar,
            'codigo_estado', ej_est.codigo_estado,
            'nombre_estado', ej_est.nombre_estado
          )
        ) FILTER (WHERE ej.id_ejemplar IS NOT NULL), '[]'
      ) AS ejemplares,
      COUNT(DISTINCT ej.id_ejemplar)::int AS total_ejemplares,
      COUNT(DISTINCT ej.id_ejemplar) FILTER (WHERE ej_est.codigo_estado = 'DISPONIBLE')::int AS ejemplares_disponibles,
      (ARRAY_AGG(ej.id_ejemplar ORDER BY ej.id_ejemplar) FILTER (WHERE ej_est.codigo_estado = 'DISPONIBLE'))[1] AS id_ejemplar
    FROM public.libros l
    JOIN public.categorias_libros c ON l.id_categoria = c.id_categorias_libros
    JOIN public.editoriales ed ON l.id_editorial = ed.id_editorial
    JOIN public.estados e ON l.id_estado_libro = e.id_estado
    LEFT JOIN public.libros_autores la ON l.id_libro = la.id_libro
    LEFT JOIN public.autores a ON la.id_autor = a.id_autor
    LEFT JOIN public.ejemplares ej ON l.id_libro = ej.id_libro
    LEFT JOIN public.estados ej_est ON ej.id_estado_ejemplar = ej_est.id_estado
    LEFT JOIN public.ubicaciones ub ON ej.id_ubicacion = ub.id_ubicacion
    LEFT JOIN public.bibliotecas bib ON ub.id_biblioteca = bib.id_biblioteca
    WHERE l.id_libro = $1
    GROUP BY l.id_libro, c.nombre_categlib, ed.nombre_editorial, e.nombre_estado;
  `;
  const res = await query(text, [id]);
  return res.rows[0] || null;
};

export const findByIsbn = async (isbn) => {
  if (!isbn) return null;
  const text = 'SELECT * FROM public.libros WHERE LOWER(TRIM(isbn_libro)) = LOWER(TRIM($1));';
  const res = await query(text, [isbn]);
  return res.rows[0] || null;
};

export const create = async (data, autoresIds = []) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const estadoId = data.idEstado || (
      await client.query("SELECT id_estado FROM public.estados WHERE entidad_estado = 'libro' AND codigo_estado = 'DISPONIBLE' LIMIT 1")
    ).rows[0]?.id_estado;

    // Resolver id_categoria
    let categoriaId = data.idCategoria;
    if (!categoriaId) {
      const error = new Error("La categoría del libro es obligatoria.");
      error.statusCode = 400;
      throw error;
    }

    // Resolver id_editorial
    let editorialId = data.idEditorial;
    if (!editorialId) {
      if (data.editorial && data.editorial.trim()) {
        const nombreEditorial = data.editorial.trim();
        let editRes = await client.query("SELECT id_editorial FROM public.editoriales WHERE LOWER(TRIM(nombre_editorial)) = LOWER(TRIM($1)) LIMIT 1;", [nombreEditorial]);
        if (editRes.rows.length > 0) {
          editorialId = editRes.rows[0].id_editorial;
        } else {
          const estEditRes = await client.query(
            "SELECT id_estado FROM public.estados WHERE entidad_estado = 'editorial' AND codigo_estado = 'ACTIVA' LIMIT 1;"
          );
          const estEdit = estEditRes.rows[0]?.id_estado;
          if (!estEdit) {
            const error = new Error("No se encontró el estado 'ACTIVA' para la entidad 'editorial' en public.estados.");
            error.statusCode = 500;
            throw error;
          }

          editRes = await client.query(
            "INSERT INTO public.editoriales (id_estado_editorial, entidad_estado_editorial, nombre_editorial) VALUES ($1, 'editorial', $2) RETURNING id_editorial;",
            [estEdit, nombreEditorial]
          );
          editorialId = editRes.rows[0]?.id_editorial;
        }
      } else {
        const error = new Error('La editorial del libro es obligatoria.');
        error.statusCode = 400;
        throw error;
      }
    }

    const insertLibroText = `
      INSERT INTO public.libros (
        id_categoria, id_editorial, id_estado_libro, entidad_estado_libro,
        isbn_libro, titulo_libro, descripcion_libro, portada_libro,
        numpaginas_libro, idioma_libro, fechapublicacion_libro
      ) VALUES ($1, $2, $3, 'libro', $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const libroValues = [
      categoriaId,
      editorialId,
      estadoId,
      data.isbn ? data.isbn.trim() : null,
      data.titulo.trim(),
      data.descripcion || data.sinopsis || null,
      data.portada || data.portada_libro || null,
      data.numPaginas || data.paginas || null,
      data.idioma || 'Español',
      data.fechaPublicacion || null,
    ];
    const libroRes = await client.query(insertLibroText, libroValues);
    const nuevoLibro = libroRes.rows[0];

    // Asociar autores evitando duplicados
    if (Array.isArray(autoresIds) && autoresIds.length > 0) {
      const autoresUnicos = [...new Set(autoresIds)];
      for (const idAutor of autoresUnicos) {
        await client.query(
          `INSERT INTO public.libros_autores (id_libro, id_autor)
           VALUES ($1, $2)
           ON CONFLICT (id_libro, id_autor) DO NOTHING;`,
          [nuevoLibro.id_libro, idAutor]
        );
      }
    }

    await client.query('COMMIT');
    return nuevoLibro;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const update = async (id, data, autoresIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let editorialId = data.idEditorial;
    if (!editorialId && data.editorial && data.editorial.trim()) {
      const nombreEditorial = data.editorial.trim();
      let editRes = await client.query('SELECT id_editorial FROM public.editoriales WHERE LOWER(TRIM(nombre_editorial)) = LOWER(TRIM($1)) LIMIT 1;', [nombreEditorial]);
      if (editRes.rows.length > 0) {
        editorialId = editRes.rows[0].id_editorial;
      } else {
        const estEditRes = await client.query(
          "SELECT id_estado FROM public.estados WHERE entidad_estado = 'editorial' AND codigo_estado = 'ACTIVA' LIMIT 1;"
        );
        const estEdit = estEditRes.rows[0]?.id_estado;
        if (!estEdit) {
          const error = new Error("No se encontró el estado 'ACTIVA' para la entidad 'editorial' en public.estados.");
          error.statusCode = 500;
          throw error;
        }

        editRes = await client.query(
          "INSERT INTO public.editoriales (id_estado_editorial, entidad_estado_editorial, nombre_editorial) VALUES ($1, 'editorial', $2) RETURNING id_editorial;",
          [estEdit, nombreEditorial]
        );
        editorialId = editRes.rows[0]?.id_editorial;
      }
    }

    // Solo se actualizan los campos presentes en la petición; null o cadena vacía limpia los opcionales.
    const vacioANull = (v) => (v === '' || v === undefined ? null : v);
    const campos = [];
    const agregar = (columna, valor) => campos.push([columna, valor]);

    if (data.idCategoria !== undefined && data.idCategoria !== null) agregar('id_categoria', data.idCategoria);
    if (editorialId) agregar('id_editorial', editorialId);
    if (data.idEstado !== undefined && data.idEstado !== null) agregar('id_estado_libro', data.idEstado);
    if (data.titulo !== undefined && data.titulo !== null) agregar('titulo_libro', data.titulo.trim());
    if (data.isbn !== undefined) agregar('isbn_libro', data.isbn ? data.isbn.trim() || null : null);

    const descripcion = data.descripcion !== undefined ? data.descripcion : data.sinopsis;
    if (descripcion !== undefined) agregar('descripcion_libro', vacioANull(descripcion));

    const portada = data.portada !== undefined ? data.portada : data.portada_libro;
    if (portada !== undefined) agregar('portada_libro', vacioANull(portada));

    const numPaginas = data.numPaginas !== undefined ? data.numPaginas : data.paginas;
    if (numPaginas !== undefined) agregar('numpaginas_libro', vacioANull(numPaginas));

    if (data.idioma !== undefined && data.idioma !== null && String(data.idioma).trim() !== '') {
      agregar('idioma_libro', String(data.idioma).trim());
    }
    if (data.fechaPublicacion !== undefined) agregar('fechapublicacion_libro', vacioANull(data.fechaPublicacion));

    let libroActualizado;
    if (campos.length > 0) {
      const sets = campos.map(([columna], idx) => `${columna} = $${idx + 2}`).join(', ');
      const libroRes = await client.query(
        `UPDATE public.libros SET ${sets} WHERE id_libro = $1 RETURNING *;`,
        [id, ...campos.map(([, valor]) => valor)]
      );
      libroActualizado = libroRes.rows[0];
    } else {
      libroActualizado = (await client.query('SELECT * FROM public.libros WHERE id_libro = $1;', [id])).rows[0];
    }

    if (Array.isArray(autoresIds)) {
      // Reemplazar autores asociados
      await client.query('DELETE FROM public.libros_autores WHERE id_libro = $1;', [id]);
      const autoresUnicos = [...new Set(autoresIds)];
      for (const idAutor of autoresUnicos) {
        await client.query(
          `INSERT INTO public.libros_autores (id_libro, id_autor)
           VALUES ($1, $2)
           ON CONFLICT (id_libro, id_autor) DO NOTHING;`,
          [id, idAutor]
        );
      }
    }

    await client.query('COMMIT');
    return libroActualizado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const remove = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ejemplares = await client.query('SELECT COUNT(*)::int AS total FROM public.ejemplares WHERE id_libro = $1;', [id]);
    if (ejemplares.rows[0].total > 0) {
      const error = new Error(
        `No se puede eliminar el libro: tiene ${ejemplares.rows[0].total} ejemplar(es) registrado(s). Elimina primero sus ejemplares o cambia el estado del libro a Descatalogado.`
      );
      error.statusCode = 409;
      throw error;
    }

    await client.query('DELETE FROM public.libros_autores WHERE id_libro = $1;', [id]);
    const res = await client.query('DELETE FROM public.libros WHERE id_libro = $1 RETURNING *;', [id]);

    await client.query('COMMIT');
    return res.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
