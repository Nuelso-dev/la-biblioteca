import * as estadosRepo from '../repositories/estados.repository.js';

export const obtenerEstados = async (filtros) => {
  return await estadosRepo.findAll(filtros);
};

export const obtenerEstadoPorId = async (id) => {
  const estado = await estadosRepo.findById(id);
  if (!estado) {
    const error = new Error('Estado no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return estado;
};

// Entidades que tienen columna de estado en la BD (ver chk_estados_entidad_valida)
const ENTIDADES_CON_ESTADO = [
  'biblioteca', 'categoria_libro', 'editorial', 'ejemplar', 'libro', 'multa',
  'notificacion', 'prestamo', 'solicitud', 'ubicacion', 'usuario',
];

export const crearEstado = async (datos) => {
  if (!ENTIDADES_CON_ESTADO.includes(datos.entidad)) {
    const error = new Error(`La entidad '${datos.entidad}' no es válida. Opciones: ${ENTIDADES_CON_ESTADO.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }
  const existe = await estadosRepo.findByEntidadAndCodigo(datos.entidad, datos.codigo);
  if (existe) {
    const error = new Error(`Ya existe un estado con código '${datos.codigo}' para la entidad '${datos.entidad}'.`);
    error.statusCode = 409;
    throw error;
  }
  return await estadosRepo.create(datos);
};

export const actualizarEstado = async (id, datos) => {
  await obtenerEstadoPorId(id);
  return await estadosRepo.update(id, datos);
};
