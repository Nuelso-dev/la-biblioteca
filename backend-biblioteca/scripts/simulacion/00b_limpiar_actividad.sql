-- Quita solo las personas simuladas y su actividad (préstamos, solicitudes, multas, notificaciones, auditorías y
-- favoritos), conservando el catálogo y las sedes simuladas. Sirve para repetir las etapas 03 a 05 con otros parámetros.
-- Los ejemplares que la simulación dejó prestados, reservados o perdidos vuelven a DISPONIBLE, salvo los que una cuenta
-- real tenga en préstamo. Los préstamos o solicitudes de cuentas reales no se tocan.
DO $$
DECLARE
    x_disp INTEGER; x_pres INTEGER;
BEGIN
    SELECT id_estado INTO x_disp FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='DISPONIBLE';
    SELECT id_estado INTO x_pres FROM public.estados WHERE entidad_estado='ejemplar' AND codigo_estado='PRESTADO';

    CREATE TEMP TABLE sim_ids ON COMMIT DROP AS
    SELECT id FROM auth.users WHERE email LIKE '%@simulado.test';

    CREATE TEMP TABLE tocados ON COMMIT DROP AS
    SELECT id_ejemplar FROM public.prestamos WHERE id_usuario IN (SELECT id FROM sim_ids)
    UNION SELECT id_ejemplar FROM public.solicitudes WHERE id_usuario IN (SELECT id FROM sim_ids);

    DELETE FROM public.auditorias WHERE id_usuario IN (SELECT id FROM sim_ids);
    DELETE FROM public.auditorias a
    USING public.multas m JOIN public.prestamos p ON p.id_prestamo = m.id_prestamo
    WHERE a.tablaafectada_auditoria = 'Multas' AND a.accion_auditoria = 'CANCELAR_MULTA' AND a.idregistro_auditoria = m.id_multa
      AND p.id_usuario IN (SELECT id FROM sim_ids);
    DELETE FROM public.auditorias a
    WHERE a.tablaafectada_auditoria = 'Multas' AND a.accion_auditoria = 'CANCELAR_MULTA'
      AND NOT EXISTS (SELECT 1 FROM public.multas m WHERE m.id_multa = a.idregistro_auditoria) AND a.idregistro_auditoria > 0;

    DELETE FROM public.prestamos WHERE id_usuario IN (SELECT id FROM sim_ids);      -- multas en cascada
    DELETE FROM auth.users WHERE id IN (SELECT id FROM sim_ids);                    -- usuarios, solicitudes, notificaciones y favoritos en cascada

    UPDATE public.ejemplares e
    SET id_estado_ejemplar = CASE
        WHEN EXISTS (SELECT 1 FROM public.prestamos p JOIN public.estados s ON s.id_estado = p.id_estado_prestamo
                     WHERE p.id_ejemplar = e.id_ejemplar AND s.codigo_estado IN ('ACTIVO', 'VENCIDO')) THEN x_pres
        ELSE x_disp END
    WHERE e.id_ejemplar IN (SELECT id_ejemplar FROM tocados) AND e.id_estado_ejemplar <> x_disp;
END $$;

DROP SCHEMA IF EXISTS sim CASCADE;
