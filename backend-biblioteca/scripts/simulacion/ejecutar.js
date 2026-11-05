// Ejecuta un archivo .sql contra la base definida en DATABASE_URL (backend-biblioteca/.env).
// Uso: node scripts/simulacion/ejecutar.js scripts/simulacion/02_catalogo.sql
//
// El marcador /*@libros*/ del SQL se reemplaza por el contenido expandido de datos/libros*.txt:
//   Autor|CÓDIGO|año0-año1|Editorial (opcional)|título;título~CÓDIGO;serie, vol. {1..10}
// y cada título se convierte en una línea "título|autor|categoría|año0|año1|editorial".
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const AQUI = dirname(fileURLToPath(import.meta.url));

const CATEGORIAS = {
  N: 'Novela', CU: 'Cuento', PO: 'Poesía', TE: 'Teatro', EN: 'Ensayo y crónica', BI: 'Biografías y memorias',
  HI: 'Historia', CS: 'Ciencias sociales', FP: 'Filosofía y psicología', CN: 'Ciencias naturales',
  TC: 'Tecnología y computación', SB: 'Salud y bienestar', AA: 'Arte y arquitectura', MC: 'Música y cine',
  ED: 'Educación y pedagogía', IL: 'Idiomas y lingüística', EE: 'Economía y emprendimiento',
  RC: 'Referencia y consulta', IN: 'Infantil', JU: 'Juvenil', CG: 'Cómic y novela gráfica',
  CF: 'Ciencia ficción y fantasía', MS: 'Misterio y suspenso', RO: 'Romance', TR: 'Terror',
  RE: 'Religión y espiritualidad', DE: 'Derecho', GH: 'Gastronomía y hogar', VG: 'Viajes y geografía',
  DR: 'Deportes y recreación',
};

const expandirSeries = (titulo) => {
  const m = titulo.match(/\{(\d+)\.\.(\d+)\}/);
  if (!m) return [titulo];
  const salida = [];
  for (let n = Number(m[1]); n <= Number(m[2]); n++) salida.push(titulo.replace(m[0], String(n)));
  return salida;
};

const expandirLibros = () => {
  const filas = [];
  const archivos = readdirSync(join(AQUI, 'datos')).filter((f) => /^libros.*\.txt$/.test(f)).sort();
  const lineas = archivos.flatMap((f) => readFileSync(join(AQUI, 'datos', f), 'utf8').split(/\r?\n/));
  for (const linea of lineas) {
    if (!linea.trim() || linea.startsWith('#')) continue;
    const [autor, codigo, rango, editorial = '', titulos] = linea.split('|');
    const [a0, a1 = a0] = rango.split('-').map(Number);
    if (!CATEGORIAS[codigo] || !titulos) throw new Error(`Línea inválida en datos/libros*.txt: ${linea.slice(0, 80)}`);
    for (const bruto of titulos.split(';')) {
      for (const expandido of expandirSeries(bruto.trim())) {
        const [titulo, cod] = expandido.split('~');
        const categoria = CATEGORIAS[cod ?? codigo];
        if (!categoria) throw new Error(`Código de categoría desconocido "${cod}" en ${autor}`);
        filas.push([titulo.trim(), autor, categoria, a0, a1, editorial].join('|'));
      }
    }
  }
  return filas.join('\n');
};

const archivo = process.argv[2];
if (!archivo) throw new Error('Indica el archivo .sql a ejecutar.');

// Las cargas grandes superan el tiempo máximo por sentencia del servidor: se desactiva para esta sesión
let sql = 'SET statement_timeout = 0;\n' + readFileSync(archivo, 'utf8');
if (sql.includes('/*@libros*/')) sql = sql.replace('/*@libros*/', expandirLibros());

// Modo sesión del pooler (5432): las cargas largas se cortan en el modo transacción (6543)
const urlSesion = process.env.DATABASE_URL.replace(':6543/', ':5432/');
const client = new pg.Client({ connectionString: urlSesion, ssl: { rejectUnauthorized: false }, keepAlive: true, keepAliveInitialDelayMillis: 10000 });
client.on('error', (e) => console.error('Conexión interrumpida:', e.code || e.message));
await client.connect();
try {
  const inicio = Date.now();
  const res = await client.query(sql);
  const ultimo = Array.isArray(res) ? res[res.length - 1] : res;
  if (ultimo.rows?.length) console.table(ultimo.rows);
  console.log(`OK ${archivo} (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
} finally {
  await client.end();
}
