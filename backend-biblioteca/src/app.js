import express from 'express';
import cors from 'cors';
import compression from 'compression';
import healthRoutes from './routes/health.routes.js';
import estadosRoutes from './routes/estados.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import configRoutes from './routes/config.routes.js';
import bibliotecasRoutes from './routes/bibliotecas.routes.js';
import ubicacionesRoutes from './routes/ubicaciones.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import editorialesRoutes from './routes/editoriales.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import autoresRoutes from './routes/autores.routes.js';
import librosRoutes from './routes/libros.routes.js';
import librosAutoresRoutes from './routes/librosAutores.routes.js';
import ejemplaresRoutes from './routes/ejemplares.routes.js';
import solicitudesRoutes from './routes/solicitudes.routes.js';
import prestamosRoutes from './routes/prestamos.routes.js';
import multasRoutes from './routes/multas.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import auditoriasRoutes from './routes/auditorias.routes.js';
import storageRoutes from './routes/storage.routes.js';
import favoritosRoutes from './routes/favoritos.routes.js';
import authRoutes from './routes/auth.routes.js';

import errorHandler from './middlewares/errorHandler.js';
import { limitarSolicitudes } from './middlewares/rate-limit.js';
import env from './config/env.js';

const app = express();

// Detrás del proxy de Railway la IP real llega en X-Forwarded-For; sin esto todos compartirían límite
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Las respuestas JSON (listados, catálogo) se comprimen con gzip/brotli
app.use(compression());

// Configuración de CORS segura
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.CORS_ORIGIN.includes(origin) || env.CORS_ORIGIN.includes('*')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));

// Cabeceras de seguridad HTTP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', limitarSolicitudes);

// Ruta de estado general y catálogo de la API
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    success: true,
    name: 'La Biblioteca API - PostgreSQL / Supabase',
    version: '2.0.0',
    environment: env.NODE_ENV,
    status: 'ONLINE',
    endpoints: {
      health: '/api/health',
      estados: '/api/estados',
      roles: '/api/roles',
      config: '/api/config',
      bibliotecas: '/api/bibliotecas',
      ubicaciones: '/api/ubicaciones',
      usuarios: '/api/usuarios',
      editoriales: '/api/editoriales',
      categorias: '/api/categorias',
      autores: '/api/autores',
      libros: '/api/libros',
      ejemplares: '/api/ejemplares',
      solicitudes: '/api/solicitudes',
      prestamos: '/api/prestamos',
      multas: '/api/multas',
      notificaciones: '/api/notificaciones',
      auditorias: '/api/auditorias',
    },
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/api/ping', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// Registro modular de rutas
app.use('/api', healthRoutes);
app.use('/api', estadosRoutes);
app.use('/api', rolesRoutes);
app.use('/api', configRoutes);
app.use('/api', bibliotecasRoutes);
app.use('/api', ubicacionesRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', editorialesRoutes);
app.use('/api', categoriasRoutes);
app.use('/api', autoresRoutes);
app.use('/api', librosRoutes);
app.use('/api', librosAutoresRoutes);
app.use('/api', ejemplaresRoutes);
app.use('/api', solicitudesRoutes);
app.use('/api', prestamosRoutes);
app.use('/api', multasRoutes);
app.use('/api', notificacionesRoutes);
app.use('/api', auditoriasRoutes);
app.use('/api', storageRoutes);
app.use('/api', favoritosRoutes);
app.use('/api', authRoutes);

// Manejo de rutas inexistentes (404)
app.use((req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Middleware global de manejo de errores
app.use(errorHandler);

export default app;
