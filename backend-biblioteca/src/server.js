import app from './app.js';
import env from './config/env.js';
import pool from './config/database.js';
import logger from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`Servidor iniciado y escuchando en el puerto ${env.PORT}`);
  logger.info(`Endpoint de verificación de salud: http://localhost:${env.PORT}/api/health`);
});

// Manejo de señales para un apagado ordenado (graceful shutdown)
const gracefulShutdown = () => {
  logger.info('Apagando el servidor y cerrando el pool de conexiones a la base de datos...');
  server.close(async () => {
    logger.info('Servidor HTTP cerrado.');
    await pool.end().catch(() => {});
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

