# Despliegue

Orden recomendado: **1. Supabase** (base de datos) → **2. Backend en Railway** → **3. Frontend en Vercel** → **4. Ajustes finales**.

## 1. Supabase

### Crear la base de datos
1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta el contenido de `migration_supabase.sql`. Crea las 18 tablas (incluida `favoritos`), triggers, roles, estados y políticas RLS.
   - ⚠️ El script empieza borrando tablas (`DROP TABLE ... CASCADE`). Úsalo solo en un proyecto nuevo o cuando quieras reiniciar la base de datos: **borra todos los datos existentes**.
3. Ejecuta `backend-biblioteca/scripts/optimizacion_indices.sql` para crear los índices de los listados y filtros. Se puede ejecutar varias veces sin efectos secundarios.

### Storage (portadas de los libros)
En **Storage**, crea un bucket **público** llamado `covers`. Ahí se guardan las portadas y la plataforma busca los archivos por ese nombre.

### Primer administrador
Cada usuario que se registra queda con el rol **Lector**. Para tener un administrador:
- Crea en **Authentication** un usuario cuyo correo empiece por `admin` **antes** de ejecutar la migración (el script lo convierte en Administrador), o
- Después de registrarlo, cambia su `id_rol` a `1` (Administrador) en la tabla `usuarios`.

### Datos que necesitarás
- `DATABASE_URL`: botón **Connect** del proyecto → cadena del *Connection pooler* en modo **Transaction** (puerto **6543**).
- `SUPABASE_URL` y `SUPABASE_ANON_KEY`: **Project Settings → API**.

### Datos de prueba (opcional)
`backend-biblioteca/scripts/simulacion` tiene scripts para cargar actividad simulada. Se ejecutan desde `backend-biblioteca` con `node scripts/simulacion/ejecutar.js scripts/simulacion/<archivo>.sql`, en orden. Los archivos `00_limpiar.sql` y `00b_limpiar_actividad.sql` **borran** la simulación: no los ejecutes si no quieres eliminar esos datos.

## 2. Backend en Railway
1. New Project > Deploy from GitHub repo. En Settings > Source, **Root Directory** = `backend-biblioteca` (usa `railway.json`; requiere Node.js 20 o superior).
2. Variables:
   - `DATABASE_URL` (pooler de Supabase, puerto 6543)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGIN` = URL de Vercel (ej. `https://la-biblioteca.vercel.app`; varias separadas por coma, sin `/` final)
   - `NODE_ENV=production`
   - No definir `PORT`: Railway lo inyecta.
3. Settings > Networking > Generate Domain. Verificar `https://<dominio>/api/health`.

## 3. Frontend en Vercel
1. Import Project desde GitHub. **Root Directory** = `frontend-biblioteca`. Framework: Next.js (autodetectado).
2. Variables (Production y Preview):
   - `NEXT_PUBLIC_API_URL` = `https://<dominio-railway>/api`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. Las variables `NEXT_PUBLIC_*` se incrustan al compilar: si cambias alguna, vuelve a desplegar.

## 4. Ajustes finales
- **Railway:** actualiza `CORS_ORIGIN` con la URL final de Vercel y redeploy.
- **Supabase → Auth → URL Configuration:** agrega la URL de Vercel a **Site URL** y a **Redirect URLs**. La recuperación de contraseña redirige a `/nueva-contrasena`, así que agrega `https://<tu-dominio-vercel>/nueva-contrasena` (y `http://localhost:3000/nueva-contrasena` si pruebas en local).
