-- =====================================================================
-- LA BIBLIOTECA - SCRIPT DE MIGRACIÓN Y DEFINICIÓN DE ESQUEMA EN SUPABASE
-- Adaptado a PostgreSQL 17 / Supabase con RLS, Triggers y Auth Integration
-- =====================================================================

BEGIN;

-- 1. ELIMINACIÓN DEFINITIVA DE TABLAS ANTIGUAS
-- (Se eliminan en orden o en cascada para limpiar el esquema previo)
DROP TABLE IF EXISTS public.resenas_libros CASCADE;
DROP TABLE IF EXISTS public.resenas_bibliotecas CASCADE;
DROP TABLE IF EXISTS public.publicaciones_libros CASCADE;
DROP TABLE IF EXISTS public.publicaciones CASCADE;
DROP TABLE IF EXISTS public.preferencias_notificaciones CASCADE;
DROP TABLE IF EXISTS public.preferencias_usuarios CASCADE;
DROP TABLE IF EXISTS public.prestamos_libros CASCADE;
DROP TABLE IF EXISTS public.multas CASCADE;
DROP TABLE IF EXISTS public.solicitudes CASCADE;
DROP TABLE IF EXISTS public.prestamos CASCADE;
DROP TABLE IF EXISTS public.ejemplares CASCADE;
DROP TABLE IF EXISTS public.autores_libros CASCADE;
DROP TABLE IF EXISTS public.libros_autores CASCADE;
DROP TABLE IF EXISTS public.libros CASCADE;
DROP TABLE IF EXISTS public.autores CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.categorias_libros CASCADE;
DROP TABLE IF EXISTS public.editoriales CASCADE;
DROP TABLE IF EXISTS public.ubicaciones CASCADE;
DROP TABLE IF EXISTS public.bibliotecas CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.auditorias CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.configuraciones CASCADE;
DROP TABLE IF EXISTS public.estados CASCADE;
DROP TABLE IF EXISTS public.estado_usuario CASCADE;
DROP TABLE IF EXISTS public.estados_fisicos CASCADE;
DROP TABLE IF EXISTS public.estados_disponibilidades CASCADE;
DROP TABLE IF EXISTS public.estados_devoluciones CASCADE;

-- 2. TABLA: Estados (catálogo genérico de estados usado por varias entidades)
CREATE TABLE public.Estados (
    ID_Estado           SERIAL PRIMARY KEY,
    Entidad_Estado      VARCHAR(100)  NOT NULL,
    Codigo_Estado       VARCHAR(50)   NOT NULL,
    Nombre_Estado       VARCHAR(100)  NOT NULL,
    Descripcion_Estado  TEXT,
    Activo_Estado       BOOLEAN       NOT NULL DEFAULT TRUE,
    Orden_Estado        INTEGER,
    CONSTRAINT uq_estados_entidad_codigo UNIQUE (Entidad_Estado, Codigo_Estado),
    CONSTRAINT uq_estados_id_entidad UNIQUE (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_estados_orden CHECK (Orden_Estado IS NULL OR Orden_Estado >= 0)
);

-- 3. TABLA: Roles
CREATE TABLE public.Roles (
    ID_Rol           SERIAL PRIMARY KEY,
    Nombre_Rol       VARCHAR(100) NOT NULL UNIQUE,
    Descripcion_Rol  TEXT
);

-- 4. TABLA: Configuraciones
CREATE TABLE public.Configuraciones (
    ID_Configuracion          SERIAL PRIMARY KEY,
    Clave_Configuracion       VARCHAR(150) NOT NULL UNIQUE,
    Valor_Configuracion       TEXT,
    Descripcion_Configuracion TEXT
);

-- 5. TABLA: Bibliotecas
CREATE TABLE public.Bibliotecas (
    ID_Biblioteca         SERIAL PRIMARY KEY,
    ID_Estado_Biblioteca  INTEGER NOT NULL,
    Entidad_Estado_Biblioteca VARCHAR(100) NOT NULL DEFAULT 'biblioteca'
        CHECK (Entidad_Estado_Biblioteca = 'biblioteca'),
    Nombre_Biblioteca     VARCHAR(200) NOT NULL,
    Direccion_Biblioteca  VARCHAR(255),
    Telefono_Biblioteca   VARCHAR(50),
    Descripcion_Biblioteca TEXT,
    Latitud_Biblioteca    NUMERIC(9,6),
    Longitud_Biblioteca   NUMERIC(9,6),
    CONSTRAINT chk_bibliotecas_coordenadas CHECK (
        (Latitud_Biblioteca IS NULL AND Longitud_Biblioteca IS NULL)
        OR (Latitud_Biblioteca BETWEEN -90 AND 90 AND Longitud_Biblioteca BETWEEN -180 AND 180)
    ),
    CONSTRAINT fk_bibliotecas_estado FOREIGN KEY (ID_Estado_Biblioteca, Entidad_Estado_Biblioteca)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado)
);

