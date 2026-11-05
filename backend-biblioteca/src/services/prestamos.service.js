import * as prestamosRepo from '../repositories/prestamos.repository.js';
import * as ejemplaresRepo from '../repositories/ejemplares.repository.js';
import * as solicitudesRepo from '../repositories/solicitudes.repository.js';
import * as configRepo from '../repositories/config.repository.js';
import * as auditoriasService from './auditorias.service.js';
import { notificar } from './notificaciones.service.js';
import { finDelDia, formatearFecha, sumarDias } from '../utils/fechas.js';


const obtenerConfigNumerica = async (clave, porDefecto) => {
  const config = await configRepo.findByClave(clave);
  const valor = Number(config?.valor_configuracion);
  return Number.isFinite(valor) && valor > 0 ? valor : porDefecto;
};

export const obtenerPrestamos = async (filtros) => {
  await prestamosRepo.marcarVencidos();
  return await prestamosRepo.findAll(filtros);
};

export const listarPrestamos = async (filtros) => {
  await prestamosRepo.marcarVencidos();
  const [datos, total] = await Promise.all([prestamosRepo.findAll(filtros), prestamosRepo.count(filtros)]);
  return { datos, total };
};

export const obtenerPrestamoPorId = async (id) => {
  const prestamo = await prestamosRepo.findById(id);
  if (!prestamo) {
    const error = new Error('Préstamo no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return prestamo;
};

export const crearPrestamo = async (datos, usuarioActual) => {
  // 0. El ejemplar debe existir y estar DISPONIBLE (no prestado, en mantenimiento ni perdido)
  const ejemplar = await ejemplaresRepo.findById(datos.idEjemplar);
  if (!ejemplar) {
    const error = new Error('El ejemplar seleccionado no existe.');
    error.statusCode = 404;
    throw error;
  }
  // Un ejemplar RESERVADO solo puede entregarse al lector cuya solicitud aprobada lo apartó
  const reservadoParaSolicitud = ejemplar.codigo_estado === 'RESERVADO' && datos.idSolicitud;
  if (ejemplar.codigo_estado !== 'DISPONIBLE' && !reservadoParaSolicitud) {
    const error = new Error(
      ejemplar.codigo_estado === 'RESERVADO'
        ? 'El ejemplar está reservado para un lector con una solicitud aprobada. Registra el préstamo desde esa solicitud.'
        : `El ejemplar no está disponible para préstamo (estado actual: ${ejemplar.nombre_estado}).`
    );
    error.statusCode = 409;
    throw error;
  }

  // 0.1 Límite de préstamos abiertos por usuario (configuración MAX_PRESTAMOS_USUARIO)
  const maxPrestamos = await obtenerConfigNumerica('MAX_PRESTAMOS_USUARIO', 3);
  const abiertos = await prestamosRepo.contarAbiertosPorUsuario(datos.idUsuario);
  if (abiertos >= maxPrestamos) {
    const error = new Error(`El usuario ya tiene ${abiertos} préstamos abiertos (máximo permitido: ${maxPrestamos}).`);
    error.statusCode = 409;
    throw error;
  }

  // 1. Validar que el ejemplar no tenga ya un préstamo activo
  const prestamoActivo = await prestamosRepo.findPrestamoActivoByEjemplar(datos.idEjemplar);
  if (prestamoActivo) {
    const error = new Error('El ejemplar seleccionado ya tiene un préstamo activo.');
    error.statusCode = 409;
    throw error;
  }

  // 2. Si viene de solicitud, validar coherencia
  if (datos.idSolicitud) {
    const solicitud = await solicitudesRepo.findById(datos.idSolicitud);
    if (!solicitud) {
      const error = new Error('La solicitud referenciada no existe.');
      error.statusCode = 404;
      throw error;
    }
    if (solicitud.id_usuario !== datos.idUsuario || solicitud.id_ejemplar !== datos.idEjemplar) {
      const error = new Error('Los datos del usuario o ejemplar no coinciden con la solicitud referenciada.');
      error.statusCode = 400;
      throw error;
    }
    if (solicitud.codigo_estado !== 'PENDIENTE' && solicitud.codigo_estado !== 'APROBADA') {
      const error = new Error(`La solicitud ya no admite préstamo (estado actual: ${solicitud.nombre_estado}).`);
      error.statusCode = 409;
      throw error;
    }
  }

  // 2.1 La fecha de vencimiento indicada debe ser futura (restricción chk_prestamos_vencimiento de la BD)
  if (datos.fechaVencimiento) {
    const vencimiento = new Date(datos.fechaVencimiento);
    if (Number.isNaN(vencimiento.getTime()) || vencimiento <= new Date()) {
      const error = new Error('La fecha de vencimiento debe ser posterior al momento actual.');
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Calcular fecha de vencimiento si no se suministra (configuración DIAS_MAX_PRESTAMO)
  let fechaVencimiento = datos.fechaVencimiento;
  if (!fechaVencimiento) {
    const diasPrestamo = await obtenerConfigNumerica('DIAS_MAX_PRESTAMO', 14);
    fechaVencimiento = finDelDia(diasPrestamo).toISOString();
  }

  const creado = await prestamosRepo.create({
    ...datos,
    fechaVencimiento,
    registradoPor: usuarioActual.id,
  });

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: creado.id_prestamo,
    accion: 'CREAR_PRESTAMO',
    tablaAfectada: 'Prestamos',
    datosAnteriores: null,
    datosNuevos: creado,
  });

  const completo = await obtenerPrestamoPorId(creado.id_prestamo);
  await notificar({
    idUsuario: completo.id_usuario,
    titulo: 'Préstamo registrado',
    mensaje: `Se registró el préstamo de "${completo.titulo_libro}". Devuélvelo antes del ${formatearFecha(completo.fechavencimiento_prestamo)}.`,
    tipo: 'PRESTAMO',
  });
  return completo;
};

export const registrarDevolucion = async (idPrestamo, observaciones, usuarioActual) => {
  const anterior = await obtenerPrestamoPorId(idPrestamo);
  const resultado = await prestamosRepo.registrarDevolucion(idPrestamo, observaciones);

  await notificar({
    idUsuario: anterior.id_usuario,
    titulo: 'Devolución registrada',
    mensaje: resultado.multa
      ? `Recibimos "${anterior.titulo_libro}" con retraso. Se generó una multa de $${Number(resultado.multa.valor_multa).toLocaleString('es-CO')}.`
      : `Recibimos "${anterior.titulo_libro}". ¡Gracias por devolverlo a tiempo!`,
    tipo: resultado.multa ? 'MULTA' : 'PRESTAMO',
  });

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: idPrestamo,
    accion: 'DEVOLUCION_PRESTAMO',
    tablaAfectada: 'Prestamos',
    datosAnteriores: anterior,
    datosNuevos: resultado,
  });

  return resultado;
};

