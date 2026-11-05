/**
 * Construye los metadatos de paginación que acompañan a un listado.
 *
 * @param {{page: number, limit: number}} paginacion - Valores validados por validarPaginacion
 * @param {number} total - Total de registros que cumplen los filtros
 * @returns {{page: number, limit: number, total: number, totalPages: number}}
 */
export const metaPaginacion = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
