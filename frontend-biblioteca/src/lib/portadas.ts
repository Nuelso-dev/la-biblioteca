import { supabase } from "@/lib/supabase";

const BUCKET = "covers";
export const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

export const MAX_ARCHIVOS_POR_SUBIDA = 20;
const LADO_MAXIMO_PX = 6000;
const LARGO_MAXIMO_NOMBRE = 80;

type TipoImagen = { mime: string; extension: string };

/**
 * Detecta el tipo real de la imagen por su contenido (firma de los primeros bytes).
 * El tipo y la extensión que declara el navegador los controla quien sube el archivo, así que no bastan.
 */
async function detectarTipo(archivo: File): Promise<TipoImagen | null> {
  const b = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());
  const texto = (desde: number, hasta: number) => String.fromCharCode(...b.slice(desde, hasta));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", extension: "jpg" };
  if (b[0] === 0x89 && texto(1, 4) === "PNG" && b[4] === 0x0d && b[5] === 0x0a) return { mime: "image/png", extension: "png" };
  if (texto(0, 4) === "RIFF" && texto(8, 12) === "WEBP") return { mime: "image/webp", extension: "webp" };
  return null;
}

/** Comprueba que el navegador pueda decodificar la imagen y que sus dimensiones sean razonables. */
async function validarDimensiones(archivo: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const { width, height } = bitmap;
    bitmap.close();
    if (width < 1 || height < 1) return "La imagen está vacía.";
    if (width > LADO_MAXIMO_PX || height > LADO_MAXIMO_PX) return `La imagen es demasiado grande (máximo ${LADO_MAXIMO_PX}px por lado).`;
    return null;
  } catch {
    return "El archivo está dañado o no es una imagen válida.";
  }
}

/** Nombre de archivo seguro para el bucket: minúsculas, sin acentos ni espacios, con la extensión del tipo real. */
export function nombreArchivoSeguro(nombreOriginal: string, extension: string): string {
  const punto = nombreOriginal.lastIndexOf(".");
  const base = punto > 0 ? nombreOriginal.slice(0, punto) : nombreOriginal;
  const limpio = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LARGO_MAXIMO_NOMBRE)
    .replace(/-+$/g, "");
  return `${limpio || "portada"}.${extension}`;
}

/**
 * Valida el archivo antes de subirlo: tamaño, tipo real por contenido, que se pueda decodificar y sus dimensiones.
 * Devuelve el tipo detectado, o el mensaje de error.
 */
export async function validarImagen(archivo: File): Promise<{ tipo: TipoImagen } | { error: string }> {
  if (archivo.size === 0) return { error: "El archivo está vacío." };
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) return { error: "La imagen supera el límite de 5 MB." };
  const tipo = await detectarTipo(archivo);
  if (!tipo || !TIPOS_IMAGEN_PERMITIDOS.includes(tipo.mime)) return { error: "Solo se permiten imágenes JPG, PNG o WebP (el contenido del archivo no coincide)." };
  const error = await validarDimensiones(archivo);
  return error ? { error } : { tipo };
}

/**
 * Sube una imagen al bucket `covers` sin pisar archivos existentes (si el nombre ya existe
 * agrega un sufijo único). Devuelve el nombre con el que quedó guardada.
 */
export async function subirPortada(archivo: File): Promise<string> {
  const validacion = await validarImagen(archivo);
  if ("error" in validacion) throw new Error(validacion.error);
  const { tipo } = validacion;
  // El tipo que se declara al servidor es el detectado por contenido, no el que informó el navegador
  const opciones = { contentType: tipo.mime, upsert: false, cacheControl: "31536000" };

  let nombre = nombreArchivoSeguro(archivo.name, tipo.extension);
  let { error } = await supabase.storage.from(BUCKET).upload(nombre, archivo, opciones);

  if (error && /already exists|duplicate/i.test(error.message)) {
    const punto = nombre.lastIndexOf(".");
    nombre = `${nombre.slice(0, punto)}-${Date.now().toString(36)}${nombre.slice(punto)}`;
    ({ error } = await supabase.storage.from(BUCKET).upload(nombre, archivo, opciones));
  }

  if (error) {
    const sinPermiso = /row-level security|not authorized|unauthorized|403/i.test(error.message);
    throw new Error(
      sinPermiso
        ? "Tu cuenta no tiene permiso para subir imágenes (se requiere rol Administrador o Bibliotecario)."
        : error.message
    );
  }
  return nombre;
}

/**
 * Elimina una imagen del bucket. La base de datos solo lo permite si ningún libro la usa
 * y el usuario es personal; si no, Storage responde sin borrar nada y aquí se convierte en error.
 */
export async function eliminarPortada(nombre: string): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET).remove([nombre]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo eliminar: la imagen está en uso por un libro o no tienes permiso.");
  }
}
