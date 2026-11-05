-- Catálogo ampliado: miles de libros reales (datos/libros*.txt) con sus autores, editoriales y ejemplares repartidos
-- por todas las sedes según su tamaño y en ubicaciones coherentes con la categoría.
-- Los libros nuevos no tienen portada (portada_libro NULL). ISBN simulados con prefijo 9789589 (dígito de control válido).
-- Años de publicación aproximados (dentro del rango de actividad del autor).
DO $$
DECLARE
    x_disp INTEGER; x_mant INTEGER; x_perd INTEGER; e_libro INTEGER; e_edi INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM public.libros WHERE isbn_libro LIKE '9789589%') THEN
        RAISE EXCEPTION 'El catálogo simulado ya existe; ejecuta primero 00_limpiar.sql';
    END IF;
    IF (SELECT count(*) FROM public.bibliotecas) < 30 THEN RAISE EXCEPTION 'Faltan las sedes: ejecuta 01_sedes_editoriales_categorias.sql'; END IF;
    SELECT id_estado INTO x_disp FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='DISPONIBLE';
    SELECT id_estado INTO x_mant FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='MANTENIMIENTO';
    SELECT id_estado INTO x_perd FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='PERDIDO';
    SELECT id_estado INTO e_libro FROM public.estados WHERE entidad_estado='libro' AND codigo_estado='DISPONIBLE';
    SELECT id_estado INTO e_edi FROM public.estados WHERE entidad_estado='editorial' AND codigo_estado='ACTIVA';

    -- ===== Lectura de los datos =====
    CREATE TEMP TABLE crudo ON COMMIT DROP AS
    SELECT row_number() OVER () AS n, c[1] AS titulo, c[2] AS autor, c[3] AS categoria, c[4]::int AS y0, c[5]::int AS y1, nullif(c[6], '') AS editorial
    FROM (SELECT string_to_array(linea, '|') AS c
          FROM regexp_split_to_table($d$/*@libros*/$d$, E'\r?\n') AS linea WHERE trim(linea) <> '') t;

    CREATE TEMP TABLE nuevos ON COMMIT DROP AS
    SELECT row_number() OVER (ORDER BY n) AS k, x.*
    FROM (SELECT DISTINCT ON (lower(c.titulo)) c.* FROM crudo c
          WHERE NOT EXISTS (SELECT 1 FROM public.libros l WHERE lower(l.titulo_libro) = lower(c.titulo))
          ORDER BY lower(c.titulo), c.n) x;

    -- Editorial efectiva: la indicada o una de las habituales para su categoría
    CREATE TEMP TABLE pool_ed ON COMMIT DROP AS
    SELECT g, p FROM (VALUES
        ('narrativa', ARRAY['Planeta','Penguin Random House','Alfaguara','Anagrama','Seix Barral','Tusquets','Debolsillo','Alianza Editorial','Salamandra','Siruela','Lumen','Destino','Plaza & Janés','Suma de Letras','Edhasa','Acantilado','Editorial Sudamericana','Norma','Panamericana Editorial','Alba Editorial']),
        ('ensayo', ARRAY['Fondo de Cultura Económica','Siglo XXI Editores','Crítica','Debate','Paidós','Alianza Editorial','Taurus','Gredos','Ariel','Anagrama','Editorial Universidad Nacional de Colombia','Editorial Universidad de Antioquia','Planeta','Tusquets','Akal','Trotta','Gedisa','Penguin Random House','Herder','Kairós','Península']),
        ('joven', ARRAY['Loqueleo','Norma','Montena','SM','Kalandraka','Santillana','Panamericana Editorial','Planeta Cómic','Panini','Glénat','Nube de Tinta','Hidra','Puck','RBA','Ediciones B','Alfaguara','Bruño','Juventud']),
        ('tecnico', ARRAY['Pearson','McGraw-Hill','Anaya Multimedia','Legis','Temis','Deusto','Empresa Activa','Planeta','Larousse','Espasa','Elsevier','Paidós','Grijalbo','Reverté','Urano','Conecta','Aguilar','Océano','Edaf'])
    ) v(g, p);

    CREATE TEMP TABLE nuevos_ed ON COMMIT DROP AS
    SELECT n.*,
           coalesce(n.editorial,
                    (SELECT p[1 + abs(hashtext(n.titulo)) % array_length(p, 1)] FROM pool_ed WHERE g =
                        CASE WHEN n.categoria IN ('Novela','Cuento','Poesía','Teatro','Ciencia ficción y fantasía','Misterio y suspenso','Romance','Terror') THEN 'narrativa'
                             WHEN n.categoria IN ('Infantil','Juvenil','Cómic y novela gráfica') THEN 'joven'
                             WHEN n.categoria IN ('Tecnología y computación','Derecho','Economía y emprendimiento','Referencia y consulta','Gastronomía y hogar','Salud y bienestar','Deportes y recreación','Idiomas y lingüística','Educación y pedagogía') THEN 'tecnico'
                             ELSE 'ensayo' END)) AS editorial_ef
    FROM nuevos n;

    INSERT INTO public.editoriales (id_estado_editorial, nombre_editorial)
    SELECT e_edi, d.nombre FROM (SELECT DISTINCT editorial_ef AS nombre FROM nuevos_ed) d
    WHERE NOT EXISTS (SELECT 1 FROM public.editoriales e WHERE e.nombre_editorial = d.nombre);

    INSERT INTO public.autores (nombrecompleto_autor)
    SELECT DISTINCT autor FROM nuevos n WHERE NOT EXISTS (SELECT 1 FROM public.autores a WHERE a.nombrecompleto_autor = n.autor);

    -- ===== Libros (ISBN-13 con dígito verificador) =====
    CREATE TEMP TABLE libros_nuevos ON COMMIT DROP AS
    WITH b AS (
        SELECT n.*, '9789589' || lpad(n.k::text, 5, '0') AS base12,
               make_date(n.y0 + floor(random() * (n.y1 - n.y0 + 1))::int, 1 + floor(random() * 12)::int, 1 + floor(random() * 28)::int) AS f_pub,
               random() AS r_pag
        FROM nuevos_ed n
    )
    SELECT b.*, nextval(pg_get_serial_sequence('public.libros', 'id_libro'))::int AS id_libro,
           b.base12 || ((10 - (SELECT sum(substr(b.base12, i, 1)::int * CASE WHEN i % 2 = 0 THEN 3 ELSE 1 END) FROM generate_series(1, 12) i) % 10) % 10)::text AS isbn
    FROM b;

    INSERT INTO public.libros (id_libro, id_categoria, id_editorial, id_estado_libro, isbn_libro, titulo_libro, descripcion_libro,
                               portada_libro, numpaginas_libro, idioma_libro, fechapublicacion_libro, fecharegistro_libro)
    SELECT l.id_libro, c.id_categorias_libros, e.id_editorial, e_libro, l.isbn, l.titulo,
           format('%s, de %s (%s). %s', l.titulo, l.autor, extract(year FROM l.f_pub)::int,
                  CASE l.categoria
                      WHEN 'Novela' THEN 'Una obra imprescindible de la narrativa.'
                      WHEN 'Cuento' THEN 'Reúne relatos breves de lectura ágil.'
                      WHEN 'Poesía' THEN 'Una selección esencial de su obra poética.'
                      WHEN 'Teatro' THEN 'Texto dramático de referencia para lectura y puesta en escena.'
                      WHEN 'Infantil' THEN 'Pensado para compartir en voz alta con niños y niñas.'
                      WHEN 'Juvenil' THEN 'Una lectura muy solicitada por el público joven.'
                      WHEN 'Cómic y novela gráfica' THEN 'Narrativa gráfica de culto para lectores de todas las edades.'
                      WHEN 'Referencia y consulta' THEN 'Obra de consulta disponible en sala.'
                      WHEN 'Ciencia ficción y fantasía' THEN 'Imaginación y aventura para lectores de género.'
                      WHEN 'Misterio y suspenso' THEN 'Intriga y tensión de principio a fin.'
                      WHEN 'Romance' THEN 'Una historia de amor que conquistó a miles de lectores.'
                      WHEN 'Terror' THEN 'Literatura de miedo para lectores valientes.'
                      WHEN 'Derecho' THEN 'Texto de consulta para estudiantes y profesionales del derecho.'
                      WHEN 'Gastronomía y hogar' THEN 'Ideas y recetas para la vida cotidiana.'
                      WHEN 'Viajes y geografía' THEN 'Relatos y datos para recorrer el mundo desde la lectura.'
                      WHEN 'Deportes y recreación' THEN 'Historias, técnica y cultura del deporte.'
                      WHEN 'Religión y espiritualidad' THEN 'Lectura para la reflexión y el crecimiento interior.'
                      ELSE 'Título de consulta frecuente para estudio y formación.'
                  END),
           NULL,
           CASE l.categoria
               WHEN 'Infantil' THEN 24 + floor(l.r_pag * 56)::int
               WHEN 'Poesía' THEN 80 + floor(l.r_pag * 180)::int
               WHEN 'Teatro' THEN 80 + floor(l.r_pag * 180)::int
               WHEN 'Cómic y novela gráfica' THEN 48 + floor(l.r_pag * 170)::int
               WHEN 'Cuento' THEN 120 + floor(l.r_pag * 240)::int
               WHEN 'Juvenil' THEN 180 + floor(l.r_pag * 380)::int
               WHEN 'Referencia y consulta' THEN 400 + floor(l.r_pag * 2000)::int
               WHEN 'Derecho' THEN 200 + floor(l.r_pag * 700)::int
               WHEN 'Tecnología y computación' THEN 250 + floor(l.r_pag * 750)::int
               ELSE 160 + floor(l.r_pag * 560)::int
           END,
           'Español', l.f_pub, now()
    FROM libros_nuevos l
    JOIN public.categorias_libros c ON c.nombre_categlib = l.categoria
    JOIN public.editoriales e ON e.nombre_editorial = l.editorial_ef AND e.id_editorial = (SELECT min(id_editorial) FROM public.editoriales WHERE nombre_editorial = l.editorial_ef);

    INSERT INTO public.libros_autores (id_libro, id_autor)
    SELECT l.id_libro, (SELECT min(id_autor) FROM public.autores a WHERE a.nombrecompleto_autor = l.autor) FROM libros_nuevos l;

    -- ===== Ejemplares: ~3 por libro nuevo y ~4 adicionales por libro del catálogo original =====
    CREATE TEMP TABLE copias ON COMMIT DROP AS
    SELECT row_number() OVER () AS cid, t.id_libro, t.id_categoria, t.f_pub,
           random() AS r_bib, random() AS r_est, random() AS r_fecha
    FROM (
        SELECT l.id_libro, c.id_categorias_libros AS id_categoria, l.f_pub, least(12, 1 + floor(-ln(1 - random()) * 2.0))::int AS k
        FROM libros_nuevos l JOIN public.categorias_libros c ON c.nombre_categlib = l.categoria
        UNION ALL
        SELECT x.id_libro, x.id_categoria, x.fechapublicacion_libro, floor(-ln(1 - random()) * 4)::int
        FROM public.libros x WHERE x.id_libro <= 306
    ) t, generate_series(1, t.k) g;

    -- Peso de cada sede: las originales según su tamaño, las nuevas según su número de ubicaciones
    CREATE TEMP TABLE bib_w ON COMMIT DROP AS
    SELECT id_biblioteca, w, sum(w) OVER (ORDER BY id_biblioteca) - w AS lo, sum(w) OVER (ORDER BY id_biblioteca) AS hi
    FROM (
        SELECT b.id_biblioteca,
               CASE b.id_biblioteca WHEN 11 THEN 5 WHEN 12 THEN 4 WHEN 13 THEN 2 WHEN 14 THEN 3 WHEN 15 THEN 3
                                    WHEN 16 THEN 2 WHEN 17 THEN 2 WHEN 18 THEN 3 WHEN 19 THEN 3 WHEN 20 THEN 4
                    ELSE CASE WHEN count(u.id_ubicacion) >= 17 THEN 5 WHEN count(u.id_ubicacion) >= 13 THEN 3 ELSE 1.5 END END::numeric AS w
        FROM public.bibliotecas b LEFT JOIN public.ubicaciones u ON u.id_biblioteca = b.id_biblioteca
        GROUP BY b.id_biblioteca
    ) t;

    -- Qué secciones admiten cada categoría
    CREATE TEMP TABLE cat_kw ON COMMIT DROP AS
    SELECT v.cat, v.kw FROM (VALUES
        ('Novela','novela|narrativa|literatura'),('Cuento','cuento|narrativa|literatura'),('Poesía','poes'),('Teatro','teatro'),
        ('Ensayo y crónica','ensayo|crónica|sociales|literatura'),('Biografías y memorias','biograf'),('Historia','histor|sociales'),
        ('Ciencias sociales','sociales|humanas'),('Filosofía y psicología','filosof|psicolog|humanidades'),
        ('Ciencias naturales','ciencia|natural|exactas|matem'),('Tecnología y computación','tecnolog|ciencia'),
        ('Salud y bienestar','salud|vida práctica|ciencias'),('Arte y arquitectura','arte|diseño|arquitect'),
        ('Música y cine','música|cine|arte|audiovis'),('Educación y pedagogía','educaci|pedagog|texto'),
        ('Idiomas y lingüística','idioma|lingü|educaci|referencia'),('Economía y emprendimiento','econom|sociales'),
        ('Referencia y consulta','referencia|consulta'),('Infantil','infantil|primera infancia|niñ'),('Juvenil','juvenil|joven'),
        ('Cómic y novela gráfica','cómic|juvenil|joven'),('Ciencia ficción y fantasía','género|novela|literatura|narrativa'),
        ('Misterio y suspenso','género|novela|literatura|narrativa'),('Romance','género|novela|literatura|narrativa'),
        ('Terror','género|novela|literatura|narrativa'),('Religión y espiritualidad','vida práctica|filosof|humanidades'),
        ('Derecho','derecho|sociales'),('Gastronomía y hogar','vida práctica|salud'),
        ('Viajes y geografía','vida práctica|histor|sociales'),('Deportes y recreación','vida práctica|deporte|recreaci')
    ) v(cat, kw);

    CREATE TEMP TABLE copias_ubic ON COMMIT DROP AS
    SELECT DISTINCT ON (c.cid) c.*, b.id_biblioteca, u.id_ubicacion
    FROM copias c
    JOIN bib_w b ON c.r_bib * (SELECT max(hi) FROM bib_w) >= b.lo AND c.r_bib * (SELECT max(hi) FROM bib_w) < b.hi
    JOIN public.ubicaciones u ON u.id_biblioteca = b.id_biblioteca
    JOIN public.categorias_libros cl ON cl.id_categorias_libros = c.id_categoria
    LEFT JOIN cat_kw k ON k.cat = cl.nombre_categlib
    ORDER BY c.cid, -ln(1 - random()) / CASE WHEN (u.seccion_ubicacion || ' ' || coalesce(u.descripcion_ubicacion, '')) ~* k.kw THEN 3 ELSE 0.15 END;

    -- Código interno: prefijo de la sede (CLA, PED… en las originales; B21, B22… según el id de la sede en las nuevas) + consecutivo
    CREATE TEMP TABLE pref ON COMMIT DROP AS
    SELECT b.id_biblioteca,
           coalesce(max(split_part(e.codinterno_ejemplar, '-', 1)), 'B' || b.id_biblioteca::text) AS pref,
           coalesce(max(CASE WHEN e.codinterno_ejemplar ~ '^[A-Z]+-[0-9]+$' THEN split_part(e.codinterno_ejemplar, '-', 2)::int END), 0) AS mx
    FROM public.bibliotecas b
    LEFT JOIN public.ubicaciones u ON u.id_biblioteca = b.id_biblioteca
    LEFT JOIN public.ejemplares e ON e.id_ubicacion = u.id_ubicacion AND e.id_ejemplar <= 1047
    GROUP BY b.id_biblioteca;

    INSERT INTO public.ejemplares (id_libro, id_ubicacion, id_estado_ejemplar, codinterno_ejemplar, fechaadquisicion_ejemplar, observacion_ejemplar)
    SELECT c.id_libro, c.id_ubicacion,
           CASE WHEN c.r_est < 0.02 THEN x_mant WHEN c.r_est < 0.025 THEN x_perd ELSE x_disp END,
           p.pref || '-' || lpad((p.mx + row_number() OVER (PARTITION BY c.id_biblioteca ORDER BY c.cid))::text, 5, '0'),
           least(greatest(date '2012-01-01' + (c.r_fecha * ((current_date - 45) - date '2012-01-01'))::int, c.f_pub + 60), current_date - 30),
           CASE WHEN c.r_est < 0.01 THEN 'En reparación de encuadernación'
                WHEN c.r_est < 0.02 THEN 'Páginas sueltas; pendiente de restauración'
                WHEN c.r_est < 0.025 THEN 'No apareció en el inventario' END
    FROM copias_ubic c JOIN pref p ON p.id_biblioteca = c.id_biblioteca;

    UPDATE public.libros l SET fecharegistro_libro = coalesce((SELECT min(e.fechaadquisicion_ejemplar) FROM public.ejemplares e WHERE e.id_libro = l.id_libro), now())
    WHERE l.id_libro > 306;
END $$;

SELECT (SELECT count(*) FROM public.libros) libros, (SELECT count(*) FROM public.autores) autores,
       (SELECT count(*) FROM public.ejemplares) ejemplares, (SELECT count(*) FROM public.editoriales) editoriales;
