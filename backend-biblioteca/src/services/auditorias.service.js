import * as auditoriasRepository from '../repositories/auditorias.repository.js';
import logger from '../utils/logger.js';

export const registrarAuditoria = async (params) => {
  try {
    return await auditoriasRepository.create(params);
  } catch (error) {
    logger.error('Error al registrar auditoría:', error.message || error);
    return null;
  }
};

export const obtenerAuditorias = async (filtros) => {
  return await auditoriasRepository.findAll(filtros);
};

export const listarAuditorias = async (filtros) => {
  const [datos, total] = await Promise.all([auditoriasRepository.findAll(filtros), auditoriasRepository.count(filtros)]);
  return { datos, total };
};
