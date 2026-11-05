// Compacta tablas (VACUUM FULL) para devolver al sistema el espacio muerto que dejan las cargas y limpiezas grandes.
// Uso: node scripts/simulacion/compactar.js public.auditorias public.notificaciones
import 'dotenv/config';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL.replace(':6543/', ':5432/'), ssl: { rejectUnauthorized: false }, keepAlive: true });
c.on('error', (e) => console.error('error conexión', e.code));
await c.connect();
await c.query('SET statement_timeout = 0');
const tam = async () => (await c.query("select pg_database_size(current_database())/1048576 as mb")).rows[0].mb;
console.log('antes MB:', await tam());
for (const t of process.argv.slice(2)) {
  const i = Date.now();
  await c.query(`VACUUM (FULL, ANALYZE) ${t}`);
  console.log(t, 'compactada en', ((Date.now() - i) / 1000).toFixed(0), 's; MB total ahora:', await tam());
}
await c.end();