-- 6. TABLA: Ubicaciones (dentro de cada biblioteca)
CREATE TABLE public.Ubicaciones (
    ID_Ubicacion         SERIAL PRIMARY KEY,
    ID_Biblioteca        INTEGER NOT NULL REFERENCES public.Bibliotecas(ID_Biblioteca) ON DELETE CASCADE,
    ID_Estado_Ubicacion  INTEGER NOT NULL,
    Entidad_Estado_Ubicacion VARCHAR(100) NOT NULL DEFAULT 'ubicacion'
        CHECK (Entidad_Estado_Ubicacion = 'ubicacion'),
    Nombre_Ubicacion     VARCHAR(150) NOT NULL,
    Seccion_Ubicacion    VARCHAR(100),
    Estanteria_Ubicacion VARCHAR(100),
    Descripcion_Ubicacion TEXT,
    CONSTRAINT fk_ubicaciones_estado FOREIGN KEY (ID_Estado_Ubicacion, Entidad_Estado_Ubicacion)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado)
);

-- 7. TABLA: Usuarios (integrado con Supabase Auth)
CREATE TABLE public.Usuarios (
    ID_Usuario                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ID_Rol                           INTEGER NOT NULL REFERENCES public.Roles(ID_Rol),
    ID_Estado_Usuario                INTEGER NOT NULL,
    Entidad_Estado_Usuario           VARCHAR(100) NOT NULL DEFAULT 'usuario'
        CHECK (Entidad_Estado_Usuario = 'usuario'),
    NombreCompleto_Usuario           VARCHAR(200) NOT NULL,
    Documento_Usuario                VARCHAR(50) UNIQUE,
    Correo_Usuario                    VARCHAR(150) NOT NULL UNIQUE,
    Telefono_Usuario                 VARCHAR(50),
    FechaRegistro_Usuario            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaUltimaActualizacion_Usuario TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_usuarios_estado FOREIGN KEY (ID_Estado_Usuario, Entidad_Estado_Usuario)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_usuarios_nombre CHECK (TRIM(NombreCompleto_Usuario) <> ''),
    CONSTRAINT chk_usuarios_correo CHECK (TRIM(Correo_Usuario) <> ''),
    CONSTRAINT chk_usuarios_fecha_actualizacion CHECK (FechaUltimaActualizacion_Usuario IS NULL OR FechaUltimaActualizacion_Usuario >= FechaRegistro_Usuario)
);

-- 8. TABLA: Editoriales
CREATE TABLE public.Editoriales (
    ID_Editorial         SERIAL PRIMARY KEY,
    ID_Estado_Editorial  INTEGER NOT NULL,
    Entidad_Estado_Editorial VARCHAR(100) NOT NULL DEFAULT 'editorial'
        CHECK (Entidad_Estado_Editorial = 'editorial'),
    Nombre_Editorial     VARCHAR(200) NOT NULL,
    Pais_Editorial       VARCHAR(100),
    CONSTRAINT fk_editoriales_estado FOREIGN KEY (ID_Estado_Editorial, Entidad_Estado_Editorial)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_editoriales_nombre CHECK (TRIM(Nombre_Editorial) <> '')
);

-- 9. TABLA: Categorias_Libros
CREATE TABLE public.Categorias_Libros (
    ID_Categorias_Libros    SERIAL PRIMARY KEY,
    ID_Estado_CategLib      INTEGER NOT NULL,
    Entidad_Estado_CategLib VARCHAR(100) NOT NULL DEFAULT 'categoria_libro'
        CHECK (Entidad_Estado_CategLib = 'categoria_libro'),
    Nombre_CategLib         VARCHAR(150) NOT NULL,
    Descripcion_CategLib    TEXT,
    CONSTRAINT fk_categlib_estado FOREIGN KEY (ID_Estado_CategLib, Entidad_Estado_CategLib)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_categlib_nombre CHECK (TRIM(Nombre_CategLib) <> '')
);

-- 10. TABLA: Autores
CREATE TABLE public.Autores (
    ID_Autor              SERIAL PRIMARY KEY,
    NombreCompleto_Autor  VARCHAR(200) NOT NULL,
    Biografia_Autor       TEXT,
    FechaNacimiento_Autor DATE,
    CONSTRAINT chk_autores_nombre CHECK (TRIM(NombreCompleto_Autor) <> '')
);

