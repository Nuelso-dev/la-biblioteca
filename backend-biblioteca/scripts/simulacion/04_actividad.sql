-- Actividad de 24 meses: solicitudes, préstamos, multas y estados de ejemplares y usuarios.
-- Cada ejemplar tiene su propia línea de tiempo (sin préstamos traslapados); la demanda sigue la popularidad
-- del libro, la estacionalidad académica y el horario de atención (America/Bogota). Los lectores frecuentes
-- generan más préstamos que los ocasionales. Guarda sim.plan para las notificaciones y auditorías (05_extras.sql).
DO $$
DECLARE
    v_dias INTEGER; v_tarifa NUMERIC; v_staff INTEGER;
    x_disp INTEGER; x_pres INTEGER; x_perd INTEGER; x_res INTEGER;
    s_pend INTEGER; s_apro INTEGER; s_rech INTEGER; s_canc INTEGER;
    p_act INTEGER; p_dev INTEGER; p_venc INTEGER; p_perd INTEGER;
    m_pend INTEGER; m_pag INTEGER; m_canc INTEGER;
    u_susp INTEGER; u_inact INTEGER; e_usr INTEGER;
    seq_sol TEXT; seq_pre TEXT;
    tz CONSTANT TEXT := 'America/Bogota';
BEGIN
    IF EXISTS (SELECT 1 FROM public.prestamos p JOIN public.usuarios u ON u.id_usuario = p.id_usuario WHERE u.correo_usuario LIKE '%@simulado.test') THEN
        RAISE EXCEPTION 'Ya hay actividad simulada; ejecuta primero 00_limpiar.sql y las etapas 01 a 03';
    END IF;
    IF to_regclass('sim.perfil') IS NULL THEN RAISE EXCEPTION 'Falta sim.perfil: ejecuta 03_personas.sql'; END IF;

    SELECT valor_configuracion::int INTO v_dias FROM public.configuraciones WHERE clave_configuracion = 'DIAS_MAX_PRESTAMO';
    SELECT valor_configuracion::numeric INTO v_tarifa FROM public.configuraciones WHERE clave_configuracion = 'TARIFA_MULTA_DIARIA';
    SELECT id_estado INTO x_disp FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='DISPONIBLE';
    SELECT id_estado INTO x_pres FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='PRESTADO';
    SELECT id_estado INTO x_perd FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='PERDIDO';
    SELECT id_estado INTO x_res  FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='RESERVADO';
    SELECT id_estado INTO s_pend FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='PENDIENTE';
    SELECT id_estado INTO s_apro FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='APROBADA';
    SELECT id_estado INTO s_rech FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='RECHAZADA';
    SELECT id_estado INTO s_canc FROM public.estados WHERE entidad_estado='solicitud' AND codigo_estado='CANCELADA';
    SELECT id_estado INTO p_act  FROM public.estados WHERE entidad_estado='prestamo' AND codigo_estado='ACTIVO';
    SELECT id_estado INTO p_dev  FROM public.estados WHERE entidad_estado='prestamo' AND codigo_estado='DEVUELTO';
    SELECT id_estado INTO p_venc FROM public.estados WHERE entidad_estado='prestamo' AND codigo_estado='VENCIDO';
    SELECT id_estado INTO p_perd FROM public.estados WHERE entidad_estado='prestamo' AND codigo_estado='PERDIDO';
    SELECT id_estado INTO m_pend FROM public.estados WHERE entidad_estado='multa' AND codigo_estado='PENDIENTE';
    SELECT id_estado INTO m_pag  FROM public.estados WHERE entidad_estado='multa' AND codigo_estado='PAGADA';
    SELECT id_estado INTO m_canc FROM public.estados WHERE entidad_estado='multa' AND codigo_estado='CANCELADA';
    SELECT id_estado INTO e_usr   FROM public.estados WHERE entidad_estado='usuario' AND codigo_estado='ACTIVO';
    SELECT id_estado INTO u_susp  FROM public.estados WHERE entidad_estado='usuario' AND codigo_estado='SUSPENDIDO';
    SELECT id_estado INTO u_inact FROM public.estados WHERE entidad_estado='usuario' AND codigo_estado='INACTIVO';
    seq_sol := pg_get_serial_sequence('public.solicitudes', 'id_solicitud');
    seq_pre := pg_get_serial_sequence('public.prestamos', 'id_prestamo');

    -- Personal y "boletos" de sorteo de lectores (frecuente 8, regular 3, ocasional 1), ordenados por registro
    CREATE TEMP TABLE staff ON COMMIT DROP AS
    SELECT (row_number() OVER (ORDER BY u.id_usuario))::int AS k, u.id_usuario AS id
    FROM public.usuarios u JOIN public.roles r ON r.id_rol = u.id_rol
    WHERE r.nombre_rol = 'Bibliotecario' AND u.correo_usuario LIKE '%@simulado.test';
    SELECT count(*) INTO v_staff FROM staff;

    CREATE TEMP TABLE tickets ON COMMIT DROP AS
    SELECT (row_number() OVER (ORDER BY u.fecharegistro_usuario, t.i))::int - 1 AS pos, u.id_usuario AS id, u.fecharegistro_usuario AS reg
    FROM public.usuarios u JOIN sim.perfil p ON p.id_usuario = u.id_usuario
    CROSS JOIN LATERAL generate_series(1, CASE p.perfil WHEN 'frecuente' THEN 8 WHEN 'regular' THEN 3 ELSE 1 END) t(i);
    CREATE INDEX ON tickets (reg);

    -- Popularidad por libro (cola larga) y ejemplares candidatos
    CREATE TEMP TABLE libro_w ON COMMIT DROP AS
    SELECT id_libro, exp(2 * (random() + random() + random() - 1.5)) AS w FROM public.libros;

    CREATE TEMP TABLE pool ON COMMIT DROP AS
    SELECT p.*, (p.r_ong < 0.14) AS ong,
           greatest(CASE WHEN p.r_ong < 0.14 THEN 1 ELSE 0 END, least(18, floor(p.wn * 9.2 + p.r_n))::int) AS n,
           CASE WHEN p.r_x < 0.75 THEN 0.6 + p.r_x2 * 18 WHEN p.r_x < 0.97 THEN 21 + p.r_x2 * 22 ELSE 36 + p.r_x2 * 50 END AS xx
    FROM (
        SELECT e.id_ejemplar, e.id_libro, e.fechaadquisicion_ejemplar::timestamptz AS adq,
               lw.w / (SELECT avg(w) FROM libro_w) AS wn,
               random() AS r_ong, random() AS r_start, random() AS r_n, random() AS r_x, random() AS r_x2
        FROM public.ejemplares e JOIN libro_w lw ON lw.id_libro = e.id_libro
        WHERE e.id_estado_ejemplar = x_disp
          AND NOT EXISTS (SELECT 1 FROM public.prestamos pr WHERE pr.id_ejemplar = e.id_ejemplar AND pr.id_estado_prestamo IN (p_act, p_venc))
    ) p;

    -- Línea de tiempo de cada ejemplar: duración d (días hasta devolver) y espera g (días hasta el siguiente préstamo)
    CREATE TEMP TABLE cand ON COMMIT DROP AS
    SELECT c.*, (c.ong AND c.i = c.n) AS abierto,
           CASE WHEN NOT (c.ong AND c.i = c.n) AND c.rw < 0.12 THEN true
                WHEN (c.ong AND c.i = c.n) AND c.xx > 12 AND c.xx < 19 AND c.ru < 0.3 THEN true ELSE false END AS ren
    FROM (
        SELECT p.*, i, random() AS ru, random() AS rd, random() AS rg, random() AS rh1, random() AS rh2, random() AS rk, random() AS rw
        FROM pool p CROSS JOIN LATERAL generate_series(1, p.n) i
    ) c;

    CREATE TEMP TABLE lineas ON COMMIT DROP AS
    WITH dg AS (
        SELECT c.*,
               CASE WHEN c.ren THEN 15 + c.rd * 17 WHEN c.ru < 0.78 THEN 3 + c.rd * 16 WHEN c.ru < 0.88 THEN 19 + c.rd * 2 ELSE 21 + c.rd * 24 END AS d,
               3 + (-ln(1 - c.rg)) * 12 AS g,
               greatest(c.adq + interval '2 days', now() - interval '729 days') AS base
        FROM cand c
    ), acc AS (
        SELECT dg.*,
               coalesce(sum(dg.d + dg.g) OVER (PARTITION BY dg.id_ejemplar ORDER BY dg.i ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS pref,
               sum(dg.d + dg.g) OVER (PARTITION BY dg.id_ejemplar) AS tot
        FROM dg
    ), acc2 AS (
        SELECT acc.*, max(acc.pref) OVER (PARTITION BY acc.id_ejemplar) AS prefmax FROM acc
    )
    SELECT a.*,
           CASE WHEN a.abierto THEN now() - a.xx * interval '1 day'
                WHEN a.ong THEN now() - a.xx * interval '1 day' - (a.prefmax - a.pref) * interval '1 day'
                ELSE a.base + a.r_start * greatest(0, extract(epoch FROM now() - a.base) / 86400 - a.tot - 2) * interval '1 day' + a.pref * interval '1 day'
           END AS start_raw
    FROM acc2 a;

    -- Horario de atención, estacionalidad y fines de semana
    CREATE TEMP TABLE loans ON COMMIT DROP AS
    WITH t AS (
        SELECT l.*, (l.start_raw AT TIME ZONE tz)::date AS dia FROM lineas l WHERE l.start_raw >= l.base
    ), h AS (
        SELECT t.*,
               least(((t.dia + make_interval(mins => 480 + floor(t.rh1 * 570)::int)) AT TIME ZONE tz), now() - interval '20 minutes') AS start_ts,
               (t.dia + t.d::int + make_interval(mins => 540 + floor(t.rh2 * 510)::int)) AT TIME ZONE tz AS ret_raw,
               (t.dia + v_dias + interval '23 hours 59 minutes 59 seconds') AT TIME ZONE tz AS venc_orig,
               CASE extract(dow FROM t.dia) WHEN 0 THEN 0.30 WHEN 6 THEN 0.65 ELSE 1 END
                 * CASE extract(month FROM t.dia) WHEN 1 THEN 0.55 WHEN 2 THEN 0.9 WHEN 6 THEN 0.85 WHEN 7 THEN 0.65 WHEN 12 THEN 0.5 ELSE 1 END AS keep
        FROM t
    )
    SELECT h.*, CASE WHEN h.ren THEN h.venc_orig + interval '7 days' ELSE h.venc_orig END AS venc,
           CASE WHEN h.abierto THEN NULL ELSE h.ret_raw END AS ret_ts,
           1 + floor(random() * v_staff)::int AS k_reg, 1 + floor(random() * v_staff)::int AS k_dev, 1 + floor(random() * v_staff)::int AS k_pago,
           random() AS r_walk, random() AS r_sol, random() AS r_obs, random() AS r_multa, random() AS r_pago
    FROM h
    WHERE h.abierto OR (h.rk < h.keep AND h.ret_raw <= now() - interval '2 hours');

    -- Lector de cada préstamo: sorteo ponderado entre los ya registrados
    CREATE TEMP TABLE loans_u ON COMMIT DROP AS
    SELECT q.*, t.id AS id_usuario, row_number() OVER (ORDER BY q.start_ts, q.id_ejemplar) AS lk
    FROM (
        SELECT l.*, floor(random() * greatest(1, coalesce((SELECT t.pos + 1 FROM tickets t WHERE t.reg < l.start_ts - interval '2 days' ORDER BY t.reg DESC LIMIT 1), 0)))::int AS pos
        FROM loans l
    ) q JOIN tickets t ON t.pos = q.pos AND t.reg < q.start_ts - interval '2 days';

    -- Solicitudes extra: pendientes y reservas recientes, rechazadas y canceladas históricas
    CREATE TEMP TABLE libres ON COMMIT DROP AS
    SELECT id_ejemplar, adq, row_number() OVER (ORDER BY random()) AS rn FROM pool WHERE NOT ong;

    CREATE TEMP TABLE extras ON COMMIT DROP AS
    SELECT x.*, t.id AS id_usuario
    FROM (
        SELECT e.*, 1 + floor(random() * v_staff)::int AS k_staff,
               floor(random() * greatest(1, coalesce((SELECT t.pos + 1 FROM tickets t WHERE t.reg < e.ts - interval '2 days' ORDER BY t.reg DESC LIMIT 1), 0)))::int AS pos
        FROM (
            SELECT 'PEND' AS tipo, l.id_ejemplar, now() - (random() * 70) * interval '1 hour' AS ts FROM libres l WHERE l.rn <= 600
            UNION ALL
            SELECT 'RES', l.id_ejemplar, now() - (1 + random() * 39) * interval '1 hour' FROM libres l WHERE l.rn > 600 AND l.rn <= 800
            UNION ALL
            SELECT CASE WHEN g <= 3000 THEN 'RECH' ELSE 'CANC' END, l.id_ejemplar,
                   least(greatest((now() - random() * 728 * interval '1 day')::date::timestamptz + make_interval(mins => 480 + floor(random() * 600)::int), l.adq + interval '3 days'),
                         now() - interval '3 hours')
            FROM generate_series(1, 7000) g
            CROSS JOIN LATERAL (SELECT p.id_ejemplar, p.adq FROM pool p ORDER BY md5(g::text || p.id_ejemplar::text) LIMIT 1) l
        ) e
    ) x JOIN tickets t ON t.pos = x.pos AND t.reg < x.ts - interval '2 days';

    -- Solicitudes de todo tipo con identificadores cronológicos
    CREATE TEMP TABLE sol_all ON COMMIT DROP AS
    SELECT s.*, nextval(seq_sol)::int AS id_sol
    FROM (
        SELECT 'L' AS src, l.lk, l.id_usuario, l.id_ejemplar, s_apro AS estado,
               l.start_ts - (1 + l.r_sol * 29) * interval '1 hour' AS ts,
               NULL::timestamptz AS resp_ts, (SELECT id FROM staff WHERE k = l.k_reg) AS atendido, NULL::text AS obs
        FROM loans_u l WHERE l.r_walk >= 0.22
        UNION ALL
        SELECT e.tipo, NULL, e.id_usuario, e.id_ejemplar,
               CASE e.tipo WHEN 'PEND' THEN s_pend WHEN 'RES' THEN s_apro WHEN 'RECH' THEN s_rech ELSE s_canc END,
               e.ts, NULL,
               CASE WHEN e.tipo IN ('RES','RECH') THEN (SELECT id FROM staff WHERE k = e.k_staff) END,
               CASE WHEN e.tipo = 'RECH' THEN (ARRAY['El ejemplar está reservado para consulta en sala',
                                                     'Alcanzaste el máximo de préstamos activos',
                                                     'Tienes multas pendientes por saldar',
                                                     'El ejemplar está en revisión por el personal',
                                                     'Ya tienes un ejemplar de este título en préstamo'])[1 + floor(random() * 5)::int] END
        FROM extras e
        ORDER BY 6
    ) s;

    UPDATE sol_all s SET resp_ts = s.ts + (l.start_ts - s.ts) * (0.10 + random() * 0.5) FROM loans_u l WHERE s.src = 'L' AND s.lk = l.lk;
    UPDATE sol_all s SET resp_ts = least(s.ts + (20 + random() * 160) * interval '1 minute', now() - interval '5 minutes') WHERE s.src = 'RES';
    UPDATE sol_all s SET resp_ts = s.ts + (30 + random() * 1200) * interval '1 minute' WHERE s.src = 'RECH';

    INSERT INTO public.solicitudes (id_solicitud, id_usuario, id_ejemplar, id_estado_solicitud, fechasolicitud_solicitud,
                                    fecharespuesta_solicitud, observaciones_solicitud, atendidopor_solicitud)
    SELECT id_sol, id_usuario, id_ejemplar, estado, ts, resp_ts, obs, atendido FROM sol_all;

    -- Préstamos (walk-in: sin solicitud previa)
    CREATE TEMP TABLE pres ON COMMIT DROP AS
    SELECT l.*, nextval(seq_pre)::int AS id_pre,
           CASE WHEN l.abierto THEN CASE WHEN l.r_x >= 0.97 THEN p_perd WHEN now() > l.venc THEN p_venc ELSE p_act END ELSE p_dev END AS estado
    FROM (SELECT lu.*, sl.id_sol FROM loans_u lu LEFT JOIN sol_all sl ON sl.src = 'L' AND sl.lk = lu.lk ORDER BY lu.start_ts) l;

    INSERT INTO public.prestamos (id_prestamo, id_solicitud, id_usuario, id_ejemplar, id_estado_prestamo, observaciones_prestamo,
                                  registradopor_prestamo, fechaprestamo_prestamo, fechadevolucion_prestamo, fechavencimiento_prestamo)
    SELECT p.id_pre, p.id_sol, p.id_usuario, p.id_ejemplar, p.estado,
           CASE WHEN p.estado = p_perd THEN 'El lector reportó el libro como perdido'
                WHEN p.r_obs < 0.03 THEN 'Se entrega con la tapa levemente desgastada'
                WHEN p.r_obs < 0.05 THEN 'Se entrega con subrayados a lápiz' END,
           (SELECT id FROM staff WHERE k = p.k_reg), p.start_ts, p.ret_ts, p.venc
    FROM pres p;

    UPDATE public.ejemplares e
    SET id_estado_ejemplar = CASE p.estado WHEN p_perd THEN x_perd ELSE x_pres END
    FROM pres p WHERE p.id_ejemplar = e.id_ejemplar AND p.estado IN (p_act, p_venc, p_perd);

    UPDATE public.ejemplares e SET id_estado_ejemplar = x_res
    FROM sol_all s WHERE s.src = 'RES' AND s.id_ejemplar = e.id_ejemplar;

    -- Límite de préstamos abiertos por lector (MAX_PRESTAMOS_USUARIO = 3): los excedentes pasan a lectores sin préstamos abiertos
    WITH ab AS (
        SELECT p.id_prestamo, p.id_solicitud, p.fechaprestamo_prestamo AS f,
               row_number() OVER (PARTITION BY p.id_usuario ORDER BY p.fechaprestamo_prestamo) AS rn
        FROM public.prestamos p WHERE p.id_estado_prestamo IN (p_act, p_venc)
    ), nuevo AS (
        SELECT ab.id_prestamo, ab.id_solicitud,
               (SELECT u.id_usuario FROM public.usuarios u
                WHERE u.correo_usuario LIKE '%@simulado.test' AND u.id_rol = 3 AND u.id_estado_usuario = e_usr
                  AND u.fecharegistro_usuario < ab.f - interval '2 days'
                  AND NOT EXISTS (SELECT 1 FROM public.prestamos q WHERE q.id_usuario = u.id_usuario AND q.id_estado_prestamo IN (p_act, p_venc))
                ORDER BY md5(ab.id_prestamo::text || u.id_usuario::text) LIMIT 1) AS id_usuario
        FROM ab WHERE ab.rn > 3
    ), up AS (
        UPDATE public.prestamos p SET id_usuario = n.id_usuario FROM nuevo n WHERE p.id_prestamo = n.id_prestamo AND n.id_usuario IS NOT NULL RETURNING p.id_prestamo
    )
    UPDATE public.solicitudes s SET id_usuario = n.id_usuario FROM nuevo n WHERE s.id_solicitud = n.id_solicitud AND n.id_usuario IS NOT NULL;

    -- Multas por devolución tardía (días de retraso redondeados hacia arriba, como en el backend)
    CREATE TEMP TABLE mul ON COMMIT DROP AS
    SELECT p.id_pre, ceil(extract(epoch FROM p.ret_ts - p.venc) / 86400)::int AS dias, p.ret_ts, p.k_pago, p.r_pago,
           CASE WHEN p.r_multa < 0.03 THEN 'C'
                WHEN p.r_multa < 0.03 + CASE WHEN now() - p.ret_ts < interval '30 days' THEN 0.55
                                             WHEN now() - p.ret_ts < interval '90 days' THEN 0.22 ELSE 0.07 END THEN 'P'
                ELSE 'G' END AS tipo
    FROM pres p WHERE p.estado = p_dev AND p.ret_ts > p.venc;

    INSERT INTO public.multas (id_prestamo, id_estado_multa, motivo_multa, diasretraso_multa, valor_multa,
                               fechageneracion_multa, fechapago_multa, observaciones_multa)
    SELECT m.id_pre, CASE m.tipo WHEN 'C' THEN m_canc WHEN 'P' THEN m_pend ELSE m_pag END,
           format('Devolución con %s día(s) de retraso', m.dias), m.dias, m.dias * v_tarifa, m.ret_ts,
           CASE WHEN m.tipo = 'G' THEN least(m.ret_ts + (m.r_pago * 14) * interval '1 day' + interval '1 hour', now() - interval '1 hour') END,
           CASE WHEN m.tipo = 'C' THEN (ARRAY['Exonerada por calamidad doméstica','Exonerada por incapacidad médica','Exonerada por cierre de la sede'])[1 + floor(random() * 3)::int]
                WHEN m.tipo = 'G' THEN CASE WHEN m.r_pago < 0.7 THEN 'Pago en efectivo en mostrador' ELSE 'Pago por transferencia' END END
    FROM mul m;

    -- Datos que necesitan las notificaciones y auditorías
    CREATE TABLE sim.plan AS
    SELECT p.id_pre AS id_prestamo, p.id_sol AS id_solicitud, p.ren AS renovado, p.venc_orig,
           CASE WHEN p.ren THEN p.start_ts + (0.3 + random() * 0.55) * least(p.venc_orig - p.start_ts, coalesce(p.ret_ts, now()) - p.start_ts) END AS renov_ts,
           (SELECT id FROM staff WHERE k = p.k_reg) AS staff_reg, (SELECT id FROM staff WHERE k = p.k_dev) AS staff_dev,
           (SELECT id FROM staff WHERE k = p.k_pago) AS staff_pago
    FROM pres p;

    -- Cuentas suspendidas (multas o vencimientos sin resolver) e inactivas (sin movimiento en meses)
    UPDATE public.usuarios u
    SET id_estado_usuario = u_susp,
        fechaultimaactualizacion_usuario = greatest(u.fecharegistro_usuario, now() - (1 + random() * 15) * interval '1 day')
    WHERE u.id_usuario IN (
        SELECT p.id_usuario FROM public.prestamos p JOIN public.multas m ON m.id_prestamo = p.id_prestamo
        WHERE m.id_estado_multa = m_pend AND m.fechageneracion_multa < now() - interval '20 days' AND random() < 0.7
        UNION
        SELECT p.id_usuario FROM public.prestamos p WHERE p.id_estado_prestamo = p_venc AND p.fechavencimiento_prestamo < now() - interval '15 days' AND random() < 0.4);

    UPDATE public.usuarios u
    SET id_estado_usuario = u_inact, fechaultimaactualizacion_usuario = greatest(u.fecharegistro_usuario, now() - (5 + random() * 60) * interval '1 day')
    WHERE u.id_estado_usuario <> u_susp AND u.id_usuario IN (SELECT id FROM tickets)
      AND NOT EXISTS (SELECT 1 FROM public.prestamos p WHERE p.id_usuario = u.id_usuario AND p.fechaprestamo_prestamo > now() - interval '200 days')
      AND u.fecharegistro_usuario < now() - interval '200 days' AND random() < 0.15;
END $$;

SELECT (SELECT count(*) FROM public.prestamos) prestamos,
       (SELECT count(*) FROM public.solicitudes) solicitudes,
       (SELECT count(*) FROM public.multas) multas,
       (SELECT count(*) FROM public.prestamos WHERE id_estado_prestamo IN (12, 14)) abiertos,
       (SELECT max(c) FROM (SELECT count(*) c FROM public.prestamos WHERE id_estado_prestamo IN (12, 14) GROUP BY id_usuario) x) max_abiertos_usuario;
