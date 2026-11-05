import * as auditoriasService from '../services/auditorias.service.js';
import { metaPaginacion } from '../utils/paginacion.js';

export const getAuditorias = async (req, res, next) => {
  try {
    const { tabla, idUsuario, busqueda } = req.query;
    const { limit, offset } = req.pagination;
    const { datos, total } = await auditoriasService.listarAuditorias({
      tabla: typeof tabla === 'string' ? tabla.trim() : undefined,
      idUsuario,
      busqueda: typeof busqueda === 'string' ? busqueda.trim().slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, ...metaPaginacion(req.pagination, total), data: datos });
  } catch (error) {
    next(error);
  }
};
