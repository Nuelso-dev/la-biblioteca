import * as multasRepo from '../repositories/multas.repository.js';
import * as auditoriasService from './auditorias.service.js';
import { notificar } from './notificaciones.service.js';

export const obtenerMultas = async (filtros) => {
  return await multasRepo.findAll(filtros);
};

export const listarMultas = async (filtros) => {
  const [datos, total] = await Promise.all([multasRepo.findAll(filtros), multasRepo.count(filtros)]);
  return { datos, total };
};

export const obtenerMultaPorId = async (id) => {
  const multa = await multasRepo.findById(id);
  if (!multa) {
    const error = new Error('Multa no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return multa;
};

export const registrarPagoMulta = async (idMulta, observaciones, usuarioActual) => {
  const anterior = await obtenerMultaPorId(idMulta);

  if (anterior.codigo_estado === 'PAGADA') {
    const error = new Error('La multa ya se encuentra pagada.');
    error.statusCode = 400;
    throw error;
  }

  if (anterior.codigo_estado === 'CANCELADA') {
    const error = new Error('No se puede cobrar una multa cancelada o exonerada.');
    error.statusCode = 400;
    throw error;
  }

  const pagada = await multasRepo.pagar(idMulta, observaciones);

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: idMulta,
    accion: 'PAGAR_MULTA',
    tablaAfectada: 'Multas',
    datosAnteriores: anterior,
    datosNuevos: pagada,
  });

  await notificar({
    idUsuario: anterior.id_usuario,
    titulo: 'Multa pagada',
    mensaje: `Registramos el pago de tu multa por "${anterior.titulo_libro}" ($${Number(anterior.valor_multa).toLocaleString('es-CO')}).`,
    tipo: 'MULTA',
  });

  return pagada;
};

export const cancelarMulta = async (idMulta, motivo, usuarioActual) => {
  const anterior = await obtenerMultaPorId(idMulta);

  if (anterior.codigo_estado === 'PAGADA') {
    const error = new Error('No se puede cancelar una multa que ya fue pagada.');
    error.statusCode = 400;
    throw error;
  }

  const cancelada = await multasRepo.cancelar(idMulta, motivo);

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: idMulta,
    accion: 'CANCELAR_MULTA',
    tablaAfectada: 'Multas',
    datosAnteriores: anterior,
    datosNuevos: cancelada,
  });

  await notificar({
    idUsuario: anterior.id_usuario,
    titulo: 'Multa exonerada',
    mensaje: `Tu multa por "${anterior.titulo_libro}" fue cancelada por la administración.`,
    tipo: 'MULTA',
  });

  return cancelada;
};

/** Cantidad y saldo de las multas pendientes (opcionalmente de un solo usuario). */
export const obtenerResumenPendientes = async (idUsuario) => {
  const filtros = { idUsuario, codigoEstado: 'PENDIENTE' };
  const [pendientes, saldoPendiente] = await Promise.all([multasRepo.count(filtros), multasRepo.sumarValor(filtros)]);
  return { pendientes, saldoPendiente };
};
