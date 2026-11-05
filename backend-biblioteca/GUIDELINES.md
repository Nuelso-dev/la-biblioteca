# Guía de Desarrollo y Arquitectura - Backend Biblioteca

Este documento contiene las reglas de diseño, estándares de código y la arquitectura del proyecto. Debe ser utilizado como referencia (contexto) para cualquier desarrollo futuro en este repositorio.

## 1. Stack Tecnológico Principal

- **Lenguaje:** JavaScript moderno (Node.js con ES Modules, `"type": "module"` en `package.json`).
- **Framework Web:** Express.js tradicional.
- **Base de Datos:** PostgreSQL.
- **Acceso a Datos:** Controlador nativo `pg` (node-postgres) utilizando conexión por `Pool` para consultas SQL puras (sin ORM).

---

## 2. Arquitectura en Capas

Se sigue una arquitectura limpia en capas tradicionales, donde cada directorio tiene una única responsabilidad:

```
src/
├── config/         # Configuración del entorno y conexiones (ej. database.js)
├── controllers/    # Controladores HTTP (manejan req, res, llaman a servicios)
├── middlewares/    # Middlewares globales (manejo de errores, seguridad, cors)
├── routes/         # Enrutamiento de endpoints HTTP mapeados a controladores
├── services/       # Lógica de negocio (reglas, validaciones complejas)
├── repositories/   # Acceso directo a base de datos (consultas SQL a pg)
└── utils/          # Helpers y utilidades comunes (ej. logger.js)
```

---

## 3. Estándar de Comentarios

Se definen dos formatos de comentarios obligatorios en el código, siempre redactados en español.

### A. Comentarios de Bloque (JSDoc `/** */`)
Es **obligatorio** documentar todas las funciones, clases, métodos, middlewares y rutas utilizando el formato **JSDoc**. Esto permite contar con autocompletado inteligente y tipado dinámico en los editores de código.

#### Ejemplo de Función:
```javascript
/**
 * Ejecuta una consulta SQL segura parametrizada contra el pool de la base de datos.
 * 
 * @param {string} text - La consulta SQL con placeholders (ej: $1, $2)
 * @param {Array} [params] - Valores reales para reemplazar en los placeholders
 * @returns {Promise<import('pg').QueryResult>} El resultado de la consulta
 */
export const query = (text, params) => pool.query(text, params);
```

#### Ejemplo de Middleware:
```javascript
/**
 * Middleware para capturar excepciones no controladas.
 * 
 * @param {Error} err - Objeto de error
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 * @param {import('express').NextFunction} next - Siguiente middleware
 */
export const errorHandler = (err, req, res, next) => { ... };
```

### B. Comentarios de una Sola Línea (`//`)
Se utilizan para explicar **por qué** se realiza una acción o lógica compleja de código, en lugar de describir el **qué** hace la línea (el código por sí mismo debe ser autoexplicativo).

#### Reglas de Formato:
1. **Espacio inicial**: Siempre colocar un espacio después de los caracteres `//` (ej: `// Comentario`, no `//Comentario`).
2. **Ubicación**: Deben ir colocados en la línea inmediatamente superior al bloque de código que describen, evitando comentarios inline al final de una línea.
3. **Redacción**: Iniciar con mayúscula y mantener una redacción técnica y clara en español.

#### Ejemplos Correctos:
```javascript
// Verificar si el usuario tiene préstamos pendientes antes de permitir la desactivación
const pendingLoans = await checkPendingLoans(userId);

// Configurar certificados SSL únicamente cuando se ejecuta en producción
ssl: isProduction ? { rejectUnauthorized: false } : false
```

#### Ejemplos Incorrectos:
```javascript
let count = 0; //inicializar contador (Incorrecto: inline, sin espacio, sin mayúscula y explica lo obvio)

//obtener todos los libros (Incorrecto: sin espacio inicial, sin mayúscula y es código autoexplicativo)
const books = await getAllBooks();
```

---

## 4. Estándar de Logging (Registros)

Queda prohibido el uso de `console.log` o `console.error` directamente para depuración o logs del servidor. Se debe importar y utilizar el logger unificado de:
[logger.js](file:///c:/Development/proyectos-inem/proyecto-grado-biblioteca/src/utils/logger.js)

### Métodos Disponibles:
- `logger.info(mensaje)`: Para avisos normales de inicio, apagado o eventos del flujo.
- `logger.warn(mensaje)`: Para advertencias de comportamiento no óptimo.
- `logger.error(mensaje, error)`: Para errores no fatales en peticiones (rutas, base de datos).
- `logger.fatal(mensaje, error)`: Para errores que detienen la ejecución de la app (ej: error en pool).

### Formato Resultante en Consola:
`[ISO_TIMESTAMP] [NIVEL] Mensaje en español`

---

## 5. Respuestas de API y Manejo de Errores

### Respuestas Exitosas (Envelope Pattern):
```json
{
  "success": true,
  "data": { ... }
}
```

### Respuestas con Error:
```json
{
  "success": false,
  "error": {
    "message": "Mensaje en español comprensible para el usuario",
    "stack": "Stack trace (únicamente disponible en entorno de desarrollo)"
  }
}
```