-- 11. TABLA: Libros
CREATE TABLE public.Libros (
    ID_Libro             SERIAL PRIMARY KEY,
    ID_Categoria         INTEGER NOT NULL REFERENCES public.Categorias_Libros(ID_Categorias_Libros),
    ID_Editorial         INTEGER NOT NULL REFERENCES public.Editoriales(ID_Editorial),
    ID_Estado_Libro      INTEGER NOT NULL,
    Entidad_Estado_Libro VARCHAR(100) NOT NULL DEFAULT 'libro'
        CHECK (Entidad_Estado_Libro = 'libro'),
    ISBN_Libro           VARCHAR(20) UNIQUE,
    Titulo_Libro         VARCHAR(300) NOT NULL,
    Descripcion_Libro    TEXT,
    Portada_Libro        VARCHAR(255),
    NumPaginas_Libro     INTEGER,
    Idioma_Libro         VARCHAR(50) DEFAULT 'Español',
    FechaPublicacion_Libro DATE,
    FechaRegistro_Libro    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_libros_estado FOREIGN KEY (ID_Estado_Libro, Entidad_Estado_Libro)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_libros_titulo CHECK (TRIM(Titulo_Libro) <> ''),
    CONSTRAINT chk_libros_paginas CHECK (NumPaginas_Libro IS NULL OR NumPaginas_Libro > 0)
);

-- 12. TABLA: Libros_Autores (N:M)
CREATE TABLE public.Libros_Autores (
    ID_LibroAutor  SERIAL PRIMARY KEY,
    ID_Libro       INTEGER NOT NULL REFERENCES public.Libros(ID_Libro) ON DELETE CASCADE,
    ID_Autor       INTEGER NOT NULL REFERENCES public.Autores(ID_Autor) ON DELETE CASCADE,
    CONSTRAINT uq_libros_autores UNIQUE (ID_Libro, ID_Autor)
);

-- 13. TABLA: Ejemplares
CREATE TABLE public.Ejemplares (
    ID_Ejemplar          SERIAL PRIMARY KEY,
    ID_Libro             INTEGER NOT NULL REFERENCES public.Libros(ID_Libro) ON DELETE CASCADE,
    ID_Ubicacion         INTEGER NOT NULL REFERENCES public.Ubicaciones(ID_Ubicacion) ON DELETE RESTRICT,
    ID_Estado_Ejemplar   INTEGER NOT NULL,
    Entidad_Estado_Ejemplar VARCHAR(100) NOT NULL DEFAULT 'ejemplar'
        CHECK (Entidad_Estado_Ejemplar = 'ejemplar'),
    CodInterno_Ejemplar  VARCHAR(50) NOT NULL UNIQUE,
    FechaAdquisicion_Ejemplar DATE,
    Observacion_Ejemplar TEXT,
    CONSTRAINT fk_ejemplares_estado FOREIGN KEY (ID_Estado_Ejemplar, Entidad_Estado_Ejemplar)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado)
);

-- 14. TABLA: Solicitudes
CREATE TABLE public.Solicitudes (
    ID_Solicitud             SERIAL PRIMARY KEY,
    ID_Usuario               UUID NOT NULL REFERENCES public.Usuarios(ID_Usuario) ON DELETE CASCADE,
    ID_Ejemplar              INTEGER NOT NULL REFERENCES public.Ejemplares(ID_Ejemplar) ON DELETE RESTRICT,
    ID_Estado_Solicitud      INTEGER NOT NULL,
    Entidad_Estado_Solicitud VARCHAR(100) NOT NULL DEFAULT 'solicitud'
        CHECK (Entidad_Estado_Solicitud = 'solicitud'),
    FechaSolicitud_Solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaRespuesta_Solicitud TIMESTAMP WITH TIME ZONE,
    Observaciones_Solicitud  TEXT,
    AtendidoPor_Solicitud    UUID REFERENCES public.Usuarios(ID_Usuario) ON DELETE SET NULL,
    CONSTRAINT fk_solicitudes_estado FOREIGN KEY (ID_Estado_Solicitud, Entidad_Estado_Solicitud)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_solicitudes_fecha_respuesta CHECK (FechaRespuesta_Solicitud IS NULL OR FechaRespuesta_Solicitud >= FechaSolicitud_Solicitud)
);

