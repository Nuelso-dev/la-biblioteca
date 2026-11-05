import crypto from 'crypto';
import * as ejemplaresRepo from '../repositories/ejemplares.repository.js';
import * as estadosRepo from '../repositories/estados.repository.js';
import * as auditoriasService from './auditorias.service.js';

const MAX_LOTE = 100;

export const obtenerEjemplares = async (filtros) => {
  return await ejemplaresRepo.findAll(filtros);
};

export const listarEjemplares = async (filtros) => {
  const [datos, total] = await Promise.all([ejemplaresRepo.findAll(filtros), ejemplaresRepo.count(filtros)]);
  return { datos, total };
};

export const obtenerEjemplarPorId = async (id) => {
  const ejemplar = await ejemplaresRepo.findById(id);
  if (!ejemplar) {
    const error = new Error('Ejemplar no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return ejemplar;
};

/** Prestado y Reservado los asignan los préstamos y las solicitudes; no pueden fijarse al registrar ni editar. */
const validarEstadoManual = async (idEstado, idEstadoActual) => {
  if (!idEstado || idEstado === idEstadoActual) return;
  for (const codigo of ['PRESTADO', 'RESERVADO']) {
    const gestionado = await estadosRepo.findByEntidadAndCodigo('ejemplar', codigo);
    if (gestionado && (idEstadoActual === gestionado.id_estado || idEstado === gestionado.id_estado)) {
      const error = new Error(
        codigo === 'PRESTADO'
          ? 'El estado Prestado se gestiona desde los préstamos: registra el préstamo o la devolución correspondiente.'
          : 'El estado Reservado se gestiona desde las solicitudes: aprueba o cancela la solicitud correspondiente.'
      );
      error.statusCode = 409;
      throw error;
    }
  }
};

const generarCodigo = (idLibro) => `EJ-${idLibro}-${Date.now().toString().slice(-4)}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Registra varios ejemplares idénticos (mismo libro, ubicación y estado) con códigos internos autogenerados.
 * Pensado para altas por lote: una compra de 20 copias se registra en un solo paso.
 */
export const crearEjemplaresLote = async ({ cantidad, ...datos }, usuarioActual) => {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_LOTE) {
    const error = new Error(`La cantidad debe ser un número entero entre 1 y ${MAX_LOTE}.`);
    error.statusCode = 400;
    throw error;
  }
  await validarEstadoManual(datos.idEstado, null);

  const creados = await ejemplaresRepo.createLote(
    Array.from({ length: cantidad }, () => ({ ...datos, codigoInterno: generarCodigo(datos.idLibro) }))
  );

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creados[0].id_ejemplar,
      accion: 'CREAR_EJEMPLARES_LOTE',
      tablaAfectada: 'Ejemplares',
      datosAnteriores: null,
      datosNuevos: { cantidad, idLibro: datos.idLibro, idUbicacion: datos.idUbicacion, ids: creados.map((c) => c.id_ejemplar) },
    });
  }

  return creados;
};

export const crearEjemplar = async (datos, usuarioActual) => {
  await validarEstadoManual(datos.idEstado, null);
  let codigo = datos.codigoInterno?.trim();
  if (codigo) {
    const existe = await ejemplaresRepo.findByCodigo(codigo);
    if (existe) {
      const error = new Error(`Ya existe un ejemplar registrado con el código interno '${codigo}'.`);
      error.statusCode = 409;
      throw error;
    }
  } else {
    // Autogenerar código único no colisionable
    codigo = generarCodigo(datos.idLibro);
  }

  const creado = await ejemplaresRepo.create({ ...datos, codigoInterno: codigo });

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: creado.id_ejemplar,
      accion: 'CREAR_EJEMPLAR',
      tablaAfectada: 'Ejemplares',
      datosAnteriores: null,
      datosNuevos: creado,
    });
  }

  return await obtenerEjemplarPorId(creado.id_ejemplar);
};

export const actualizarEjemplar = async (id, datos, usuarioActual) => {
  const anterior = await obtenerEjemplarPorId(id);

  if (datos.codigoInterno && datos.codigoInterno.trim().toLowerCase() !== anterior.codinterno_ejemplar.toLowerCase()) {
    const duplicado = await ejemplaresRepo.findByCodigo(datos.codigoInterno);
    if (duplicado && duplicado.id_ejemplar !== id) {
      const error = new Error(`El código interno '${datos.codigoInterno}' ya está asignado a otro ejemplar.`);
      error.statusCode = 409;
      throw error;
    }
  }

  await validarEstadoManual(datos.idEstado, anterior.id_estado_ejemplar);

  await ejemplaresRepo.update(id, datos);
  const actualizado = await obtenerEjemplarPorId(id);

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ACTUALIZAR_EJEMPLAR',
      tablaAfectada: 'Ejemplares',
      datosAnteriores: anterior,
      datosNuevos: actualizado,
    });
  }

  return actualizado;
};

export const eliminarEjemplar = async (id, usuarioActual) => {
  const anterior = await obtenerEjemplarPorId(id);
  let eliminado;
  let solicitudesEliminadas = 0;
  try {
    ({ ejemplar: eliminado, solicitudesEliminadas } = await ejemplaresRepo.removeConHistorialInactivo(id));
  } catch (err) {
    if (err.code === '23503') {
      const error = new Error('No se puede eliminar el ejemplar porque tiene solicitudes o préstamos asociados. Márcalo como Perdido o En mantenimiento.');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }

  if (usuarioActual) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: id,
      accion: 'ELIMINAR_EJEMPLAR',
      tablaAfectada: 'Ejemplares',
      datosAnteriores: { ...anterior, solicitudesEliminadas },
      datosNuevos: null,
    });
  }

  return eliminado;
};
