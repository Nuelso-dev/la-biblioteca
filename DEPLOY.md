# Despliegue

## Backend en Railway
1. New Project > Deploy from GitHub repo. En Settings > Source, **Root Directory** = `backend-biblioteca` (usa `railway.json`).
2. Variables:
   - `DATABASE_URL` (pooler de Supabase, puerto 6543)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGIN` = URL de Vercel (ej. `https://la-biblioteca.vercel.app`; varias separadas por coma, sin `/` final)
   - `NODE_ENV=production`
   - No definir `PORT`: Railway lo inyecta.
3. Settings > Networking > Generate Domain. Verificar `https://<dominio>/api/health`.

## Frontend en Vercel
1. Import Project desde GitHub. **Root Directory** = `frontend-biblioteca`. Framework: Next.js (autodetectado).
2. Variables (Production y Preview):
   - `NEXT_PUBLIC_API_URL` = `https://<dominio-railway>/api`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. Luego actualizar `CORS_ORIGIN` en Railway con la URL final de Vercel y redeploy.

## Supabase
Auth > URL Configuration: agregar la URL de Vercel a Site URL y Redirect URLs (recuperación de contraseña).
