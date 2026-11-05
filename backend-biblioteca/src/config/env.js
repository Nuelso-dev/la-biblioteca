import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración y validación centralizada de variables de entorno del Backend.
 * Puerto estándar: 3001
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL?.trim() || '',
  SUPABASE_URL: process.env.SUPABASE_URL?.trim() || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.trim() || '',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

/**
 * Variables requeridas para operar: sin ellas el servidor arrancaría
 * "funcionando" pero con la base de datos o la autenticación rotas en
 * silencio, fallando recién en el primer request real. Se falla rápido
 * en el arranque en vez de dejar que cada request descubra el problema.
 */
const REQUERIDAS = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const faltantes = REQUERIDAS.filter((clave) => !env[clave]);

if (faltantes.length > 0) {
  throw new Error(
    `Variables de entorno requeridas ausentes: ${faltantes.join(', ')}. Revisa el archivo .env.`
  );
}

export default env;
