import { query } from '../config/database.js';

export const findAll = async () => {
  const text = 'SELECT * FROM public.configuraciones ORDER BY clave_configuracion ASC;';
  const res = await query(text);
  return res.rows;
};

export const findByClave = async (clave) => {
  const text = 'SELECT * FROM public.configuraciones WHERE clave_configuracion = $1;';
  const res = await query(text, [clave]);
  return res.rows[0] || null;
};

export const createOrUpdate = async (clave, valor, descripcion) => {
  const text = `
    INSERT INTO public.configuraciones (clave_configuracion, valor_configuracion, descripcion_configuracion)
    VALUES ($1, $2, $3)
    ON CONFLICT (clave_configuracion) 
    DO UPDATE SET 
      valor_configuracion = EXCLUDED.valor_configuracion,
      descripcion_configuracion = COALESCE(EXCLUDED.descripcion_configuracion, configuraciones.descripcion_configuracion)
    RETURNING *;
  `;
  const res = await query(text, [clave, valor, descripcion || null]);
  return res.rows[0];
};

export const remove = async (clave) => {
  const text = 'DELETE FROM public.configuraciones WHERE clave_configuracion = $1 RETURNING *;';
  const res = await query(text, [clave]);
  return res.rows[0] || null;
};
