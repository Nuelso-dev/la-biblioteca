import {
  Book02Icon,
  Clock01Icon,
  Edit02Icon,
  Delete02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Icon } from "@/components/ui/hugeicon";
import { ImagenPortadaLibro } from "@/components/libros/imagen-portada-libro";
import { Button } from "@/components/ui/button";
import type { Libro } from "./tipos";

/** Primera, última y las vecinas de la actual; null representa unos puntos suspensivos. */
function paginasVisibles(actual: number, total: number): (number | null)[] {
  const paginas = new Set<number>([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const resultado: (number | null)[] = [];
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) resultado.push(null);
    resultado.push(p);
  });
  return resultado;
}

interface TablaLibrosProps {
  cargando: boolean;
  errorCarga: string;
  /** Libros de la página actual */
  libros: Libro[];
  /** Total de libros que cumplen la búsqueda (todas las páginas) */
  total: number;
  hayBusqueda: boolean;
  paginaActual: number;
  setPaginaActual: (updater: (p: number) => number) => void;
  totalPaginas: number;
  elementosPorPagina: number;
  eliminandoId: number | string | null;
  onReintentar: () => void;
  onNuevo: () => void;
  onEditar: (libro: Libro) => void;
  onEliminar: (libro: Libro) => void;
}

// Las mismas columnas en cabecera y filas para que queden alineadas
const COLUMNAS_LIBROS = "@3xl:grid-cols-[2.2fr_1.3fr_1fr_1fr_90px_110px]";

