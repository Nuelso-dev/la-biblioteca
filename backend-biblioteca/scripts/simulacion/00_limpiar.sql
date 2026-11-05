-- Revierte toda la simulación: usuarios @simulado.test (lectores y bibliotecarios) con su actividad, auditorías,
-- favoritos y notificaciones, y todo lo agregado al catálogo y a las sedes, identificado por los ids del estado original
-- (libros > 306, autores > 77, ejemplares > 1047, ubicaciones > 145, bibliotecas > 20, categorías > 35, editoriales > 58).
-- Libera los ejemplares originales que quedaron prestados/perdidos. Si una cuenta real (p. ej. el administrador) tiene
-- préstamos o solicitudes sobre un ejemplar simulado, se eliminan junto con él; los movimientos sobre ejemplares
-- originales se conservan.
DO $$
DECLARE
    x_disp INTEGER;
BEGIN
    SELECT id_estado INTO x_disp FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='DISPONIBLE';

    CREATE TEMP TABLE sim_ids ON COMMIT DROP AS
    SELECT id FROM auth.users WHERE email LIKE '%@simulado.test';

    -- Ejemplares originales que la simulación dejó prestados, reservados o perdidos (se liberan al final)
    CREATE TEMP TABLE tocados ON COMMIT DROP AS
    SELECT id_ejemplar FROM public.prestamos WHERE id_usuario IN (SELECT id FROM sim_ids) AND id_ejemplar <= 1047
    UNION SELECT id_ejemplar FROM public.solicitudes WHERE id_usuario IN (SELECT id FROM sim_ids) AND id_ejemplar <= 1047;

    -- Auditorías de la simulación: las de los usuarios simulados y las de multas exoneradas por el administrador
    DELETE FROM public.auditorias WHERE id_usuario IN (SELECT id FROM sim_ids);
    DELETE FROM public.auditorias a
    WHERE a.tablaafectada_auditoria = 'Multas' AND a.accion_auditoria = 'CANCELAR_MULTA'
      AND NOT EXISTS (SELECT 1 FROM public.multas m WHERE m.id_multa = a.idregistro_auditoria)
      AND a.fecha_auditoria > now() - interval '400 days' AND a.idregistro_auditoria > 0;
    DELETE FROM public.auditorias a
    USING public.multas m JOIN public.prestamos p ON p.id_prestamo = m.id_prestamo
    WHERE a.tablaafectada_auditoria = 'Multas' AND a.accion_auditoria = 'CANCELAR_MULTA' AND a.idregistro_auditoria = m.id_multa
      AND p.id_usuario IN (SELECT id FROM sim_ids);

    DELETE FROM public.prestamos WHERE id_usuario IN (SELECT id FROM sim_ids);      -- multas en cascada
    DELETE FROM auth.users WHERE id IN (SELECT id FROM sim_ids);                    -- usuarios, solicitudes, notificaciones y favoritos en cascada
    -- Se liberan salvo que una cuenta real tenga el ejemplar en préstamo (estado PRESTADO) o reservado
    UPDATE public.ejemplares e
    SET id_estado_ejemplar = CASE
        WHEN EXISTS (SELECT 1 FROM public.prestamos p JOIN public.estados s ON s.id_estado = p.id_estado_prestamo
                     WHERE p.id_ejemplar = e.id_ejemplar AND s.codigo_estado IN ('ACTIVO', 'VENCIDO'))
            THEN (SELECT id_estado FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='PRESTADO')
        ELSE x_disp END
    WHERE e.id_ejemplar IN (SELECT id_ejemplar FROM tocados) AND e.id_estado_ejemplar <> x_disp;

    DELETE FROM public.prestamos WHERE id_ejemplar > 1047;
    DELETE FROM public.solicitudes WHERE id_ejemplar > 1047;
    DELETE FROM public.ejemplares WHERE id_ejemplar > 1047;
    DELETE FROM public.libros WHERE id_libro > 306;                                 -- libros_autores en cascada
    DELETE FROM public.autores WHERE id_autor > 77;
    DELETE FROM public.ubicaciones WHERE id_ubicacion > 145;
    DELETE FROM public.bibliotecas WHERE id_biblioteca > 20;                        -- ubicaciones restantes en cascada
    DELETE FROM public.categorias_libros WHERE id_categorias_libros > 35;
    DELETE FROM public.editoriales WHERE id_editorial > 58;
END $$;

DROP SCHEMA IF EXISTS sim CASCADE;