-- 15. TABLA: Prestamos
CREATE TABLE public.Prestamos (
    ID_Prestamo            SERIAL PRIMARY KEY,
    ID_Solicitud           INTEGER REFERENCES public.Solicitudes(ID_Solicitud) ON DELETE SET NULL,
    ID_Usuario              UUID NOT NULL REFERENCES public.Usuarios(ID_Usuario) ON DELETE RESTRICT,
    ID_Ejemplar              INTEGER NOT NULL REFERENCES public.Ejemplares(ID_Ejemplar) ON DELETE RESTRICT,
    ID_Estado_Prestamo       INTEGER NOT NULL,
    Entidad_Estado_Prestamo  VARCHAR(100) NOT NULL DEFAULT 'prestamo'
        CHECK (Entidad_Estado_Prestamo = 'prestamo'),
    Observaciones_Prestamo    TEXT,
    RegistradoPor_Prestamo    UUID NOT NULL REFERENCES public.Usuarios(ID_Usuario) ON DELETE RESTRICT,
    FechaPrestamo_Prestamo    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaDevolucion_Prestamo  TIMESTAMP WITH TIME ZONE,
    FechaVencimiento_Prestamo TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_prestamos_estado FOREIGN KEY (ID_Estado_Prestamo, Entidad_Estado_Prestamo)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_prestamos_vencimiento CHECK (FechaVencimiento_Prestamo >= FechaPrestamo_Prestamo),
    CONSTRAINT chk_prestamos_devolucion CHECK (FechaDevolucion_Prestamo IS NULL OR FechaDevolucion_Prestamo >= FechaPrestamo_Prestamo)
);

-- 16. TABLA: Multas
CREATE TABLE public.Multas (
    ID_Multa            SERIAL PRIMARY KEY,
    ID_Prestamo         INTEGER NOT NULL REFERENCES public.Prestamos(ID_Prestamo) ON DELETE CASCADE,
    ID_Estado_Multa     INTEGER NOT NULL,
    Entidad_Estado_Multa VARCHAR(100) NOT NULL DEFAULT 'multa'
        CHECK (Entidad_Estado_Multa = 'multa'),
    Motivo_Multa        VARCHAR(255),
    DiasRetraso_Multa   INTEGER,
    Valor_Multa         NUMERIC(10,2) NOT NULL DEFAULT 0,
    FechaGeneracion_Multa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaPago_Multa       TIMESTAMP WITH TIME ZONE,
    Observaciones_Multa   TEXT,
    CONSTRAINT fk_multas_estado FOREIGN KEY (ID_Estado_Multa, Entidad_Estado_Multa)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_multas_dias_retraso CHECK (DiasRetraso_Multa IS NULL OR DiasRetraso_Multa >= 0),
    CONSTRAINT chk_multas_valor CHECK (Valor_Multa >= 0),
    CONSTRAINT chk_multas_fecha_pago CHECK (FechaPago_Multa IS NULL OR FechaPago_Multa >= FechaGeneracion_Multa)
);

-- 17. TABLA: Notificaciones
CREATE TABLE public.Notificaciones (
    ID_Notificacion         SERIAL PRIMARY KEY,
    ID_Usuario               UUID NOT NULL REFERENCES public.Usuarios(ID_Usuario) ON DELETE CASCADE,
    ID_Estado_Notificacion   INTEGER NOT NULL,
    Entidad_Estado_Notificacion VARCHAR(100) NOT NULL DEFAULT 'notificacion'
        CHECK (Entidad_Estado_Notificacion = 'notificacion'),
    Titulo_Notificacion      VARCHAR(200) NOT NULL,
    Mensaje_Notificacion     TEXT,
    Tipo_Notificacion        VARCHAR(50),
    FechaCreacion_Notificacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificaciones_estado FOREIGN KEY (ID_Estado_Notificacion, Entidad_Estado_Notificacion)
        REFERENCES public.Estados (ID_Estado, Entidad_Estado),
    CONSTRAINT chk_notificaciones_titulo CHECK (TRIM(Titulo_Notificacion) <> '')
);

-- 18. TABLA: Auditorias
CREATE TABLE public.Auditorias (
    ID_Auditoria           SERIAL PRIMARY KEY,
    ID_Usuario              UUID NOT NULL REFERENCES public.Usuarios(ID_Usuario) ON DELETE RESTRICT,
    IDRegistro_Auditoria    INTEGER,
    Accion_Auditoria        VARCHAR(100) NOT NULL,
    TablaAfectada_Auditoria VARCHAR(100) NOT NULL,
    DatosAnteriores_Auditoria JSONB,
    DatosNuevos_Auditoria      JSONB,
    Fecha_Auditoria             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DireccionIP_Auditoria       VARCHAR(50),
    CONSTRAINT chk_auditorias_accion CHECK (TRIM(Accion_Auditoria) <> ''),
    CONSTRAINT chk_auditorias_tabla CHECK (TRIM(TablaAfectada_Auditoria) <> '')
);