export function TablaLibros({
  cargando,
  errorCarga,
  libros,
  total,
  hayBusqueda,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  elementosPorPagina,
  eliminandoId,
  onReintentar,
  onNuevo,
  onEditar,
  onEliminar,
}: TablaLibrosProps) {
  return (
    <>
      <div className="border border-border bg-card">
        <div className="p-4 @3xl:p-5">
          <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Títulos</div>
          <div className="mt-1.5 font-serif text-2xl @3xl:text-3xl leading-none text-foreground">
            {cargando ? "..." : total.toLocaleString("es-CO")}
          </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className={`hidden @3xl:grid ${COLUMNAS_LIBROS} border-b border-border bg-muted text-[11px] font-semibold tracking-wider text-muted-foreground uppercase`}>
          <div className="p-3.5 pl-4">Título</div>
          <div className="p-3.5">Autor</div>
          <div className="p-3.5">Categoría</div>
          <div className="p-3.5">Editorial</div>
          <div className="p-3.5">Ejemplares</div>
          <div className="p-3.5 pr-4 text-right">Acción</div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-muted-foreground font-medium">
            <Icon icon={Clock01Icon} className="size-5 animate-spin text-primary" /> Cargando registros del inventario...
          </div>
        ) : errorCarga ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p role="alert" className="text-xs text-destructive font-medium">{errorCarga}</p>
            <Button variant="outline" size="sm" onClick={onReintentar} className="rounded-none font-semibold">
              Reintentar
            </Button>
          </div>
        ) : total === 0 && !hayBusqueda ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Icon icon={Book02Icon} className="size-8" />
            <p className="text-xs font-medium">Aún no hay libros en el catálogo.</p>
            <Button size="sm" onClick={onNuevo} className="rounded-none font-semibold">
              Registrar primer libro
            </Button>
          </div>
        ) : libros.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No se encontraron libros que coincidan con el filtro seleccionado.
          </div>
        ) : (
          libros.map((libro, idx) => {
            const id = libro.id_libro;
            const estaEliminando = eliminandoId === id;
            const bgStrip = idx % 2 === 1 ? "bg-muted/30" : "bg-card";

            return (
              <div
                key={id ?? idx}
                className={`flex flex-col @3xl:grid ${COLUMNAS_LIBROS} @3xl:items-center border-b border-border/80 last:border-b-0 p-3 @3xl:p-0 ${bgStrip} hover:bg-accent/40 transition-colors`}
              >
                <div className="flex items-center gap-3 @3xl:p-3.5 @3xl:pl-4">
                  <div className="relative h-[42px] w-[30px] shrink-0 border border-foreground bg-muted overflow-hidden">
                    {libro.portada_libro || libro.portada_libro ? (
                      <ImagenPortadaLibro
                        libro={libro}
                        alt={libro.titulo_libro ?? "Portada del libro"}
                        fill
                        sizes="30px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full bg-primary/20" />
                    )}
                  </div>
                  <span className="font-semibold text-sm text-foreground line-clamp-1">
                    {libro.titulo_libro}
                    {libro.estado && libro.estado !== "Disponible" && (
                      <span className="ml-2 border border-border px-1.5 py-0.5 text-[10px] font-normal uppercase text-muted-foreground">{libro.estado}</span>
                    )}
                  </span>
                </div>

                <div className="text-xs @3xl:text-sm text-foreground/80 @3xl:p-3.5 mt-1 @3xl:mt-0">
                  <span className="inline @3xl:hidden text-xs text-muted-foreground">Autor: </span>
                  {libro.autor || "—"}
                </div>

                <div className="text-xs @3xl:text-sm text-foreground/80 @3xl:p-3.5 mt-1 @3xl:mt-0">
                  <span className="inline @3xl:hidden text-xs text-muted-foreground">Categoría: </span>
                  {libro.categoria || "—"}
                </div>

                <div className="text-xs @3xl:text-sm text-foreground/80 @3xl:p-3.5 mt-1 @3xl:mt-0">
                  <span className="inline @3xl:hidden text-xs text-muted-foreground">Editorial: </span>
                  {libro.editorial || "—"}
                  {libro.isbn_libro && (
                    <span className="block font-mono text-[10px] text-muted-foreground">ISBN {libro.isbn_libro}</span>
                  )}
                </div>

                <div className="text-xs @3xl:p-3.5 mt-1 @3xl:mt-0">
                  <span className="inline @3xl:hidden text-xs text-muted-foreground">Ejemplares: </span>
                  <Link
                    href={`/administracion/ejemplares?libro=${id}`}
                    className="font-mono font-semibold text-foreground underline-offset-2 hover:text-primary hover:underline"
                    title="Administrar ejemplares de este libro"
                  >
                    {libro.ejemplares_disponibles ?? 0}/{libro.total_ejemplares ?? 0}
                  </Link>
                  <span className="ml-1 text-[10px] text-muted-foreground">disp.</span>
                </div>

                <div className="flex items-center justify-between @3xl:justify-end gap-2 @3xl:p-3.5 @3xl:pr-4 pt-3 @3xl:pt-0 mt-2 @3xl:mt-0 border-t @3xl:border-t-0 border-border/60">
                  <span className="@3xl:hidden text-[10px] uppercase font-mono text-muted-foreground">Acciones</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditar(libro)}
                      title="Editar libro"
                      aria-label={`Editar ${libro.titulo_libro}`}
                      className="rounded-none h-8 @3xl:h-7 px-2.5 @3xl:px-2 text-xs font-semibold gap-1 border-border"
                    >
                      <Icon icon={Edit02Icon} className="size-3.5" />
                      <span className="@3xl:hidden">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEliminar(libro)}
                      disabled={estaEliminando}
                      title="Eliminar libro"
                      aria-label={`Eliminar ${libro.titulo_libro}`}
                      className="rounded-none h-8 @3xl:h-7 px-2.5 @3xl:px-2 text-xs font-semibold gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <Icon icon={Delete02Icon} className="size-3.5" />
                      <span className="@3xl:hidden">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col @3xl:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>
          Mostrando {total > 0 ? (paginaActual - 1) * elementosPorPagina + 1 : 0}–
          {Math.min(paginaActual * elementosPorPagina, total)} de{" "}
          {total} registros
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={paginaActual <= 1}
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            className="inline-flex size-8 items-center justify-center border border-border bg-background hover:bg-accent disabled:opacity-40 transition-colors"
          >
            <Icon icon={ArrowLeft01Icon} className="size-3.5" />
          </button>

          {paginasVisibles(paginaActual, totalPaginas).map((numeroPagina, index) => {
            if (numeroPagina === null) {
              return (
                <span key={`puntos-${index}`} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              );
            }
            const esActiva = paginaActual === numeroPagina;
            return (
              <button
                key={numeroPagina}
                type="button"
                onClick={() => setPaginaActual(() => numeroPagina)}
                className={`inline-flex size-8 items-center justify-center border text-xs transition-colors ${
                  esActiva
                    ? "border-foreground bg-foreground font-semibold text-background"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {numeroPagina}
              </button>
            );
          })}

          <button
            type="button"
            disabled={paginaActual >= totalPaginas}
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            className="inline-flex size-8 items-center justify-center border border-border bg-background hover:bg-accent disabled:opacity-40 transition-colors"
          >
            <Icon icon={ArrowRight01Icon} className="size-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
