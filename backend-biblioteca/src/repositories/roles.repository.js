import { query } from '../config/database.js';

export const findAll = async () => {
  const text = 'SELECT * FROM public.roles ORDER BY id_rol ASC;';
  const res = await query(text);
  return res.rows;
};

export const findById = async (id) => {
  const text = 'SELECT * FROM public.roles WHERE id_rol = $1;';
  const res = await query(text, [id]);
  return res.rows[0] || null;
};
