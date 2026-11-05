import type { Libro as LibroServicio } from "@/services/libros.service";

export type Libro = LibroServicio;

/** Estado del formulario de libros; cada campo corresponde a una columna de public.libros. */
export type FormularioLibro = {
  /** libros.titulo_libro — obligatorio */
  titulo: string;
  /** libros.id_categoria — obligatorio */
  idCategoria: number | null;
  /** libros.id_editorial — obligatorio (existente o nueva) */
  idEditorial: number | null;
  /** Nombre de una editorial nueva (se crea al guardar) */
  editorialNueva: string;
  /** libros.id_estado_libro */
  idEstado: number | null;
  /** libros.isbn_libro — único, opcional */
  isbn: string;
  /** libros.descripcion_libro */
  descripcion: string;
  /** libros.portada_libro — nombre del archivo en el bucket `covers` */
  portada: string;
  /** libros.numpaginas_libro — entero > 0 */
  numPaginas: string;
  /** libros.idioma_libro */
  idioma: string;
  /** libros.fechapublicacion_libro (YYYY-MM-DD) */
  fechaPublicacion: string;
  /** libros_autores */
  autoresIds: number[];
};

export type ErroresFormularioLibro = Partial<Record<keyof FormularioLibro, string>>;

export const formularioInicial: FormularioLibro = {
  titulo: "",
  idCategoria: null,
  idEditorial: null,
  editorialNueva: "",
  idEstado: null,
  isbn: "",
  descripcion: "",
  portada: "",
  numPaginas: "",
  idioma: "Español",
  fechaPublicacion: "",
  autoresIds: [],
};

export const IDIOMAS_SUGERIDOS = ["Español", "Inglés", "Francés", "Portugués", "Italiano", "Alemán", "Latín"];

/** Reglas de validación del formulario (espejo de las restricciones de la tabla y del backend). */
export function validarFormularioLibro(f: FormularioLibro): ErroresFormularioLibro {
  const errores: ErroresFormularioLibro = {};

  if (!f.titulo.trim()) errores.titulo = "El título es obligatorio.";
  if (!f.idCategoria) errores.idCategoria = "Selecciona una categoría.";
  if (!f.idEditorial && !f.editorialNueva.trim()) {
    errores.idEditorial = "Selecciona una editorial existente o escribe el nombre de una nueva.";
  }

  const isbnLimpio = f.isbn.replace(/[\s-]/g, "");
  if (isbnLimpio && !/^(\d{9}[\dXx]|\d{13})$/.test(isbnLimpio)) {
    errores.isbn = "El ISBN debe tener 10 o 13 dígitos (se permiten guiones).";
  }

  if (f.numPaginas.trim()) {
    const paginas = Number(f.numPaginas);
    if (!Number.isInteger(paginas) || paginas <= 0) {
      errores.numPaginas = "El número de páginas debe ser un entero mayor que cero.";
    }
  }

  if (f.fechaPublicacion && Number.isNaN(new Date(f.fechaPublicacion).getTime())) {
    errores.fechaPublicacion = "La fecha de publicación no es válida.";
  }

  return errores;
}
