/**
 * Configuración tipada y centralizada de variables de entorno del Frontend.
 * Puertos nativos: Frontend en 3000, Backend en 3001
 */

export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

export default ENV;
