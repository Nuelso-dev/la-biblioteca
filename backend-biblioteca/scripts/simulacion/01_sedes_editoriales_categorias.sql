-- Sedes reales de bibliotecas públicas de Colombia (direcciones verificadas en fuentes oficiales: Sistema de
-- Bibliotecas Públicas de Medellín, Comfama, BibloRed, Banco de la República, redes municipales y departamentales),
-- con ubicaciones internas, más editoriales y categorías nuevas. Coordenadas de OpenStreetMap (algunas a nivel de barrio).
-- Tamaño de cada sede: G = grande, M = mediana, P = pequeña (define cuántas ubicaciones tiene y cuántos ejemplares recibe).
DO $$
DECLARE
    e_activa_bib INTEGER; e_activa_ubi INTEGER; e_activa_cat INTEGER; e_activa_edi INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM public.bibliotecas WHERE id_biblioteca > 20) THEN
        RAISE EXCEPTION 'Las sedes simuladas ya existen; ejecuta primero 00_limpiar.sql';
    END IF;
    SELECT id_estado INTO e_activa_bib FROM public.estados WHERE entidad_estado='biblioteca' AND codigo_estado='ACTIVA';
    SELECT id_estado INTO e_activa_ubi FROM public.estados WHERE entidad_estado='ubicacion' AND codigo_estado='ACTIVA';
    SELECT id_estado INTO e_activa_cat FROM public.estados WHERE entidad_estado='categoria_libro' AND codigo_estado='ACTIVA';
    SELECT id_estado INTO e_activa_edi FROM public.estados WHERE entidad_estado='editorial' AND codigo_estado='ACTIVA';

    -- ===== Categorías nuevas =====
    INSERT INTO public.categorias_libros (id_estado_categlib, nombre_categlib, descripcion_categlib)
    SELECT e_activa_cat, n, d FROM (VALUES
        ('Ciencia ficción y fantasía', 'Ciencia ficción, fantasía épica y literatura especulativa'),
        ('Misterio y suspenso', 'Novela negra, policial, thriller y suspenso'),
        ('Romance', 'Novela romántica y narrativa sentimental'),
        ('Terror', 'Literatura de terror, gótica y sobrenatural'),
        ('Religión y espiritualidad', 'Textos sagrados, teología y crecimiento espiritual'),
        ('Derecho', 'Legislación, doctrina y teoría jurídica'),
        ('Gastronomía y hogar', 'Cocina, nutrición, orden y vida en casa'),
        ('Viajes y geografía', 'Crónicas de viaje, atlas y guías geográficas'),
        ('Deportes y recreación', 'Deporte, entrenamiento, juegos y tiempo libre')
    ) v(n, d)
    WHERE NOT EXISTS (SELECT 1 FROM public.categorias_libros c WHERE c.nombre_categlib = v.n);

    -- ===== Editoriales =====
    INSERT INTO public.editoriales (id_estado_editorial, nombre_editorial, pais_editorial)
    SELECT e_activa_edi, n, p FROM (VALUES
        ('Literatura Random House','Colombia'),('Reservoir Books','España'),('Roca Editorial','España'),('Nova','España'),
        ('Alamut','España'),('Hidra','España'),('Acantilado','España'),('Losada','Argentina'),('Península','España'),
        ('Capitán Swing','España'),('Pre-Textos','España'),('Herder','España'),('Akal','España'),('Trotta','España'),
        ('Gedisa','España'),('Kairós','España'),('Deusto','España'),('Empresa Activa','España'),('Pirámide','España'),
        ('Conecta','España'),('Aguilar','España'),('Galaxia Gutenberg','España'),('Bartleby','España'),
        ('Cabaret Voltaire','España'),('Mondadori','España'),('Oniro','España'),('Gaia','España'),('Sirio','España'),
        ('Elipse','España'),('Obelisco','España'),('Unión Editorial','España'),('Tecnos','España'),('Ariel','España'),
        ('Booket','España'),('Grijalbo','España'),('Titania','España'),('SM','España'),('Kalandraka','España'),
        ('Kókinos','España'),('Bruño','España'),('Beascoa','España'),('Juventud','España'),('Panini','Italia'),
        ('Glénat','España'),('ECC','España'),('Astiberri','España'),('Planeta Cómic','España'),('Vertigo','Estados Unidos'),
        ('Random House','Estados Unidos'),('Santillana Educación','Colombia'),('Voluntad','Colombia'),('Araluce','España'),
        ('Morata','España'),('Laia','España'),('Trillas','México'),('Elsevier','España'),('McGraw-Hill','México'),
        ('Pearson','España'),('Anaya Multimedia','España'),('Reverté','España'),('Addison-Wesley','Estados Unidos'),
        ('O''Reilly','Estados Unidos'),('No Starch Press','Estados Unidos'),('Temis','Colombia'),('Porrúa','México'),
        ('Abeledo-Perrot','Argentina'),('Centro de Estudios Políticos y Constitucionales','España'),('Larousse','España'),
        ('Vox','España'),('Oxford University Press','Reino Unido'),('Verbo Divino','España'),('Sígueme','España'),
        ('Self-Realization Fellowship','Estados Unidos'),('Desnivel','España'),('Duomo','España'),('Global Rhythm','España'),
        ('Malpaso','España'),('Maeva','España'),('Salvat','España'),('Zendrera Zariquiey','España'),
        ('Cambridge University Press','Reino Unido'),('Babel','Colombia'),('Visor','España'),('Joaquín Mortiz','México'),
        ('Era','México'),('Teell','España'),('Gestión 2000','España'),('Océano','España'),('Destino','España'),
        ('Minotauro','España'),('Edhasa','España'),('Península Ediciones','España'),('Tercer Mundo','Colombia'),
        ('Siglo del Hombre Editores','Colombia'),('Universidad Externado de Colombia','Colombia'),
        ('Editorial Javeriana','Colombia'),('Editorial Universidad del Rosario','Colombia'),('Taurus','España'),
        ('Fondo Editorial EAFIT','Colombia'),('Ediciones Uniandes','Colombia'),('Editorial Universidad Nacional','Colombia'),
        ('Editorial Planeta Colombiana','Colombia'),('Alfaguara Infantil y Juvenil','España'),('Ediciones Gamma','Colombia'),
        ('Editorial Libros & Libros','Colombia'),('Intermedio Editores','Colombia'),('Grupo Editorial Norma','Colombia'),
        ('Editorial Cincel','Colombia'),('Editorial Escuela Nueva','Colombia'),('Ecoe Ediciones','Colombia'),
        ('Alfaomega','México'),('Cengage Learning','México'),('Editorial Médica Panamericana','España'),('Ediciones Díaz de Santos','España')
    ) v(n, p)
    WHERE NOT EXISTS (SELECT 1 FROM public.editoriales e WHERE e.nombre_editorial = v.n);

    -- ===== Sedes =====
    CREATE TEMP TABLE sedes_nuevas ON COMMIT DROP AS
    SELECT row_number() OVER () AS n, v.* FROM (VALUES
    -- nombre | dirección | teléfono | tamaño | horario | lat | lon
    ('Parque Biblioteca Gabriel García Márquez (Doce de Octubre)','Carrera 80 # 104–04','(604) 557 03 92','M','Lunes a sábado, 9:00 a. m. a 8:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.3043288,-75.5777593),
    ('Biblioteca Pública El Poblado (UVA Ilusión Verde)','Calle 3B Sur # 29B–56','(604) 557 04 19','P','Lunes a sábado, 9:00 a. m. a 7:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.1869511,-75.5596803),
    ('Parque Biblioteca España (Santo Domingo Savio)','Carrera 33B # 107A–100','(604) 428 92 30','M','Lunes a sábado, 9:00 a. m. a 7:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2946945,-75.5441955),
    ('Parque Biblioteca Tomás Carrasquilla (La Quintana)','Carrera 80 # 82–60','(604) 557 04 01','M','Lunes a sábado, 9:00 a. m. a 7:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2853467,-75.5835502),
    ('Biblioteca Pública Altavista','Calle 18 # 103–160','(604) 557 04 83','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.2274461,-75.6354695),
    ('Parque Biblioteca Fernando Botero (San Cristóbal)','Calle 62 # 131–80','(604) 557 03 95','M','Lunes a sábado, 9:00 a. m. a 8:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2778166,-75.6369685),
    ('Parque Biblioteca Presbítero José Luis Arroyave (San Javier)','Calle 42C # 95–50','(604) 557 03 98','M','Lunes a sábado, 9:00 a. m. a 8:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2547928,-75.6135718),
    ('Parque Biblioteca León de Greiff (La Ladera)','Calle 59A # 36–30','(604) 557 04 05','M','Lunes a sábado, 9:00 a. m. a 7:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2514525,-75.5538701),
    ('Parque Biblioteca Nuevo Occidente (Lusitania)','Carrera 109A # 63B–321','(604) 460 84 15','M','Lunes a sábado, 9:00 a. m. a 7:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2795047,-75.6189083),
    ('Parque Biblioteca Manuel Mejía Vallejo (Guayabal)','Carrera 65 # 14–115','(604) 557 03 90','M','Lunes a sábado, 9:00 a. m. a 7:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2203906,-75.5861471),
    ('Parque Biblioteca José Horacio Betancur (San Antonio de Prado)','Calle 50E Sur # 75A–94','(604) 557 09 71','M','Lunes a sábado, 9:00 a. m. a 8:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.1771854,-75.6544372),
    ('Parque Biblioteca Belén','Carrera 76 # 18A–19','(604) 557 04 25','M','Lunes a sábado, 9:00 a. m. a 8:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2240156,-75.5981252),
    ('Biblioteca Fernando Gómez Martínez (Robledo)','Carrera 88C # 76DD–20','(604) 557 02 17','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.2829520,-75.5925463),
    ('Biblioteca Pública La Floresta','Carrera 86 # 46–55','(604) 557 03 88','P','Lunes a sábado, 9:00 a. m. a 7:00 p. m. Domingos y festivos, 10:00 a. m. a 4:00 p. m.',6.2566117,-75.6024212),
    ('Biblioteca Pública Santa Cruz','Carrera 48 # 98A–63','(604) 557 04 27','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.2900007,-75.5555961),
    ('Biblioteca Pública Centro Occidental (El Salado)','Calle 39D # 112–81','(604) 511 21 33 Ext. 2701-2702','P','Lunes a sábado, 9:00 a. m. a 5:00 p. m.',6.2534352,-75.6247825),
    ('Biblioteca Pública El Limonar','Calle 57 Sur # 61–02','(604) 557 04 11','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.1737085,-75.6426148),
    ('Biblioteca Pública María Agudelo Mejía (Ávila)','Calle 39 # 38–21','(604) 557 04 17','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.2370571,-75.5618955),
    ('Biblioteca Público Escolar Granizal','Carrera 36B # 102C–54','(604) 557 04 29','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.2940694,-75.5441603),
    ('Biblioteca Público Escolar Popular No. 2','Carrera 43 # 118–26','(604) 557 04 13','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.3023685,-75.5470629),
    ('Biblioteca Pública Corregimental Santa Elena','Calle 10 # 40 Este–62','(604) 557 04 09','P','Lunes a viernes, 9:00 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',6.2093149,-75.4975717),
    ('Biblioteca Pública Piloto de Medellín','Carrera 64 # 50–32','(604) 460 05 90','G','Lunes a viernes, 8:30 a. m. a 7:00 p. m. Sábados, 9:00 a. m. a 6:00 p. m.',6.2554386,-75.5775126),
    ('Biblioteca La Ceja','Calle 19 # 13B–105','(60)(4) 2162900 Ext. 2812-2816','P','Lunes a viernes, 8:00 a. m. a 6:00 p. m. Sábados, 8:00 a. m. a 2:00 p. m.',6.0296,-75.4316),
    ('Biblioteca Luis Ángel Arango','Calle 11 # 4–14','(601) 343 12 12','G','Lunes a sábado, 8:00 a. m. a 7:00 p. m. Domingos, 9:00 a. m. a 4:00 p. m.',4.5971988,-74.0729124),
    ('Biblioteca Nacional de Colombia','Calle 24 # 5–60',NULL,'G','Lunes a viernes, 8:00 a. m. a 5:00 p. m. Sábados, 9:00 a. m. a 4:00 p. m.',4.6095552,-74.0685345),
    ('Biblioteca Pública Virgilio Barco','Avenida Carrera 60 # 57–60','(601) 580 30 50','G','Martes a sábado, 8:00 a. m. a 7:00 p. m. Domingos, 10:00 a. m. a 5:00 p. m.',4.6569529,-74.0882974),
    ('Biblioteca Pública El Tunal Gabriel García Márquez','Carrera 20 # 47B–35 Sur','(601) 580 30 50','G','Martes a sábado, 8:00 a. m. a 8:00 p. m. Domingos, 10:00 a. m. a 5:00 p. m.',4.5722396,-74.1300288),
    ('Biblioteca Pública El Tintal Manuel Zapata Olivella','Avenida Ciudad de Cali # 6C–09','(601) 580 30 50','G','Martes a sábado, 8:00 a. m. a 8:00 p. m. Domingos, 10:00 a. m. a 5:00 p. m.',4.6438963,-74.1537672),
    ('Biblioteca Pública Julio Mario Santo Domingo','Avenida Calle 170 # 67–51','(601) 580 30 50','G','Martes a sábado, 8:00 a. m. a 7:00 p. m. Domingos, 10:00 a. m. a 5:00 p. m.',4.7566147,-74.0626286),
    ('Biblioteca Pública del Centenario (Cali)','Calle 4 Oeste # 1–16',NULL,'M','Lunes a viernes, 8:00 a. m. a 5:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',3.4506336,-76.5437934),
    ('Biblioteca Pública Municipal José Martí (Cali)','Calle 67 Norte # 6–47',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.4722025,-76.5198344),
    ('Biblioteca Pública La Unión (Cali)','Carrera 41F # 39–118',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.4085983,-76.5077995),
    ('Biblioteca Pública El Jardín (Cali)','Calle 27 # 36–10',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.4245810,-76.5181200),
    ('Biblioteca Pública Municipal Desepaz (Cali)','Carrera 23 # 120–00',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.4144543,-76.4680463),
    ('Biblioteca Pública Daniel Guillard – Los Lagos (Cali)','Carrera 26U # 72W–23',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.4296220,-76.4866340),
    ('Centro de Emprendimiento Cultural Comuna 13 (Cali)','Diagonal 28D # 72F–1',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.4155708,-76.5004098),
    ('Biblioteca Pública Central Didáctica El Poblado (Cali)','Calle 72L # 28J–39',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.4205777,-76.4901692),
    ('Biblioteca Pública Centro Cultural Comuna 18 (Cali)','Calle 1A Oeste # 93–24',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',3.3775370,-76.5548503),
    ('Biblioteca Departamental Jorge Garcés Borrero (Cali)','Calle 5 # 24A–91',NULL,'G','Lunes a viernes, 9:00 a. m. a 7:00 p. m. Sábados, 9:00 a. m. a 6:00 p. m. Domingos, 10:00 a. m. a 3:00 p. m.',3.4362817,-76.5394259),
    ('Biblioteca Piloto del Caribe (Barranquilla)','Vía 40 # 36–135','(605) 379 29 49','G','Lunes a viernes, 8:00 a. m. a 5:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',10.9887504,-74.7790975),
    ('Biblioteca Pública Departamental Meira Delmar (Barranquilla)','Calle 38 # 38B–21',NULL,'G','Lunes a viernes, 8:00 a. m. a 4:00 p. m.',10.9785947,-74.7819312),
    ('Biblioteca Bartolomé Calvo (Cartagena)','Calle 33 # 3–123','(605) 664 61 91','G','Lunes a viernes, 8:30 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',10.4228402,-75.5518476),
    ('Biblioteca del Banco de la República (Santa Marta)','Calle 14 # 1C–37',NULL,'M','Lunes a viernes, 8:30 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',11.2454452,-74.2136576),
    ('Biblioteca Rafael Carrillo Lúquez (Valledupar)','Calle 15 # 12A','323 364 67 59','M','Lunes a viernes, 8:00 a. m. a 12:30 p. m. y 2:30 p. m. a 6:30 p. m. Sábados, 8:00 a. m. a 12:00 m.',10.4735722,-73.2517229),
    ('Centro Cultural del Banco de la República (Montería)','Carrera 3 # 28–59',NULL,'M','Lunes a viernes, 8:30 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',8.7564119,-75.8863445),
    ('Biblioteca Departamental David Martínez (Montería)','Calle 29 # 5–64',NULL,'P','Lunes a viernes, 8:00 a. m. a 5:00 p. m.',8.7579,-75.8868),
    ('Biblioteca Pública Gabriel Turbay (Bucaramanga)','Calle 30 # 26–177','(607) 634 11 32','G','Lunes a viernes, 8:00 a. m. a 11:45 a. m. y 1:00 p. m. a 4:45 p. m. Sábados, 8:00 a. m. a 11:45 a. m. y 1:00 p. m. a 3:45 p. m.',7.1265327,-73.1190963),
    ('Biblioteca Pública Julio Pérez Ferrero (Cúcuta)','Avenida 1 # 12–35','(607) 572 31 86','G','Lunes a viernes, 8:00 a. m. a 6:00 p. m. Sábados, 8:00 a. m. a 2:00 p. m.',7.8853563,-72.4997477),
    ('Biblioteca Pública Ramón Correa Mejía (Pereira)','Carrera 10 # 16–60','(606) 324 87 43','M','Lunes a viernes, 8:00 a. m. a 6:00 p. m.',4.8122120,-75.6923072),
    ('Biblioteca Pública Municipal Aquilino Villegas (Manizales)','Calle 21 # 19–07',  '(606) 884 44 95','M','Lunes a viernes, 8:00 a. m. a 6:00 p. m.',5.0697354,-75.5164210),
    ('Biblioteca Darío Echandía (Ibagué)','Carrera 3A # 11–26','(608) 261 17 55','M','Lunes a viernes, 8:30 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',4.4444424,-75.2408251),
    ('Biblioteca del Banco de la República (Pasto)','Carrera 21 # 18–27',NULL,'M','Lunes a viernes, 8:30 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',1.2114157,-77.2770464),
    ('Biblioteca del Banco de la República (Popayán)','Carrera 6A # 2–78',NULL,'M','Lunes a viernes, 8:30 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',2.4433774,-76.6055323),
    ('Biblioteca Pública Germán Arciniegas (Villavicencio)','Carrera 45A # 8–16',NULL,'M','Lunes a viernes, 8:00 a. m. a 12:00 m. y 2:00 p. m. a 6:00 p. m. Sábados, 8:00 a. m. a 5:30 p. m.',4.1272836,-73.6358519),
    ('Biblioteca del Banco de la República (Tunja)','Calle 20 # 8–66','(608) 742 23 11','M','Lunes a viernes, 8:30 a. m. a 6:00 p. m. Sábados, 9:00 a. m. a 1:00 p. m.',5.5394857,-73.3578285)
    ) AS v(nombre, direccion, telefono, tam, horario, lat, lon);

    INSERT INTO public.bibliotecas (id_estado_biblioteca, nombre_biblioteca, direccion_biblioteca, telefono_biblioteca,
                                    descripcion_biblioteca, latitud_biblioteca, longitud_biblioteca)
    SELECT e_activa_bib, nombre, direccion, telefono, horario, lat, lon FROM sedes_nuevas ORDER BY n;

    -- ===== Ubicaciones internas =====
    CREATE TEMP TABLE plantilla ON COMMIT DROP AS
    SELECT row_number() OVER () AS prioridad, v.* FROM (VALUES
        ('Piso 1 - Sala general','Literatura y novela','A1-A6','Novela y cuento en español y traducidos'),
        ('Sala infantil y juvenil','Literatura infantil','J1-J6','Álbumes ilustrados y libros para primeros lectores'),
        ('Piso 2 - Sala de conocimiento','Ciencias sociales e historia','C1-C8','Historia, sociología, política y economía'),
        ('Piso 2 - Sala de conocimiento','Ciencias y tecnología','D1-D5','Ciencias naturales, ingeniería y computación'),
        ('Piso 1 - Sala general','Poesía y teatro','B1-B3','Poesía, dramaturgia y ensayo literario'),
        ('Piso 1 - Sala general','Novedades','N1-N2','Adquisiciones de los últimos meses'),
        ('Sala infantil y juvenil','Literatura juvenil y cómic','J7-J10','Novela juvenil, manga, cómic y novela gráfica'),
        ('Piso 1 - Sala general','Novela de género','G1-G6','Ciencia ficción, misterio, romance y terror'),
        ('Piso 1 - Sala general','Literatura colombiana','A9-A12','Autores nacionales y regionales'),
        ('Piso 2 - Sala de conocimiento','Filosofía y psicología','E1-E4','Pensamiento, psicología y ética'),
        ('Piso 1 - Sala general','Biografías y memorias','A7-A8','Vidas de personajes históricos, artistas y científicos'),
        ('Piso 2 - Sala de conocimiento','Derecho y economía','F1-F4','Derecho, economía y emprendimiento'),
        ('Piso 2 - Sala de conocimiento','Vida práctica y ocio','V1-V4','Salud, gastronomía, viajes, deportes y espiritualidad'),
        ('Piso 2 - Sala de conocimiento','Referencia y consulta','R1-R3','Diccionarios, enciclopedias y atlas'),
        ('Sala de estudio','Educación e idiomas','S1-S3','Pedagogía, textos escolares e idiomas'),
        ('Piso 2 - Sala de conocimiento','Arte, música y cine','K1-K4','Artes plásticas, arquitectura, música y cine'),
        ('Hemeroteca','Revistas y periódicos','H1-H2','Publicaciones periódicas y archivo reciente')
    ) v(nombre, seccion, estanteria, descripcion);

    INSERT INTO public.ubicaciones (id_biblioteca, id_estado_ubicacion, nombre_ubicacion, seccion_ubicacion, estanteria_ubicacion, descripcion_ubicacion)
    SELECT b.id_biblioteca, e_activa_ubi, p.nombre, p.seccion, p.estanteria, p.descripcion
    FROM sedes_nuevas s
    JOIN public.bibliotecas b ON b.nombre_biblioteca = s.nombre
    JOIN plantilla p ON p.prioridad <= CASE s.tam WHEN 'G' THEN 17 WHEN 'M' THEN 13 ELSE 9 END;

    -- Las 10 sedes originales reciben las secciones de género, derecho y vida práctica que les faltan
    INSERT INTO public.ubicaciones (id_biblioteca, id_estado_ubicacion, nombre_ubicacion, seccion_ubicacion, estanteria_ubicacion, descripcion_ubicacion)
    SELECT b.id_biblioteca, e_activa_ubi, p.nombre, p.seccion, p.estanteria, p.descripcion
    FROM public.bibliotecas b
    JOIN plantilla p ON p.seccion IN ('Novela de género', 'Derecho y economía', 'Vida práctica y ocio')
    WHERE b.id_biblioteca <= 20;
END $$;

SELECT (SELECT count(*) FROM public.bibliotecas) sedes, (SELECT count(*) FROM public.ubicaciones) ubicaciones,
       (SELECT count(*) FROM public.editoriales) editoriales, (SELECT count(*) FROM public.categorias_libros) categorias;