-- =====================================================================
-- ÍNDICES RECOMENDADOS
-- =====================================================================
CREATE INDEX idx_ubicaciones_biblioteca ON public.Ubicaciones(ID_Biblioteca);
CREATE INDEX idx_libros_categoria ON public.Libros(ID_Categoria);
CREATE INDEX idx_libros_editorial ON public.Libros(ID_Editorial);
CREATE INDEX idx_libros_autores_libro ON public.Libros_Autores(ID_Libro);
CREATE INDEX idx_libros_autores_autor ON public.Libros_Autores(ID_Autor);
CREATE INDEX idx_ejemplares_libro ON public.Ejemplares(ID_Libro);
CREATE INDEX idx_ejemplares_ubicacion ON public.Ejemplares(ID_Ubicacion);
CREATE INDEX idx_solicitudes_usuario ON public.Solicitudes(ID_Usuario);
CREATE INDEX idx_solicitudes_ejemplar ON public.Solicitudes(ID_Ejemplar);
CREATE INDEX idx_prestamos_usuario ON public.Prestamos(ID_Usuario);
CREATE INDEX idx_prestamos_ejemplar ON public.Prestamos(ID_Ejemplar);
CREATE INDEX idx_multas_prestamo ON public.Multas(ID_Prestamo);
CREATE INDEX idx_notificaciones_usuario ON public.Notificaciones(ID_Usuario);
CREATE INDEX idx_auditorias_usuario ON public.Auditorias(ID_Usuario);

-- =====================================================================
-- DATOS SEMILLA: Estados
-- =====================================================================
INSERT INTO public.Estados (Entidad_Estado, Codigo_Estado, Nombre_Estado, Descripcion_Estado, Orden_Estado) VALUES
    ('usuario',   'ACTIVO',        'Activo',        'Usuario habilitado con permisos plenos para solicitar préstamos y utilizar los servicios de la biblioteca.', 1),
    ('usuario',   'SUSPENDIDO',    'Suspendido',    'Usuario con acceso temporalmente restringido debido a multas pendientes o faltas al reglamento.',             2),
    ('usuario',   'INACTIVO',      'Inactivo',      'Cuenta de usuario dada de baja o inhabilitada en el sistema.',                                                 3),

    ('ejemplar',  'DISPONIBLE',    'Disponible',    'Ejemplar físico en estantería listo para consulta en sala o préstamo externo.',                               1),
    ('ejemplar',  'PRESTADO',      'Prestado',      'Ejemplar actualmente en posesión de un usuario en calidad de préstamo.',                                      2),
    ('ejemplar',  'MANTENIMIENTO', 'Mantenimiento', 'Ejemplar retirado temporalmente para encuadernación, desinfección o reparación.',                             3),
    ('ejemplar',  'PERDIDO',       'Perdido',       'Ejemplar extraviado, no localizado o reportado como no devuelto.',                                            4),
    ('ejemplar',  'RESERVADO',     'Reservado',     'Ejemplar apartado para un lector cuya solicitud fue aprobada y aún no lo ha retirado.',                       5),

    ('solicitud', 'PENDIENTE',     'Pendiente',     'Solicitud de préstamo registrada a la espera de revisión y aprobación por personal bibliotecario.',            1),
    ('solicitud', 'APROBADA',      'Aprobada',      'Solicitud aceptada; el ejemplar está reservado y listo para ser retirado por el usuario.',                   2),
    ('solicitud', 'RECHAZADA',     'Rechazada',     'Solicitud denegada por motivos de disponibilidad, sanciones activas o políticas del servicio.',                3),
    ('solicitud', 'CANCELADA',     'Cancelada',     'Solicitud anulada por el propio usuario o automáticamente por vencimiento del plazo de retiro.',              4),

    ('prestamo',  'ACTIVO',        'Activo',        'Préstamo en curso dentro del período autorizado de vigencia.',                                                1),
    ('prestamo',  'DEVUELTO',      'Devuelto',      'Material bibliográfico reintegrado conforme a las instalaciones de la biblioteca.',                           2),
    ('prestamo',  'VENCIDO',       'Vencido',       'Préstamo que ha sobrepasado la fecha límite estipulada de devolución sin entrega del material.',              3),
    ('prestamo',  'PERDIDO',       'Perdido',       'Préstamo declarado en pérdida o daño irrecuperable por parte del prestatario.',                               4),

    ('multa',     'PENDIENTE',     'Pendiente',     'Sanción económica o administrativa generada pendiente de pago o resolución.',                                 1),
    ('multa',     'PAGADA',        'Pagada',        'Multa saldada y registrada a satisfacción en el sistema.',                                                     2),
    ('multa',     'CANCELADA',     'Cancelada',     'Multa anulada, exonerada o condonada por decisión administrativa justificada.',                                3),

    ('biblioteca',        'ACTIVA',    'Activa',    'Sede bibliotecaria abierta y prestando servicios regulares al público.',                                      1),
    ('biblioteca',        'INACTIVA',  'Inactiva',  'Sede temporalmente cerrada, fuera de servicio o en proceso de reorganización.',                               2),

    ('ubicacion',         'ACTIVA',    'Activa',    'Espacio, sección o estantería habilitada para albergar ejemplares físicos.',                                  1),
    ('ubicacion',         'INACTIVA',  'Inactiva',  'Ubicación deshabilitada, clausurada o en proceso de mantenimiento físico.',                                   2),

    ('categoria_libro',   'ACTIVA',    'Activa',    'Categoría temática vigente y disponible para clasificar obras bibliográficas.',                               1),
    ('categoria_libro',   'INACTIVA',  'Inactiva',  'Categoría en desuso o archivada temporalmente.',                                                              2),

    ('editorial',         'ACTIVA',    'Activa',    'Empresa editorial vigente y disponible para vincular a títulos del catálogo.',                                1),
    ('editorial',         'INACTIVA',  'Inactiva',  'Editorial inactiva, fusionada o descontinuada en los registros.',                                             2),

    ('libro',              'DISPONIBLE',   'Disponible',   'Título activo en el catálogo con posibilidad de circular en las distintas sedes.',                     1),
    ('libro',              'DESCATALOGADO','Descatalogado','Título retirado del plan editorial o excluido formalmente del catálogo activo de la biblioteca.',    2),
    ('libro',              'AGOTADO',      'Agotado',      'Título que no posee ejemplares físicos hábiles o en existencia actualmente.',                         3),

    ('notificacion',       'NO_LEIDA',     'No leída',     'Mensaje generado que aún no ha sido visualizado o revisado por el destinatario.',                     1),
    ('notificacion',       'LEIDA',        'Leída',        'Mensaje visualizado y confirmado como leído por el usuario.',                                          2);

