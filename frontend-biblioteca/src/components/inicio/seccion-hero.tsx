import Link from "next/link";
import { ImagenPortadaLibro } from "@/components/libros/imagen-portada-libro";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search01Icon } from "@hugeicons/core-free-icons";
import type { Libro } from "@/services/libros.service";
import { estadoDisponibilidad, resumenSedes, urlDetalleLibro } from "@/lib/libros-utils";
import type { Biblioteca } from "@/services/bibliotecas.service";

const PILDORAS_BUSQUEDA = [
  { label: "Narrativa colombiana", query: "colombiana" },
  { label: "Novedades del mes", query: "novedades" },
  { label: "Disponibles hoy", query: "disponibles" },
];

interface SeccionHeroProps {
  sedes: Biblioteca[];
  libroDestacado: Libro | null;
  cargando: boolean;
  totalLibrosFormateado: string;
  terminoBusqueda: string;
  setTerminoBusqueda: (valor: string) => void;
  handleBuscar: (e: React.FormEvent) => void;
}

export function SeccionHero({
  sedes,
  libroDestacado,
  cargando,
  totalLibrosFormateado,
  terminoBusqueda,
  setTerminoBusqueda,
  handleBuscar,
}: SeccionHeroProps) {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="flex flex-col justify-center border-b border-border p-6 sm:p-10 lg:col-span-7 lg:border-b-0 lg:border-r lg:p-14">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[76px] font-normal leading-[1.02] sm:leading-[0.95] tracking-[-0.02em] text-foreground text-balance">
              Todo el catálogo,<br />
              <span className="italic text-accent-foreground">a diez minutos</span><br />
              de tu casa.
            </h1>

            <p className="mt-5 sm:mt-7 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
              Consulta la disponibilidad real de cada ejemplar, resérvalo en línea y recógelo en la sede que prefieras. Sin filas y sin llamadas.
            </p>

            <form
              onSubmit={handleBuscar}
              className="mt-7 sm:mt-9 flex max-w-lg border border-foreground bg-background shadow-none"
            >
              <div className="flex flex-1 items-center gap-3 px-3.5 sm:px-4 h-12 sm:h-13">
                <Icon icon={Search01Icon} className="size-5 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  placeholder="Buscar por título, autor o ISBN..."
                  className="h-auto border-0 p-0 w-full bg-transparent text-base sm:text-sm md:text-sm text-foreground placeholder:text-muted-foreground transition-none focus-visible:ring-0 focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                className="h-12 sm:h-13 border-0 bg-foreground px-5 sm:px-6 text-xs sm:text-sm font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-colors shrink-0"
              >
                Buscar
              </Button>
            </form>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {PILDORAS_BUSQUEDA.map((pill) => (
                <Link
                  key={pill.label}
                  href={`/libros?q=${encodeURIComponent(pill.query)}`}
                  className="border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:col-span-5">
            <div className="flex-1 bg-ink p-8 text-paper sm:p-10 lg:p-12 flex flex-col justify-center gap-7">
              <div className="text-xs font-semibold tracking-[0.14em] text-paper-muted uppercase">
                Ejemplar destacado
              </div>

              {libroDestacado ? (
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative aspect-[3/4] w-36 shrink-0 border border-ink-line bg-primary flex items-end p-3.5 shadow-none overflow-hidden">
                    {libroDestacado.portada_libro ? (
                      <ImagenPortadaLibro
                        libro={libroDestacado}
                        alt={libroDestacado.titulo_libro || "Libro destacado"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-serif text-lg leading-tight text-paper">
                        {libroDestacado.titulo_libro}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <h3 className="font-serif text-2xl lg:text-[26px] leading-tight text-paper">
                      {libroDestacado.titulo_libro}
                    </h3>
                    <p className="text-xs sm:text-sm text-paper-muted">
                      {[libroDestacado.autor, libroDestacado.editorial].filter(Boolean).join(" · ") || "Autor no registrado"}
                    </p>

                    {(

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            estadoDisponibilidad(libroDestacado) === "Disponible"
                              ? "bg-success-soft"
                              : "bg-warning"
                          }`}
                        />
                        <span className="text-xs font-semibold text-paper">
                          {estadoDisponibilidad(libroDestacado)}
                        </span>
                      </div>
                    )}

                    {libroDestacado.nombre_biblioteca && (
                      <span className="text-xs text-stone-light">{resumenSedes(libroDestacado.nombre_biblioteca)}</span>
                    )}

                    <Link
                      href={urlDetalleLibro(libroDestacado.id_libro, libroDestacado.titulo_libro)}
                      className="mt-4 inline-flex h-11 items-center justify-center bg-paper px-5 text-xs font-bold text-ink hover:bg-paper-hover transition-colors"
                    >
                      Solicitar préstamo
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-xs text-paper-muted">
                  {cargando ? "Cargando catálogo..." : "Aún no hay libros cargados en el catálogo."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 border-t border-border bg-background">
              <div className="border-r border-border p-6 sm:p-7">
                <div className="font-serif text-3xl sm:text-4xl leading-none text-foreground">
                  {cargando ? "..." : totalLibrosFormateado}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  títulos en catálogo
                </div>
              </div>
              <div className="p-6 sm:p-7">
                <div className="font-serif text-3xl sm:text-4xl leading-none text-foreground">
                  {cargando ? "..." : sedes.length}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  sedes en la red
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
