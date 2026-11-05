/**
 * Utilidad de registro (logger) simple y profesional para la consola.
 * Proporciona un formato estructurado con timestamp y niveles de severidad.
 */

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

export const logger = {
  info: (message) => {
    console.log(formatMessage('INFO', message));
  },
  warn: (message) => {
    console.warn(formatMessage('WARN', message));
  },
  error: (message, error) => {
    console.error(formatMessage('ERROR', message));
    if (error) {
      console.error(error.stack || error);
    }
  },
  fatal: (message, error) => {
    console.error(formatMessage('FATAL', message));
    if (error) {
      console.error(error.stack || error);
    }
  }
};

export default logger;