export const renovarPrestamo = async (idPrestamo, { dias = 7 }, usuarioActual) => {
  const prestamo = await obtenerPrestamoPorId(idPrestamo);

  if (prestamo.codigo_estado !== 'ACTIVO') {
    const error = new Error(`Solo se pueden renovar préstamos ACTIVOS. Estado actual: ${prestamo.nombre_estado}`);
    error.statusCode = 400;
    throw error;
  }

  const fechaActualVenc = new Date(prestamo.fechavencimiento_prestamo);
  if (new Date() > fechaActualVenc) {
    const error = new Error('No es posible renovar un préstamo que ya se encuentra vencido. Debe registrarse devolución.');
    error.statusCode = 400;
    throw error;
  }

  const nuevoVencimiento = sumarDias(fechaActualVenc, dias);
  const renovado = await prestamosRepo.renovar(idPrestamo, nuevoVencimiento.toISOString());

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: idPrestamo,
    accion: 'RENOVAR_PRESTAMO',
    tablaAfectada: 'Prestamos',
    datosAnteriores: prestamo,
    datosNuevos: renovado,
  });

  await notificar({
    idUsuario: prestamo.id_usuario,
    titulo: 'Préstamo renovado',
    mensaje: `Tu préstamo de "${prestamo.titulo_libro}" ahora vence el ${formatearFecha(nuevoVencimiento)}.`,
    tipo: 'PRESTAMO',
  });

  return await obtenerPrestamoPorId(idPrestamo);
};