-- =====================================================================
-- DATOS SEMILLA: Roles
-- =====================================================================
INSERT INTO public.Roles (ID_Rol, Nombre_Rol, Descripcion_Rol) VALUES
    (1, 'Administrador', 'Control total del sistema, inventario, reportes y usuarios'),
    (2, 'Bibliotecario', 'Gestión de préstamos, devoluciones, ejemplares y solicitudes'),
    (3, 'Lector', 'Consulta de catálogo, realización de reservas y seguimiento de préstamos');

-- =====================================================================
-- RESTRICCIONES DE NEGOCIO (Índices únicos parciales resueltos dinámicamente)
-- =====================================================================

DO $$
DECLARE
    v_id_prestamo_activo INTEGER;
BEGIN
    SELECT ID_Estado INTO v_id_prestamo_activo
    FROM public.Estados
    WHERE Entidad_Estado = 'prestamo' AND Codigo_Estado = 'ACTIVO';

    EXECUTE format(
        'CREATE UNIQUE INDEX uq_ejemplar_un_solo_prestamo_activo
            ON public.Prestamos (ID_Ejemplar)
            WHERE ID_Estado_Prestamo = %L',
        v_id_prestamo_activo
    );
END $$;

CREATE UNIQUE INDEX uq_solicitud_un_solo_prestamo
    ON public.Prestamos (ID_Solicitud)
    WHERE ID_Solicitud IS NOT NULL;

DO $$
DECLARE
    v_id_solicitud_pendiente INTEGER;
BEGIN
    SELECT ID_Estado INTO v_id_solicitud_pendiente
    FROM public.Estados
    WHERE Entidad_Estado = 'solicitud' AND Codigo_Estado = 'PENDIENTE';

    EXECUTE format(
        'CREATE UNIQUE INDEX uq_solicitud_pendiente_usuario_ejemplar
            ON public.Solicitudes (ID_Usuario, ID_Ejemplar)
            WHERE ID_Estado_Solicitud = %L',
        v_id_solicitud_pendiente
    );
END $$;

-- =====================================================================
-- TRIGGERS DE VALIDACIÓN
-- =====================================================================

-- Coherencia entre Solicitud y Préstamo
CREATE OR REPLACE FUNCTION public.fn_validar_coherencia_solicitud_prestamo()
RETURNS TRIGGER AS $$
DECLARE
    v_usuario_solicitud  UUID;
    v_ejemplar_solicitud INTEGER;
