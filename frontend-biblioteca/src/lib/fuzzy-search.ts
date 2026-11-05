export function coincideFuzzy(busqueda?: string | null, texto?: string | null): boolean {
  if (!busqueda || !busqueda.trim()) return true;
  if (!texto) return false;

  const t = texto.toLowerCase();
  const b = busqueda.toLowerCase().trim();

  if (t.includes(b)) return true;

  const palabras = b.split(/\s+/).filter(Boolean);
  return palabras.every((p) => t.includes(p));
}

