import * as rolesService from '../services/roles.service.js';

export const getRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.obtenerRoles();
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const getRolById = async (req, res, next) => {
  try {
    const rol = await rolesService.obtenerRolPorId(req.params.id);
    res.json({ success: true, data: rol });
  } catch (error) {
    next(error);
  }
};