BEGIN
    IF NEW.ID_Solicitud IS NOT NULL THEN
        SELECT ID_Usuario, ID_Ejemplar
        INTO v_usuario_solicitud, v_ejemplar_solicitud
        FROM public.Solicitudes
        WHERE ID_Solicitud = NEW.ID_Solicitud;

        IF v_usuario_solicitud IS DISTINCT FROM NEW.ID_Usuario THEN
            RAISE EXCEPTION 'El préstamo no corresponde al usuario de la solicitud % (solicitud: usuario %, préstamo: usuario %)',
                NEW.ID_Solicitud, v_usuario_solicitud, NEW.ID_Usuario;
        END IF;

        IF v_ejemplar_solicitud IS DISTINCT FROM NEW.ID_Ejemplar THEN
            RAISE EXCEPTION 'El préstamo no corresponde al ejemplar de la solicitud % (solicitud: ejemplar %, préstamo: ejemplar %)',
                NEW.ID_Solicitud, v_ejemplar_solicitud, NEW.ID_Ejemplar;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_coherencia_solicitud_prestamo
    BEFORE INSERT OR UPDATE ON public.Prestamos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validar_coherencia_solicitud_prestamo();

-- Validación de Estado Activo
CREATE OR REPLACE FUNCTION public.fn_validar_estado_activo()
RETURNS TRIGGER AS $$
DECLARE
    v_columna_id_estado TEXT;
    v_id_estado         INTEGER;
    v_activo            BOOLEAN;
BEGIN
    v_columna_id_estado := 'id_estado_' || TG_ARGV[0];
    v_id_estado := (to_jsonb(NEW) ->> v_columna_id_estado)::INTEGER;

    SELECT Activo_Estado INTO v_activo
    FROM public.Estados
    WHERE ID_Estado = v_id_estado;

    IF v_activo IS FALSE THEN
        RAISE EXCEPTION 'El estado % está inactivo y no puede asignarse a un registro de %',
            v_id_estado, TG_TABLE_NAME;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estado_activo_bibliotecas
    BEFORE INSERT OR UPDATE ON public.Bibliotecas
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('biblioteca');

CREATE TRIGGER trg_estado_activo_ubicaciones
    BEFORE INSERT OR UPDATE ON public.Ubicaciones
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('ubicacion');

CREATE TRIGGER trg_estado_activo_usuarios
    BEFORE INSERT OR UPDATE ON public.Usuarios
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('usuario');

CREATE TRIGGER trg_estado_activo_editoriales
    BEFORE INSERT OR UPDATE ON public.Editoriales
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('editorial');

CREATE TRIGGER trg_estado_activo_categlib
    BEFORE INSERT OR UPDATE ON public.Categorias_Libros
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('categlib');

CREATE TRIGGER trg_estado_activo_libros
    BEFORE INSERT OR UPDATE ON public.Libros
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('libro');

CREATE TRIGGER trg_estado_activo_ejemplares
    BEFORE INSERT OR UPDATE ON public.Ejemplares
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('ejemplar');

CREATE TRIGGER trg_estado_activo_solicitudes
    BEFORE INSERT OR UPDATE ON public.Solicitudes
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('solicitud');

CREATE TRIGGER trg_estado_activo_prestamos
    BEFORE INSERT OR UPDATE ON public.Prestamos
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('prestamo');

CREATE TRIGGER trg_estado_activo_multas
    BEFORE INSERT OR UPDATE ON public.Multas
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('multa');

CREATE TRIGGER trg_estado_activo_notificaciones
    BEFORE INSERT OR UPDATE ON public.Notificaciones
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_estado_activo('notificacion');

-- =====================================================================
-- INTEGRACIÓN NATIVA CON SUPABASE AUTH (auth.users -> public.Usuarios)
-- =====================================================================

-- Función trigger para registrar automáticamente perfiles cuando un usuario se registra en Supabase
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_id_rol_lector INTEGER;
    v_id_estado_activo INTEGER;
    v_nombre TEXT;
BEGIN
    -- Obtener Rol 'Lector' por defecto
    SELECT ID_Rol INTO v_id_rol_lector FROM public.Roles WHERE Nombre_Rol = 'Lector';
    IF v_id_rol_lector IS NULL THEN
        v_id_rol_lector := 3;
    END IF;

    -- Obtener Estado 'ACTIVO' de usuario
    SELECT ID_Estado INTO v_id_estado_activo 
    FROM public.Estados 
    WHERE Entidad_Estado = 'usuario' AND Codigo_Estado = 'ACTIVO';

    -- Resolver nombre completo desde metadata o email
    v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    INSERT INTO public.Usuarios (
        ID_Usuario,
        ID_Rol,
        ID_Estado_Usuario,
        Entidad_Estado_Usuario,
        NombreCompleto_Usuario,
        Correo_Usuario
    ) VALUES (
        NEW.id,
        v_id_rol_lector,
        v_id_estado_activo,
        'usuario',
        v_nombre,
        NEW.email
    )
    ON CONFLICT (ID_Usuario) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparar trigger al crearse un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================================================================
