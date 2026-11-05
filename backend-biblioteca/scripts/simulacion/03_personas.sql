-- Personas simuladas: 9.000 lectores (nombre único, correo nombre.apellido@simulado.test, perfil de uso y
-- categorías favoritas) y bibliotecarios en proporción al tamaño de las sedes (3 por sede + 1 por cada 50
-- ejemplares). Los bibliotecarios no se asignan a una sede: solo se crea el total.
-- Deja sim.perfil (perfil de uso y preferencias) para las etapas siguientes; 05_extras.sql la elimina.
DO $$
DECLARE
    v_rol_bib   INTEGER;
    v_total_bib INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email LIKE '%@simulado.test') THEN
        RAISE EXCEPTION 'Ya existen usuarios simulados; ejecuta primero 00_limpiar.sql';
    END IF;
    SELECT id_rol INTO v_rol_bib FROM public.roles WHERE nombre_rol = 'Bibliotecario';

    SELECT sum(3 + round(ejemplares / 50.0))::int INTO v_total_bib
    FROM (
        SELECT count(x.id_ejemplar) AS ejemplares
        FROM public.bibliotecas b
        LEFT JOIN public.ubicaciones u ON u.id_biblioteca = b.id_biblioteca
        LEFT JOIN public.ejemplares x ON x.id_ubicacion = u.id_ubicacion
        GROUP BY b.id_biblioteca
    ) t;

    CREATE SCHEMA IF NOT EXISTS sim;
    DROP TABLE IF EXISTS sim.perfil;

    -- Reserva de nombres: (nombre, primer apellido) único; los apellidos 90..99 son solo de bibliotecarios
    CREATE TEMP TABLE personas ON COMMIT DROP AS
    WITH nombres AS (
        SELECT array[
            'Juan','María','Carlos','Ana','Luis','Laura','Andrés','Camila','Jorge','Valentina',
            'Diego','Sofía','Felipe','Daniela','Sebastián','Paula','Mateo','Isabella','Santiago','Natalia',
            'Alejandro','Carolina','David','Juliana','Nicolás','Manuela','Daniel','Mariana','Cristian','Luisa',
            'Julián','Sara','Esteban','Lucía','Miguel','Gabriela','Samuel','Catalina','Óscar','Melissa',
            'Sergio','Stephanie','Éric','Angélica','Héctor','Viviana','Iván','Tatiana','Rafael','Yesenia',
            'Kevin','Lorena','Fabián','Johana','Brayan','Marcela','Edwin','Paola','Wilson','Diana',
            'Andrea','Jhon','Leidy','Yeison','Yuliana','Mónica','Gustavo','Ricardo','Adriana','Germán',
            'Liliana','Jairo','Alexandra','Hernán','Martha','Ángel','Patricia','Fernando','Claudia','Ramón',
            'Beatriz','Alberto','Gloria','Hugo','Sandra','Javier','Elena','Nelson','Olga','Mauricio',
            'Rocío','Armando','Lina','César','Verónica','Darío','Ximena','Orlando','Nancy','Gilberto'] AS n,
        array[
            'García','Rodríguez','Martínez','López','González','Pérez','Sánchez','Ramírez','Torres','Flórez',
            'Suárez','Cárdenas','Mejía','Rincón','Ospina','Quintero','Salazar','Peña','Acosta','Cortés',
            'Navarro','Vega','Cruz','Molina','Reyes','Díaz','Vargas','Castro','Moreno','Ortiz',
            'Rojas','Gómez','Herrera','Jiménez','Muñoz','Zapata','Restrepo','Giraldo','Álvarez','Arango',
            'Ramos','Mendoza','Patiño','Valencia','Cardona','Ocampo','Sierra','Betancur','Escobar','Naranjo',
            'Zuluaga','Cuartas','Tamayo','Posada','Toro','Villa','Mora','Palacio','Hoyos','Salgado',
            'Bedoya','Echeverri','Maya','Noreña','Guerra','Pineda','Serna','Cadavid','Orozco','Marín',
            'Gaviria','Isaza','Jaramillo','Lopera','Mazo','Ochoa','Piedrahíta','Quiceno','Rendón','Sepúlveda',
            'Tobón','Urrea','Vallejo','Yepes','Zea','Aristizábal','Bustamante','Calle','Duarte','Estrada',
            'Fajardo','Garzón','Hincapié','Ibáñez','Jurado','Lema','Macías','Nava','Olarte','Páez'] AS a1,
        array[
            'Bravo','Cano','Parra','Silva','Ríos','Osorio','Mesa','Uribe','Montoya','Ruiz',
            'Agudelo','Builes','Henao','Londoño','Duque','Ángel','Correa','Vélez','Gil','Múnera'] AS a2
    ), lector AS (
        SELECT g AS n, 'L' AS tipo, (g * 37) % 9000 AS idx FROM generate_series(1, 9000) g
    ), bib AS (
        SELECT g AS n, 'B' AS tipo, 9000 + ((g * 7) % 1000) AS idx FROM generate_series(1, v_total_bib) g
    )
    SELECT p.n, p.tipo, gen_random_uuid() AS id,
           nm.n[1 + p.idx % 100] || ' ' || nm.a1[1 + p.idx / 100] || ' ' || nm.a2[1 + (p.idx * 7 + p.n) % 20] AS nombre,
           lower(translate(nm.n[1 + p.idx % 100] || '.' || nm.a1[1 + p.idx / 100],
                           'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '@simulado.test' AS correo,
           p.idx,
           CASE WHEN p.tipo = 'B' THEN now() - ((800 + random() * 1200) || ' days')::interval
                ELSE CASE
                    WHEN p.r_reg < 0.10 THEN timestamptz '2025-02-03' + random() * interval '42 days'
                    WHEN p.r_reg < 0.20 THEN timestamptz '2025-08-04' + random() * interval '45 days'
                    WHEN p.r_reg < 0.30 THEN timestamptz '2026-02-02' + random() * interval '42 days'
                    WHEN p.r_reg < 0.38 THEN timestamptz '2026-08-03' + random() * interval '50 days'
                    ELSE now() - ((3 + random() * 1500) || ' days')::interval END
           END AS fecha_reg,
           random() AS r_perfil
    FROM (SELECT *, random() AS r_reg FROM (SELECT * FROM lector UNION ALL SELECT * FROM bib) u) p, nombres nm;

    IF EXISTS (SELECT 1 FROM personas WHERE correo IS NULL OR nombre IS NULL) THEN RAISE EXCEPTION 'Hay personas sin nombre: revisa las listas de nombres y apellidos'; END IF;
    IF (SELECT count(DISTINCT correo) FROM personas) <> (SELECT count(*) FROM personas) THEN RAISE EXCEPTION 'Hay correos repetidos entre las personas simuladas'; END IF;

    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    SELECT id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', correo, '', fecha_reg,
           '{"provider":"email","providers":["email"]}'::jsonb,
           jsonb_build_object('nombre_completo', nombre), fecha_reg, fecha_reg
    FROM personas;

    UPDATE public.usuarios u
    SET id_rol = CASE WHEN p.tipo = 'B' THEN v_rol_bib ELSE u.id_rol END,
        nombrecompleto_usuario = p.nombre,
        documento_usuario = CASE WHEN p.tipo = 'B' THEN '5' || lpad((p.idx * 7919 % 1000000000)::text, 9, '0')
                                 WHEN p.idx % 3 = 0 THEN (43000000 + p.idx * 4909)::text
                                 ELSE '10' || lpad((p.idx * 59981 % 100000000)::text, 8, '0') END,
        telefono_usuario = (ARRAY['300','301','302','304','310','311','312','313','314','315','316','317','318','319','320','321','322','323','350','351'])[1 + p.idx % 20]
                           || lpad(((p.idx * 104729 + p.n * 13) % 10000000)::text, 7, '0'),
        fecharegistro_usuario = p.fecha_reg
    FROM personas p WHERE u.id_usuario = p.id;

    -- Perfil de uso (15 % frecuente, 35 % regular, 50 % ocasional) y dos categorías favoritas
    CREATE TEMP TABLE cat_w ON COMMIT DROP AS
    SELECT c.id_categorias_libros AS id_categoria,
           (CASE c.nombre_categlib WHEN 'Novela' THEN 30 WHEN 'Juvenil' THEN 12 WHEN 'Infantil' THEN 6 WHEN 'Cuento' THEN 4 WHEN 'Poesía' THEN 4
                WHEN 'Ensayo y crónica' THEN 4 WHEN 'Biografías y memorias' THEN 4 WHEN 'Historia' THEN 4 WHEN 'Ciencias sociales' THEN 4
                WHEN 'Filosofía y psicología' THEN 4 WHEN 'Tecnología y computación' THEN 4 WHEN 'Cómic y novela gráfica' THEN 4
                WHEN 'Ciencias naturales' THEN 3 WHEN 'Salud y bienestar' THEN 3 WHEN 'Economía y emprendimiento' THEN 3
                WHEN 'Teatro' THEN 2 WHEN 'Arte y arquitectura' THEN 2 WHEN 'Educación y pedagogía' THEN 2 ELSE 1 END)::numeric AS w
    FROM public.categorias_libros c;

    CREATE TEMP TABLE cat_rng ON COMMIT DROP AS
    SELECT id_categoria, sum(w) OVER (ORDER BY id_categoria) - w AS lo, sum(w) OVER (ORDER BY id_categoria) AS hi FROM cat_w;

    CREATE TEMP TABLE draws ON COMMIT DROP AS
    SELECT p.id, CASE WHEN p.r_perfil < 0.15 THEN 'frecuente' WHEN p.r_perfil < 0.50 THEN 'regular' ELSE 'ocasional' END AS perfil,
           random() * (SELECT max(hi) FROM cat_rng) AS d1, random() * (SELECT max(hi) FROM cat_rng) AS d2
    FROM personas p WHERE p.tipo = 'L';

    CREATE TABLE sim.perfil AS
    SELECT d.id AS id_usuario, d.perfil, c1.id_categoria AS cat1, c2.id_categoria AS cat2
    FROM draws d
    JOIN cat_rng c1 ON d.d1 >= c1.lo AND d.d1 < c1.hi
    JOIN cat_rng c2 ON d.d2 >= c2.lo AND d.d2 < c2.hi;
END $$;
