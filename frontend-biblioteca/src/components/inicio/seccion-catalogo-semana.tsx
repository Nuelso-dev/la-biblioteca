import Link from "next/link";
import { ImagenPortadaLibro } from "@/components/libros/imagen-portada-libro";
import { Skeleton } from "@/components/ui/skeleton";
import type { Libro } from "@/services/libros.service";
import { estadoDisponibilidad, resumenSedes, urlDetalleLibro } from "@/lib/libros-utils";

const COLORES_FONDO = ["bg-paper-hover", "bg-tint-sage", "bg-tint-clay", "bg-tint-lavender"];

interface SeccionCatalogoSemanaProps {
  cargando: boolean;
  librosCatalogo: Libro[];
  totalLibrosFormateado: string;
}

export function SeccionCatalogoSemana({
  cargando,
  librosCatalogo,
  totalLibrosFormateado,
}: SeccionCatalogoSemanaProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">
          Lo que se está leyendo esta semana
        </h2>
        <Link
          href="/libros"
          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5"
        >
          Ver los {totalLibrosFormateado} títulos →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-[3/4] w-full rounded-none" />
              <Skeleton className="h-4 w-24 rounded-none" />
              <Skeleton className="h-6 w-3/4 rounded-none" />
              <Skeleton className="h-4 w-1/2 rounded-none" />
            </div>
          ))
        ) : librosCatalogo.length > 0 ? (
          librosCatalogo.map((libro, idx) => {
            const bg = COLORES_FONDO[idx % COLORES_FONDO.length];
            const etiquetaDisponibilidad = estadoDisponibilidad(libro);
            const disponible = etiquetaDisponibilidad === "Disponible";

            return (
              <Link
                key={libro.id_libro}
                href={urlDetalleLibro(libro.id_libro, libro.titulo_libro)}
                className="group flex flex-col gap-2.5 transition-transform hover:-translate-y-0.5"
              >
                <div
                  className={`relative aspect-[3/4] w-full border border-foreground ${bg} p-4 flex items-end overflow-hidden`}
                >
                  {libro.portada_libro || libro.portada_libro ? (
                    <ImagenPortadaLibro
                      libro={libro}
                      alt={libro.titulo_libro ?? "Portada del libro"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-serif text-xl font-normal leading-tight text-foreground">
                      {libro.titulo_libro ?? "Sin título"}
                    </span>
                  )}
                </div>

                {(

                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`size-1.5 rounded-full ${
                        disponible ? "bg-success-soft" : "bg-warning"
                      }`}
                    />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                      {etiquetaDisponibilidad}
                    </span>
                  </div>
                )}

                <div className="font-serif text-xl font-normal leading-snug text-foreground group-hover:text-primary transition-colors">
                  {libro.titulo_libro}
                </div>

                <div className="text-xs text-muted-foreground">
                  {libro.autor || "Autor no registrado"}
                </div>

                <div className="text-[11px] text-muted-foreground/80">
                  {[resumenSedes(libro.nombre_biblioteca), libro.editorial].filter(Boolean).join(" · ")}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Aún no hay títulos cargados en el acervo.
          </div>
        )}
      </div>
    </section>
  );
}
