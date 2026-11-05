import logger from '../utils/logger.js';

/** Mensajes concretos por restricción de PostgreSQL (unicidad y validación). */
const MENSAJES_RESTRICCION = {
  usuarios_documento_usuario_key: 'Ya existe otra cuenta registrada con ese documento de identidad.',
  usuarios_correo_usuario_key: 'Ya existe una cuenta registrada con ese correo electrónico.',
  libros_isbn_libro_key: 'Ya existe un libro registrado con ese ISBN.',
  ejemplares_codinterno_ejemplar_key: 'Ya existe un ejemplar registrado con ese código interno.',
  roles_nombre_rol_key: 'Ya existe un rol con ese nombre.',
  configuraciones_clave_configuracion_key: 'Ya existe una configuración con esa clave.',
  uq_favoritos_usuario_libro: 'Este libro ya está en tus favoritos.',
  uq_libros_autores: 'Ese autor ya está asociado al libro.',
  chk_libros_paginas: 'El número de páginas debe ser mayor que cero.',
  chk_libros_titulo: 'El título del libro no puede estar vacío.',
  chk_usuarios_nombre: 'El nombre no puede estar vacío.',
  chk_usuarios_correo: 'El correo no puede estar vacío.',
  chk_multas_valor: 'El valor de la multa no puede ser negativo.',
  chk_prestamos_vencimiento: 'La fecha de vencimiento no puede ser anterior a la fecha del préstamo.',
};

/**
 * Middleware global para el manejo centralizado de errores.
 * Atrapa cualquier excepción ocurrida en las rutas y devuelve un JSON uniforme.
 * 
 * @param {Error} err - Objeto de error
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 * @param {import('express').NextFunction} next - Siguiente middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Mapear códigos específicos de PostgreSQL
  if (err.code === '23505') { // Violación de unicidad (unique violation)
    statusCode = 409;
    message = MENSAJES_RESTRICCION[err.constraint] || 'Ya existe un registro con los datos suministrados (conflicto de duplicidad).';
  } else if (err.code === '23503') { // Violación de llave foránea (foreign key violation)
    statusCode = 400;
    message = 'El registro hace referencia a una entidad inexistente o está en uso por otros datos.';
  } else if (err.code === '23514') { // Violación de check constraint
    statusCode = 400;
    message = MENSAJES_RESTRICCION[err.constraint] || 'Los datos no cumplen con las restricciones de validación del sistema.';
  } else if (err.code === 'P0001') { // Raise exception en triggers
    statusCode = 400;
    message = err.message || 'La operación no cumple con las reglas de negocio de la biblioteca.';
  }

  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Ocurrió un error interno en el servidor. Inténtalo más tarde.';
  }

  if (statusCode === 404) {
    logger.warn(`${req.method} ${req.originalUrl} - 404 No Encontrado`);
  } else {
    logger.error(`${req.method} ${req.originalUrl} - Código: ${statusCode} - Mensaje: ${message}`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack, pgCode: err.code })
    }
  });
};

export default errorHandler;
