import * as rolesRepo from '../repositories/roles.repository.js';

export const obtenerRoles = async () => {
  return await rolesRepo.findAll();
};

export const obtenerRolPorId = async (id) => {
  const rol = await rolesRepo.findById(id);
  if (!rol) {
    const error = new Error('Rol no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return rol;
};
