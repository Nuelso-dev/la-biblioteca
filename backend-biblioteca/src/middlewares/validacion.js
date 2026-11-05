/**
 * Valida que el parámetro de ruta especificado sea un ID numérico entero positivo.
 *
 * @param {string} paramName - Nombre del parámetro en req.params (por defecto 'id')
 */
export const validarId = (paramName = 'id') => (req, res, next) => {
  const rawId = req.params[paramName];
  const idNum = Number(rawId);

  if (!rawId || !Number.isInteger(idNum) || idNum <= 0) {
    return res.status(400).json({
      success: false,
      error: { message: `El parámetro '${paramName}' debe ser un identificador numérico entero positivo.` },
    });
  }

  req.params[paramName] = idNum;
  return next();
};

/**
 * Valida que el parámetro de ruta especificado sea un UUID v4 válido.
 *
 * @param {string} paramName - Nombre del parámetro en req.params
 */
export const validarUUID = (paramName = 'id') => (req, res, next) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const rawVal = req.params[paramName];

  if (!rawVal || !uuidRegex.test(rawVal)) {
    return res.status(400).json({
      success: false,
      error: { message: `El parámetro '${paramName}' debe ser un identificador UUID válido.` },
    });
  }

  return next();
};

/**
 * Valida y normaliza los parámetros de consulta 'limit' y 'page' para paginación segura.
 */
export const validarPaginacion = (req, res, next) => {
  let { page = 1, limit = 20 } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 20;

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
  };

  return next();
};

/**
 * Valida la estructura del cuerpo de la solicitud JSON y la presencia de campos obligatorios.
 *
 * @param {string[]} requeridos - Nombres de campos requeridos
 * @param {object} [reglas] - Reglas opcionales de validación de tipos
 */
export const validarBody = (requeridos = [], reglas = {}) => (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      error: { message: 'El cuerpo de la solicitud debe ser un objeto JSON válido.' },
    });
  }

  // Verificar campos obligatorios
  for (const campo of requeridos) {
    const val = req.body[campo];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: { message: `El campo '${campo}' es obligatorio.` },
      });
    }
  }

  // Sanitizar strings y verificar tipos según reglas
  for (const [campo, tipoEsperado] of Object.entries(reglas)) {
    const val = req.body[campo];
    if (val === undefined || val === null) continue;

    if (tipoEsperado === 'string') {
      if (typeof val !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: `El campo '${campo}' debe ser una cadena de texto.` },
        });
      }
      req.body[campo] = val.trim();
    } else if (tipoEsperado === 'number') {
      if (typeof val !== 'number' || isNaN(val)) {
        return res.status(400).json({
          success: false,
          error: { message: `El campo '${campo}' debe ser un valor numérico.` },
        });
      }
    } else if (tipoEsperado === 'integer') {
      if (!Number.isInteger(val)) {
        return res.status(400).json({
          success: false,
          error: { message: `El campo '${campo}' debe ser un número entero.` },
        });
      }
    } else if (tipoEsperado === 'boolean') {
      if (typeof val !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: { message: `El campo '${campo}' debe ser un valor booleano.` },
        });
      }
    }
  }

  return next();
};
