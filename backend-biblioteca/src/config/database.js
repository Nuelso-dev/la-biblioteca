import pg from 'pg';
import env from './env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

const isLocal = !env.DATABASE_URL.includes('supabase.co');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});


// Evento que se dispara al conectar un cliente al pool
pool.on('connect', () => {
  logger.info('Conexión con la base de datos establecida correctamente.');
});

// Manejo de errores en clientes inactivos del pool
pool.on('error', (err) => {
  logger.error('Error en cliente inactivo del pool de la base de datos:', err.message || err);
});

/**
 * Función helper para ejecutar consultas SQL simplificando la obtención del cliente.
 * Evita tener que liberar el cliente manualmente en consultas simples.
 * 
 * @param {string} text - Consulta SQL (ej: 'SELECT * FROM libros WHERE id = $1')
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<import('pg').QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

export default pool;
