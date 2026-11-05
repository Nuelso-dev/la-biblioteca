import * as solicitudesRepo from '../repositories/solicitudes.repository.js';
import * as ejemplaresRepo from '../repositories/ejemplares.repository.js';
import * as estadosRepo from '../repositories/estados.repository.js';
import { query } from '../config/database.js';
import * as configRepo from '../repositories/config.repository.js';
import * as auditoriasService from './auditorias.service.js';

// Las solicitudes sin respuesta se cancelan tras DIAS_VENCIMIENTO_SOLICITUD días
const expirarSolicitudesVencidas = async () => {
  const config = await configRepo.findByClave('DIAS_VENCIMIENTO_SOLICITUD');
  const dias = Number(config?.valor_configuracion);
  if (Number.isFinite(dias) && dias > 0) {
    await solicitudesRepo.expirarPendientes(dias);
  }
};

export const obtenerSolicitudes = async (filtros) => {
  await expirarSolicitudesVencidas();
  return await solicitudesRepo.findAll(filtros);
};

export const listarSolicitudes = async (filtros) => {
  await expirarSolicitudesVencidas();
  const [datos, total] = await Promise.all([solicitudesRepo.findAll(filtros), solicitudesRepo.count(filtros)]);
  return { datos, total };
};

export const obtenerSolicitudPorId = async (id) => {
  const solicitud = await solicitudesRepo.findById(id);
  if (!solicitud) {
    const error = new Error('Solicitud no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return solicitud;
};

export const crearSolicitud = async ({ idEjemplar, observaciones }, usuarioActual) => {
  // 1. Verificar si el ejemplar existe
  const ejemplar = await ejemplaresRepo.findById(idEjemplar);
  if (!ejemplar) {
    const error = new Error('El ejemplar seleccionado no existe.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verificar que el ejemplar esté disponible
  if (ejemplar.codigo_estado !== 'DISPONIBLE') {
    const error = new Error(`El ejemplar no está disponible para solicitud (estado actual: ${ejemplar.nombre_estado}).`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Evitar duplicados: no permitir más de una solicitud PENDIENTE para el mismo ejemplar por el mismo usuario
  const solicitudExistente = await solicitudesRepo.findPendiente(usuarioActual.id, idEjemplar);
  if (solicitudExistente) {
    const error = new Error('Ya tienes una solicitud pendiente registrada para este ejemplar.');
    error.statusCode = 409;
    throw error;
  }

  const nueva = await solicitudesRepo.create({
    idUsuario: usuarioActual.id,
    idEjemplar,
    observaciones,
  });

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: nueva.id_solicitud,
    accion: 'CREAR_SOLICITUD',
    tablaAfectada: 'Solicitudes',
    datosAnteriores: null,
    datosNuevos: nueva,
  });

  return await obtenerSolicitudPorId(nueva.id_solicitud);
};

export const cancelarSolicitud = async (idSolicitud, usuarioActual) => {
  const solicitud = await obtenerSolicitudPorId(idSolicitud);

  // Validar permisos de cancelación (propietario o Admin)
  if (usuarioActual.rol === 'Lector' && solicitud.id_usuario !== usuarioActual.id) {
    const error = new Error('No tienes permiso para cancelar esta solicitud.');
    error.statusCode = 403;
    throw error;
  }

  // Los lectores solo cancelan mientras esté pendiente; el personal también puede liberar una reserva aprobada
  if (solicitud.codigo_estado !== 'PENDIENTE' && !(solicitud.codigo_estado === 'APROBADA' && usuarioActual.rol !== 'Lector')) {
    const error = new Error(`Solo se pueden cancelar solicitudes en estado PENDIENTE. Estado actual: ${solicitud.nombre_estado}`);
    error.statusCode = 400;
    throw error;
  }

  const cancelada = await solicitudesRepo.cancelarLiberando(idSolicitud, {
    atendidopor: usuarioActual.id,
    observaciones: solicitud.id_usuario === usuarioActual.id ? 'Cancelada por el usuario.' : 'Cancelada por el personal de la biblioteca.',
  });

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: idSolicitud,
    accion: 'CANCELAR_SOLICITUD',
    tablaAfectada: 'Solicitudes',
    datosAnteriores: solicitud,
    datosNuevos: cancelada,
  });

  return cancelada;
};

export const responderSolicitud = async (idSolicitud, { accion, observaciones }, usuarioActual) => {
  const solicitud = await obtenerSolicitudPorId(idSolicitud);

  if (solicitud.codigo_estado !== 'PENDIENTE') {
    const error = new Error(`La solicitud ya fue procesada anteriormente (estado actual: ${solicitud.nombre_estado}).`);
    error.statusCode = 400;
    throw error;
  }

  const codigoDestino = accion.toUpperCase() === 'APROBAR' ? 'APROBADA' : 'RECHAZADA';

  // Al aprobar, el ejemplar queda RESERVADO en la misma transacción para que nadie más se lo lleve
  let respondida;
  if (codigoDestino === 'APROBADA') {
    respondida = await solicitudesRepo.aprobarReservando(idSolicitud, { atendidopor: usuarioActual.id, observaciones });
  } else {
    const estadoDestino = await estadosRepo.findByEntidadAndCodigo('solicitud', codigoDestino);
    respondida = await solicitudesRepo.responder(idSolicitud, {
      idEstado: estadoDestino.id_estado,
      atendidopor: usuarioActual.id,
      observaciones,
    });
  }

  // Generar notificación automática al usuario
  try {
    const estadoNotif = await estadosRepo.findByEntidadAndCodigo('notificacion', 'NO_LEIDA');
    await query(
      `INSERT INTO public.notificaciones (
        id_usuario, id_estado_notificacion, entidad_estado_notificacion, titulo_notificacion, mensaje_notificacion, tipo_notificacion
      ) VALUES ($1, $2, 'notificacion', $3, $4, 'SOLICITUD');`,
      [
        solicitud.id_usuario,
        estadoNotif.id_estado,
        `Solicitud de libro ${codigoDestino.toLowerCase()}`,
        `Tu solicitud para el libro "${solicitud.titulo_libro}" ha sido ${codigoDestino.toLowerCase()}.${observaciones ? ' Nota: ' + observaciones : ''}`,
      ]
    );
  } catch (notifErr) {
    // Si falla la notificación no bloquea la respuesta
  }

  await auditoriasService.registrarAuditoria({
    idUsuario: usuarioActual.id,
    idRegistro: idSolicitud,
    accion: `RESPONDER_SOLICITUD_${codigoDestino}`,
    tablaAfectada: 'Solicitudes',
    datosAnteriores: solicitud,
    datosNuevos: respondida,
  });

  return await obtenerSolicitudPorId(idSolicitud);
};
