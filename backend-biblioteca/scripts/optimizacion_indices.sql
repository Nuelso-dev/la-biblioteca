-- Índices para los listados ordenados por fecha (más reciente primero) y para los filtros por estado.
-- Son aditivos e idempotentes: se pueden ejecutar varias veces sin efectos secundarios.

CREATE INDEX IF NOT EXISTS idx_prestamos_fecha ON public.prestamos (fechaprestamo_prestamo DESC);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON public.prestamos (id_estado_prestamo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON public.solicitudes (fechasolicitud_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes (id_estado_solicitud);
CREATE INDEX IF NOT EXISTS idx_multas_fecha ON public.multas (fechageneracion_multa DESC);
CREATE INDEX IF NOT EXISTS idx_multas_estado ON public.multas (id_estado_multa);
CREATE INDEX IF NOT EXISTS idx_auditorias_fecha ON public.auditorias (fecha_auditoria DESC);
-- Bandeja de cada usuario: sus notificaciones, las más nuevas primero
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_fecha ON public.notificaciones (id_usuario, fechacreacion_notificacion DESC);
CREATE INDEX IF NOT EXISTS idx_libros_estado ON public.libros (id_estado_libro);
CREATE INDEX IF NOT EXISTS idx_ejemplares_estado ON public.ejemplares (id_estado_ejemplar);
-- El índice compuesto anterior cubre también las búsquedas solo por usuario
DROP INDEX IF EXISTS public.idx_notificaciones_usuario;