-- SINCRONIZAR USUARIOS ACTUALES DE auth.users HACIA public.Usuarios
-- =====================================================================
DO $$
DECLARE
    v_id_rol_admin INTEGER;
    v_id_rol_lector INTEGER;
    v_id_estado_activo INTEGER;
BEGIN
    SELECT ID_Rol INTO v_id_rol_admin FROM public.Roles WHERE Nombre_Rol = 'Administrador';
    SELECT ID_Rol INTO v_id_rol_lector FROM public.Roles WHERE Nombre_Rol = 'Lector';
    SELECT ID_Estado INTO v_id_estado_activo FROM public.Estados WHERE Entidad_Estado = 'usuario' AND Codigo_Estado = 'ACTIVO';

    -- Insertar usuarios existentes de auth.users asignando Admin al correo admin
    INSERT INTO public.Usuarios (
        ID_Usuario,
        ID_Rol,
        ID_Estado_Usuario,
        Entidad_Estado_Usuario,
        NombreCompleto_Usuario,
        Correo_Usuario
    )
    SELECT 
        u.id,
        CASE WHEN u.email LIKE 'admin%' THEN v_id_rol_admin ELSE v_id_rol_lector END,
        v_id_estado_activo,
        'usuario',
        CASE WHEN u.email LIKE 'admin%' THEN 'Administrador General' ELSE COALESCE(u.raw_user_meta_data->>'nombre', 'Usuario Lector') END,
        u.email
    FROM auth.users u
    ON CONFLICT (ID_Usuario) DO NOTHING;
END $$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.Estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Configuraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Bibliotecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Editoriales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Categorias_Libros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Autores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Libros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Libros_Autores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Ejemplares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Auditorias ENABLE ROW LEVEL SECURITY;

-- Catálogos públicos de sólo lectura para anon y authenticated
CREATE POLICY "Lectura publica de estados" ON public.Estados FOR SELECT USING (true);
CREATE POLICY "Lectura publica de roles" ON public.Roles FOR SELECT USING (true);
CREATE POLICY "Lectura publica de configuraciones" ON public.Configuraciones FOR SELECT USING (true);
CREATE POLICY "Lectura publica de bibliotecas" ON public.Bibliotecas FOR SELECT USING (true);
CREATE POLICY "Lectura publica de ubicaciones" ON public.Ubicaciones FOR SELECT USING (true);
CREATE POLICY "Lectura publica de editoriales" ON public.Editoriales FOR SELECT USING (true);
CREATE POLICY "Lectura publica de categorias" ON public.Categorias_Libros FOR SELECT USING (true);
CREATE POLICY "Lectura publica de autores" ON public.Autores FOR SELECT USING (true);
CREATE POLICY "Lectura publica de libros" ON public.Libros FOR SELECT USING (true);
CREATE POLICY "Lectura publica de libros_autores" ON public.Libros_Autores FOR SELECT USING (true);
CREATE POLICY "Lectura publica de ejemplares" ON public.Ejemplares FOR SELECT USING (true);

-- Usuarios: lectura de su propio perfil o lectura general para autenticados
CREATE POLICY "Usuarios ven su propio perfil" ON public.Usuarios FOR SELECT USING (auth.uid() = ID_Usuario);
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.Usuarios FOR UPDATE USING (auth.uid() = ID_Usuario);

-- Solicitudes: usuarios ven y crean sus propias solicitudes
CREATE POLICY "Usuarios ven sus propias solicitudes" ON public.Solicitudes FOR SELECT USING (auth.uid() = ID_Usuario);
CREATE POLICY "Usuarios crean sus propias solicitudes" ON public.Solicitudes FOR INSERT WITH CHECK (auth.uid() = ID_Usuario);

-- Prestamos: usuarios ven sus propios préstamos
CREATE POLICY "Usuarios ven sus propios prestamos" ON public.Prestamos FOR SELECT USING (auth.uid() = ID_Usuario);

-- Multas: usuarios ven sus propias multas
CREATE POLICY "Usuarios ven sus multas" ON public.Multas FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.Prestamos p WHERE p.ID_Prestamo = Multas.ID_Prestamo AND p.ID_Usuario = auth.uid())
);

-- Notificaciones: usuarios ven sus propias notificaciones
CREATE POLICY "Usuarios ven sus notificaciones" ON public.Notificaciones FOR SELECT USING (auth.uid() = ID_Usuario);
CREATE POLICY "Usuarios actualizan sus notificaciones" ON public.Notificaciones FOR UPDATE USING (auth.uid() = ID_Usuario);

COMMIT;
