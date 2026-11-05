-- Notificaciones, auditoría y favoritos derivados de la actividad simulada por 04_actividad.sql.
-- Los títulos y mensajes replican los que genera el backend (notificaciones y acciones de auditoría reales).
-- Al terminar elimina el esquema auxiliar sim.
DO $$
DECLARE
    admin_id UUID;
    n_leida INTEGER; n_no INTEGER;
    s_apro INTEGER; s_rech INTEGER; s_pend INTEGER; s_canc INTEGER;
    p_act INTEGER; p_venc INTEGER; p_perd INTEGER;
    m_pend INTEGER; m_pag INTEGER; m_canc INTEGER;
    tz CONSTANT TEXT := 'America/Bogota';
BEGIN
    IF to_regclass('sim.plan') IS NULL THEN RAISE EXCEPTION 'Falta sim.plan: ejecuta 04_actividad.sql'; END IF;
    IF EXISTS (SELECT 1 FROM public.favoritos f JOIN public.usuarios u ON u.id_usuario = f.id_usuario WHERE u.correo_usuario LIKE '%@simulado.test') THEN
        RAISE EXCEPTION 'Ya hay extras simulados; ejecuta primero 00_limpiar.sql y repite las etapas';
    END IF;

    SELECT id_usuario INTO admin_id FROM public.usuarios WHERE id_rol = 1 ORDER BY fecharegistro_usuario LIMIT 1;
    SELECT id_estado INTO n_leida FROM public.estados WHERE entidad_estado='notificacion' AND codigo_estado='LEIDA';
    SELECT id_estado INTO n_no    FROM public.estados WHERE entidad_estado='notificacion' AND codigo_estado='NO_LEIDA';
    SELECT id_estado INTO s_apro FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='APROBADA';
    SELECT id_estado INTO s_rech FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='RECHAZADA';
    SELECT id_estado INTO s_pend FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='PENDIENTE';
    SELECT id_estado INTO s_canc FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='CANCELADA';
    SELECT id_estado INTO p_act  FROM public.estados WHERE entidad_estado='prestamo' AND codigo_estado='ACTIVO';
    SELECT id_estado INTO p_venc FROM public.estados WHERE entidad_estado='prestamo' AND codigo_estado='VENCIDO';
    SELECT id_estado INTO p_perd FROM public.estados WHERE entidad_estado='prestamo' AND codigo_estado='PERDIDO';
    SELECT id_estado INTO m_pend FROM public.estados WHERE entidad_estado='multa' AND codigo_estado='PENDIENTE';
    SELECT id_estado INTO m_pag  FROM public.estados WHERE entidad_estado='multa' AND codigo_estado='PAGADA';
    SELECT id_estado INTO m_canc FROM public.estados WHERE entidad_estado='multa' AND codigo_estado='CANCELADA';

    -- Solo la actividad simulada: la de cuentas reales (p. ej. pruebas en la aplicación) no se toca
    CREATE TEMP TABLE sol_sim ON COMMIT DROP AS
    SELECT s.* FROM public.solicitudes s JOIN public.usuarios u ON u.id_usuario = s.id_usuario WHERE u.correo_usuario LIKE '%@simulado.test';

    -- Vista plana de cada préstamo con su libro, solicitud y multa
    CREATE TEMP TABLE pv ON COMMIT DROP AS
    SELECT p.id_prestamo, p.id_usuario, p.id_ejemplar, p.id_estado_prestamo, p.fechaprestamo_prestamo AS f_pre,
           p.fechadevolucion_prestamo AS f_dev, p.fechavencimiento_prestamo AS f_venc, l.titulo_libro AS titulo,
           pl.renovado, pl.venc_orig, pl.renov_ts, pl.staff_reg, pl.staff_dev, pl.staff_pago,
           m.id_multa, m.id_estado_multa, m.valor_multa, m.fechageneracion_multa AS f_mul, m.fechapago_multa AS f_pago,
           least(m.fechageneracion_multa + (2 + m.id_multa % 12) * interval '1 day' + interval '3 hours', now() - interval '1 hour') AS f_exo,
           p.id_solicitud
    FROM public.prestamos p
    JOIN sim.plan pl ON pl.id_prestamo = p.id_prestamo
    JOIN public.ejemplares e ON e.id_ejemplar = p.id_ejemplar
    JOIN public.libros l ON l.id_libro = e.id_libro
    LEFT JOIN public.multas m ON m.id_prestamo = p.id_prestamo;

    -- ===== Notificaciones =====
    CREATE TEMP TABLE ev ON COMMIT DROP AS
    SELECT s.id_usuario, s.fecharespuesta_solicitud AS ts,
           'Solicitud de libro ' || CASE WHEN s.id_estado_solicitud = s_apro THEN 'aprobada' ELSE 'rechazada' END AS titulo,
           'Tu solicitud para el libro "' || l.titulo_libro || '" ha sido ' || CASE WHEN s.id_estado_solicitud = s_apro THEN 'aprobada' ELSE 'rechazada' END || '.'
             || CASE WHEN s.observaciones_solicitud IS NOT NULL THEN ' Nota: ' || s.observaciones_solicitud ELSE '' END AS mensaje,
           'SOLICITUD' AS tipo
    FROM sol_sim s
    JOIN public.ejemplares e ON e.id_ejemplar = s.id_ejemplar JOIN public.libros l ON l.id_libro = e.id_libro
    WHERE s.id_estado_solicitud IN (s_apro, s_rech) AND s.fecharespuesta_solicitud IS NOT NULL
    UNION ALL
    SELECT id_usuario, f_pre + interval '2 seconds', 'Préstamo registrado',
           'Se registró el préstamo de "' || titulo || '". Devuélvelo antes del ' || to_char(venc_orig AT TIME ZONE tz, 'FMDD/FMMM/YYYY') || '.', 'PRESTAMO'
    FROM pv
    UNION ALL
    SELECT id_usuario, renov_ts, 'Préstamo renovado',
           'Tu préstamo de "' || titulo || '" ahora vence el ' || to_char(f_venc AT TIME ZONE tz, 'FMDD/FMMM/YYYY') || '.', 'PRESTAMO'
    FROM pv WHERE renovado AND renov_ts IS NOT NULL
    UNION ALL
    SELECT id_usuario, f_venc + interval '2 hours', 'Préstamo vencido',
           'Tu préstamo de "' || titulo || '" ya venció. Devuélvelo lo antes posible: se genera una multa por cada día de retraso.', 'PRESTAMO'
    FROM pv WHERE f_venc + interval '2 hours' <= coalesce(f_dev, now())
    UNION ALL
    SELECT id_usuario, f_dev + interval '3 seconds', 'Devolución registrada',
           CASE WHEN id_multa IS NOT NULL
                THEN 'Recibimos "' || titulo || '" con retraso. Se generó una multa de $' || replace(to_char(valor_multa, 'FM999,999,999'), ',', '.') || '.'
                ELSE 'Recibimos "' || titulo || '". ¡Gracias por devolverlo a tiempo!' END,
           CASE WHEN id_multa IS NOT NULL THEN 'MULTA' ELSE 'PRESTAMO' END
    FROM pv WHERE f_dev IS NOT NULL
    UNION ALL
    SELECT id_usuario, f_pago + interval '2 seconds', 'Multa pagada',
           'Registramos el pago de tu multa por "' || titulo || '" ($' || replace(to_char(valor_multa, 'FM999,999,999'), ',', '.') || ').', 'MULTA'
    FROM pv WHERE id_estado_multa = m_pag
    UNION ALL
    SELECT id_usuario, f_exo + interval '2 seconds', 'Multa exonerada',
           'Tu multa por "' || titulo || '" fue cancelada por la administración.', 'MULTA'
    FROM pv WHERE id_estado_multa = m_canc;

    INSERT INTO public.notificaciones (id_usuario, id_estado_notificacion, titulo_notificacion, mensaje_notificacion,
                                       tipo_notificacion, fechacreacion_notificacion)
    SELECT id_usuario,
           CASE WHEN random() < CASE WHEN now() - ts > interval '14 days' THEN 0.92 ELSE 0.45 END THEN n_leida ELSE n_no END,
           titulo, mensaje, tipo, ts
    FROM ev ORDER BY ts;

    -- ===== Auditoría =====
    CREATE TEMP TABLE aud ON COMMIT DROP AS
    -- Solicitudes: creación por el lector, respuesta por el personal, cancelación por el lector
    SELECT s.id_usuario AS actor, s.id_solicitud AS reg, 'CREAR_SOLICITUD' AS accion, 'Solicitudes' AS tabla, s.fechasolicitud_solicitud + interval '1 second' AS ts,
           NULL::jsonb AS antes,
           to_jsonb(s) || jsonb_build_object('id_estado_solicitud', s_pend, 'fecharespuesta_solicitud', NULL, 'atendidopor_solicitud', NULL, 'observaciones_solicitud', NULL) AS despues
    FROM sol_sim s
    UNION ALL
    SELECT s.atendidopor_solicitud, s.id_solicitud, 'RESPONDER_SOLICITUD_' || CASE WHEN s.id_estado_solicitud = s_apro THEN 'APROBADA' ELSE 'RECHAZADA' END,
           'Solicitudes', s.fecharespuesta_solicitud + interval '1 second',
           to_jsonb(s) || jsonb_build_object('id_estado_solicitud', s_pend, 'codigo_estado', 'PENDIENTE', 'nombre_estado', 'Pendiente', 'titulo_libro', l.titulo_libro,
                                             'codinterno_ejemplar', e.codinterno_ejemplar, 'nombrecompleto_usuario', u.nombrecompleto_usuario,
                                             'correo_usuario', u.correo_usuario, 'fecharespuesta_solicitud', NULL, 'atendidopor_solicitud', NULL, 'observaciones_solicitud', NULL),
           to_jsonb(s)
    FROM sol_sim s
    JOIN public.ejemplares e ON e.id_ejemplar = s.id_ejemplar JOIN public.libros l ON l.id_libro = e.id_libro
    JOIN public.usuarios u ON u.id_usuario = s.id_usuario
    WHERE s.id_estado_solicitud IN (s_apro, s_rech) AND s.fecharespuesta_solicitud IS NOT NULL
    UNION ALL
    SELECT s.id_usuario, s.id_solicitud, 'CANCELAR_SOLICITUD', 'Solicitudes',
           least(s.fechasolicitud_solicitud + (10 + s.id_solicitud % 1400) * interval '1 minute', now() - interval '1 minute'),
           to_jsonb(s) || jsonb_build_object('id_estado_solicitud', s_pend), to_jsonb(s)
    FROM sol_sim s WHERE s.id_estado_solicitud = s_canc
    UNION ALL
    -- Préstamos: registro, renovación y devolución
    SELECT pv.staff_reg, pv.id_prestamo, 'CREAR_PRESTAMO', 'Prestamos', pv.f_pre + interval '1 second', NULL,
           to_jsonb(p) || jsonb_build_object('id_estado_prestamo', p_act, 'fechadevolucion_prestamo', NULL, 'fechavencimiento_prestamo', pv.venc_orig)
    FROM pv JOIN public.prestamos p ON p.id_prestamo = pv.id_prestamo
    UNION ALL
    SELECT CASE WHEN pv.id_prestamo % 5 < 3 THEN pv.id_usuario ELSE pv.staff_reg END, pv.id_prestamo, 'RENOVAR_PRESTAMO', 'Prestamos', pv.renov_ts + interval '1 second',
           to_jsonb(p) || jsonb_build_object('id_estado_prestamo', p_act, 'fechadevolucion_prestamo', NULL, 'fechavencimiento_prestamo', pv.venc_orig),
           to_jsonb(p) || jsonb_build_object('id_estado_prestamo', p_act, 'fechadevolucion_prestamo', NULL)
    FROM pv JOIN public.prestamos p ON p.id_prestamo = pv.id_prestamo WHERE pv.renovado AND pv.renov_ts IS NOT NULL
    UNION ALL
    SELECT pv.staff_dev, pv.id_prestamo, 'DEVOLUCION_PRESTAMO', 'Prestamos', pv.f_dev + interval '2 seconds',
           to_jsonb(p) || jsonb_build_object('id_estado_prestamo', CASE WHEN pv.f_venc < pv.f_dev THEN p_venc ELSE p_act END, 'fechadevolucion_prestamo', NULL,
                                             'titulo_libro', pv.titulo),
           jsonb_build_object('prestamo', to_jsonb(p),
                              'multa', CASE WHEN pv.id_multa IS NOT NULL THEN to_jsonb(m) || jsonb_build_object('id_estado_multa', m_pend, 'fechapago_multa', NULL, 'observaciones_multa', NULL) END)
    FROM pv JOIN public.prestamos p ON p.id_prestamo = pv.id_prestamo LEFT JOIN public.multas m ON m.id_multa = pv.id_multa
    WHERE pv.f_dev IS NOT NULL
    UNION ALL
    -- Multas: pago en mostrador y exoneración por el administrador
    SELECT pv.staff_pago, pv.id_multa, 'PAGAR_MULTA', 'Multas', pv.f_pago + interval '1 second',
           to_jsonb(m) || jsonb_build_object('id_estado_multa', m_pend, 'fechapago_multa', NULL, 'observaciones_multa', NULL, 'titulo_libro', pv.titulo), to_jsonb(m)
    FROM pv JOIN public.multas m ON m.id_multa = pv.id_multa WHERE pv.id_estado_multa = m_pag
    UNION ALL
    SELECT admin_id, pv.id_multa, 'CANCELAR_MULTA', 'Multas', pv.f_exo + interval '1 second',
           to_jsonb(m) || jsonb_build_object('id_estado_multa', m_pend, 'observaciones_multa', NULL, 'titulo_libro', pv.titulo), to_jsonb(m)
    FROM pv JOIN public.multas m ON m.id_multa = pv.id_multa WHERE pv.id_estado_multa = m_canc
    UNION ALL
    -- Catálogo ampliado: alta de autores, libros y lotes de ejemplares por el personal
    SELECT (SELECT s.id FROM (SELECT id_usuario AS id FROM public.usuarios u2 JOIN public.roles r ON r.id_rol = u2.id_rol
                              WHERE r.nombre_rol = 'Bibliotecario' AND u2.correo_usuario LIKE '%@simulado.test'
                              ORDER BY md5(u2.id_usuario::text || l.id_libro::text) LIMIT 1) s),
           l.id_libro, 'CREAR_LIBRO', 'Libros', l.fecharegistro_libro + interval '1 second', NULL, to_jsonb(l)
    FROM public.libros l WHERE l.id_libro > 306
    UNION ALL
    SELECT (SELECT s.id FROM (SELECT id_usuario AS id FROM public.usuarios u2 JOIN public.roles r ON r.id_rol = u2.id_rol
                              WHERE r.nombre_rol = 'Bibliotecario' AND u2.correo_usuario LIKE '%@simulado.test'
                              ORDER BY md5(u2.id_usuario::text || b.id_libro::text || b.id_ubicacion::text) LIMIT 1) s),
           b.max_id, 'CREAR_EJEMPLARES_LOTE', 'Ejemplares', b.f + interval '1 minute', NULL,
           jsonb_build_object('ids', b.ids, 'idLibro', b.id_libro, 'cantidad', b.n, 'idUbicacion', b.id_ubicacion)
    FROM (SELECT e.id_libro, e.id_ubicacion, count(*) AS n, max(e.id_ejemplar) AS max_id, jsonb_agg(e.id_ejemplar ORDER BY e.id_ejemplar) AS ids,
                 min(e.fechaadquisicion_ejemplar)::timestamptz + interval '10 hours' AS f
          FROM public.ejemplares e WHERE e.id_ejemplar > 1047 AND e.id_libro > 306 GROUP BY e.id_libro, e.id_ubicacion) b;

    -- Un actor por acción: IP interna fija por miembro del personal, IP pública fija por lector
    INSERT INTO public.auditorias (id_usuario, idregistro_auditoria, accion_auditoria, tablaafectada_auditoria,
                                   datosanteriores_auditoria, datosnuevos_auditoria, fecha_auditoria, direccionip_auditoria)
    SELECT a.actor, a.reg, a.accion, a.tabla, a.antes, a.despues, a.ts,
           CASE WHEN a.actor = admin_id OR r.nombre_rol <> 'Lector'
                THEN format('10.%s.%s.%s', 1 + abs(hashtext(a.actor::text)) % 10, abs(hashtext(a.actor::text || 'b')) % 250, 1 + abs(hashtext(a.actor::text || 'c')) % 250)
                ELSE format('%s.%s.%s.%s', (ARRAY[181, 186, 190, 200, 201])[1 + abs(hashtext(a.actor::text)) % 5], 40 + abs(hashtext(a.actor::text || 'b')) % 200,
                            abs(hashtext(a.actor::text || 'c')) % 250, 1 + abs(hashtext(a.actor::text || 'd')) % 250) END
    FROM aud a JOIN public.usuarios u ON u.id_usuario = a.actor JOIN public.roles r ON r.id_rol = u.id_rol
    WHERE a.actor IS NOT NULL
    ORDER BY a.ts;

    -- ===== Favoritos: según categorías preferidas y popularidad real (préstamos del libro) =====
    CREATE TEMP TABLE pop ON COMMIT DROP AS
    SELECT q.*, row_number() OVER (PARTITION BY q.id_categoria ORDER BY q.w DESC) AS rk_cat, row_number() OVER (ORDER BY q.w DESC) AS rk_global
    FROM (SELECT l.id_libro, l.id_categoria, 1 + count(p.id_prestamo) AS w
          FROM public.libros l LEFT JOIN public.ejemplares e ON e.id_libro = l.id_libro LEFT JOIN public.prestamos p ON p.id_ejemplar = e.id_ejemplar
          GROUP BY l.id_libro, l.id_categoria) q;

    CREATE TEMP TABLE ks ON COMMIT DROP AS
    SELECT u.id_usuario, u.fecharegistro_usuario AS reg, pf.cat1, pf.cat2,
           CASE pf.perfil WHEN 'frecuente' THEN 4 + floor(random() * 9)::int
                          WHEN 'regular' THEN 1 + floor(random() * 6)::int
                          ELSE CASE WHEN random() < 0.5 THEN 0 WHEN random() < 0.6 THEN 1 ELSE 2 END END AS k
    FROM sim.perfil pf JOIN public.usuarios u ON u.id_usuario = pf.id_usuario;

    INSERT INTO public.favoritos (id_usuario, id_libro, fechacreacion_favorito)
    SELECT r.id_usuario, r.id_libro, r.reg + random() * (now() - r.reg - interval '1 hour')
    FROM (
        SELECT k.id_usuario, k.reg, k.k, p.id_libro,
               row_number() OVER (PARTITION BY k.id_usuario
                                  ORDER BY -ln(1 - random()) / (p.w * CASE WHEN p.id_categoria = k.cat1 THEN 6 WHEN p.id_categoria = k.cat2 THEN 3 ELSE 0.15 END)) AS rn
        FROM ks k
        JOIN pop p ON (p.id_categoria IN (k.cat1, k.cat2) AND p.rk_cat <= 200) OR p.rk_global <= 300
        WHERE k.k > 0
    ) r
    WHERE r.rn <= r.k;

    DROP SCHEMA sim CASCADE;
END $$;

ANALYZE;

SELECT (SELECT count(*) FROM public.notificaciones) notificaciones,
       (SELECT count(*) FROM public.auditorias) auditorias,
       (SELECT count(*) FROM public.favoritos) favoritos;
