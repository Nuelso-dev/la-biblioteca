import * as librosAutoresRepo from '../repositories/librosAutores.repository.js';
import * as auditoriasService from './auditorias.service.js';

export const asociarAutor = async (idLibro, idAutor, usuarioActual) => {
  const asociacion = await librosAutoresRepo.associate(idLibro, idAutor);
  if (usuarioActual && asociacion) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: idLibro,
      accion: 'ASOCIAR_AUTOR_LIBRO',
      tablaAfectada: 'Libros_Autores',
      datosAnteriores: null,
      datosNuevos: { idLibro, idAutor },
    });
  }
  return asociacion;
};

export const desasociarAutor = async (idLibro, idAutor, usuarioActual) => {
  const eliminada = await librosAutoresRepo.disassociate(idLibro, idAutor);
  if (usuarioActual && eliminada) {
    await auditoriasService.registrarAuditoria({
      idUsuario: usuarioActual.id,
      idRegistro: idLibro,
      accion: 'DESASOCIAR_AUTOR_LIBRO',
      tablaAfectada: 'Libros_Autores',
      datosAnteriores: { idLibro, idAutor },
      datosNuevos: null,
    });
  }
  return eliminada;
};

export const obtenerAutoresDeLibro = async (idLibro) => {
  return await librosAutoresRepo.findByLibro(idLibro);
};
