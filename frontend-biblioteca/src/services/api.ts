// Barrel de servicios del frontend
// Solo exporta servicios respaldados por tablas activas en migration_supabase.sql

export * from './api-client';

// Catálogos
export * from './autores.service';
export * from './bibliotecas.service';
export * from './categorias.service';
export * from './editoriales.service';
export * from './libros.service';

export * from './ubicaciones.service';
export * from './ejemplares.service';
export * from './notificaciones.service';
export * from './auditorias.service';

// Operaciones de préstamo
export * from './prestamos.service';
export * from './solicitudes.service';
export * from './multas.service';

// Usuarios y configuración
export * from './usuarios.service';
export * from './config.service';
