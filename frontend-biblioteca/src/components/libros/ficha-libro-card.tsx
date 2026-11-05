import { Book02Icon, Bookmark02Icon, Building01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImagenPortadaLibro } from "@/components/libros/imagen-portada-libro";
import type { Libro } from "@/services/libros.service";

interface FichaLibroCardProps {
  libro: Libro;
  esFavorito: boolean;
  onGuardarFavorito: () => void;
  solicitando: boolean;
  reservaDisponible: boolean;
  errorReserva: string | null;
  reservaExito: boolean;
  ejemplarSeleccionadoId?: number | string | null;
  onSeleccionarEjemplar?: (idEjemplar: number | string) => void;
  onSolicitarReserva: () => void;
}

export function FichaLibroCard({
  libro,
  esFavorito,
  onGuardarFavorito,
  solicitando,
  reservaDisponible,
  errorReserva,
  reservaExito,
  ejemplarSeleccionadoId,
  onSeleccionarEjemplar,
  onSolicitarReserva,
}: FichaLibroCardProps) {
  const listaEjemplares = libro.ejemplares && libro.ejemplares.length > 0 ? libro.ejemplares : null;
  const ejemplarActivo = listaEjemplares?.find((e) => String(e.id_ejemplar) === String(ejemplarSeleccionadoId));
  const sedeMostrada = ejemplarActivo?.nombre_biblioteca ?? libro.nombre_biblioteca ?? "Sin sede asignada";

  return (
    <Card className="overflow-hidden shadow-none border border-border bg-card rounded-none mb-10">
      <CardContent className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center">
          <div className="w-full aspect-[3/4] rounded-none overflow-hidden bg-muted border border-border mb-4">
            <ImagenPortadaLibro
              libro={libro}
              alt={libro.titulo_libro ?? "Portada del libro"}
              className="w-full h-full object-cover"
            />
          </div>

          <Button
            variant={esFavorito ? "default" : "outline"}
            size="sm"
            onClick={onGuardarFavorito}
            className="w-full rounded-none gap-2 text-xs font-semibold h-10"
          >
            <Icon icon={Bookmark02Icon} className="size-4" />
            {esFavorito ? "Guardado en favoritos" : "Guardar en favoritos"}
          </Button>
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="secondary" className="uppercase tracking-wider font-semibold text-[10px] rounded-none">
                {libro.categoria || "General"}
              </Badge>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-normal text-foreground mb-2 leading-tight tracking-[-0.02em] break-words">
              {libro.titulo_libro}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mb-5">
              por <span className="text-foreground font-semibold">{libro.autor || "Autor desconocido"}</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-secondary p-3.5 sm:p-4 rounded-none mb-6 text-center border border-border">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">ISBN</span>
                <span className="text-[11px] font-mono font-semibold text-foreground block break-all tabular-nums">{libro.isbn_libro ?? "N/A"}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Publicación</span>
                <span className="text-xs font-semibold text-foreground">
                  {(libro.fechapublicacion_libro)
                    ? new Date(libro.fechapublicacion_libro).getFullYear()
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Editorial</span>
                <span className="text-xs font-semibold text-foreground truncate block">{libro.editorial || "N/A"}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Categoría</span>
                <span className="text-xs font-semibold text-foreground truncate block">{libro.categoria || "General"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6 text-center">
              <div className="border border-border p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Páginas</span>
                <span className="text-xs font-semibold text-foreground">{libro.numpaginas_libro ?? "N/A"}</span>
              </div>
              <div className="border border-border p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Idioma</span>
                <span className="text-xs font-semibold text-foreground">{libro.idioma_libro ?? "N/A"}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 border border-border p-2.5">
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Ejemplares disponibles</span>
                <span className="text-xs font-semibold text-foreground">{libro.ejemplares_disponibles ?? 0} de {libro.total_ejemplares ?? 0}</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-serif font-normal text-lg sm:text-xl text-foreground mb-2">
                Sinopsis del Libro
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {libro.descripcion_libro ?? "Este libro no tiene sinopsis registrada."}
              </p>
            </div>

            {/* Sección de Ejemplares y Sedes Físicas */}
            <div className="mb-6 sm:mb-8">
              <h3 className="font-serif font-normal text-base text-foreground mb-2.5 flex items-center gap-1.5">
                <Icon icon={Building01Icon} className="size-4 text-primary" />
                Ejemplares y Sedes de la Red
              </h3>
              {listaEjemplares ? (
                <div className="flex flex-col gap-2">
                  {listaEjemplares.map((ej) => {
                  const estaDisponible =
                    (ej.codigo_estado ?? "").toUpperCase() === "DISPONIBLE" ||
                    ej.nombre_estado?.toLowerCase().includes("disponible") ||
                    false;
                    const seleccionado = String(ej.id_ejemplar) === String(ejemplarSeleccionadoId);

                    return (
                      <div
                        key={ej.id_ejemplar}
                        onClick={() => {
                          if (estaDisponible && onSeleccionarEjemplar) {
                            onSeleccionarEjemplar(ej.id_ejemplar);
                          }
                        }}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-none border text-xs gap-2 transition-all ${
                          estaDisponible ? "cursor-pointer hover:border-primary" : "opacity-60 bg-muted/40 cursor-not-allowed"
                        } ${
                          seleccionado ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{ej.nombre_biblioteca ?? "Sede principal"}</span>
                            {ej.codinterno_ejemplar && (
                              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 border border-border">
                                {ej.codinterno_ejemplar}
                              </span>
                            )}
                          </div>
                          {ej.nombre_ubicacion && <span className="text-[11px] text-muted-foreground">{ej.nombre_ubicacion}</span>}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <Badge
                            variant={estaDisponible ? "default" : "secondary"}
                            className="font-semibold text-[10px] uppercase tracking-wider rounded-none"
                          >
                            {ej.nombre_estado ?? ej.codigo_estado ?? "Disponible"}
                          </Badge>
                          {estaDisponible && seleccionado && (
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                              (Seleccionado)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-none bg-card border border-border text-xs">
                  <span className="text-muted-foreground">Este título aún no tiene ejemplares físicos registrados.</span>
                  <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider rounded-none">
                    Sin ejemplares
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-border flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold">Sede seleccionada para retiro</span>
              <span className="text-xs font-semibold text-foreground">{sedeMostrada}</span>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button
                size="lg"
                onClick={onSolicitarReserva}
                disabled={solicitando || !reservaDisponible}
                className="rounded-none font-semibold gap-2 h-11 px-6 sm:px-8 text-xs uppercase tracking-wider"
              >
                <Icon icon={Book02Icon} className="size-4" />
                <span>{solicitando ? "Procesando..." : "Solicitar préstamo"}</span>
              </Button>
              {!reservaDisponible && (
                <p className="max-w-xs text-left sm:text-right text-xs text-muted-foreground">
                  No hay ejemplares disponibles en este momento para préstamo inmediato.
                </p>
              )}
              {errorReserva && <p className="max-w-xs text-left sm:text-right text-xs text-destructive">{errorReserva}</p>}
              {reservaExito && <p className="text-left sm:text-right text-xs font-semibold text-primary">Solicitud enviada correctamente.</p>}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Barra fija inferior para móvil (Sticky Bottom Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 pb-safe px-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-serif font-normal truncate text-foreground leading-tight">
            {libro.titulo_libro}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {sedeMostrada}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={esFavorito ? "default" : "outline"}
            size="icon"
            onClick={onGuardarFavorito}
            aria-label="Guardar"
            className="size-10 rounded-none border-border"
          >
            <Icon icon={Bookmark02Icon} className="size-4" />
          </Button>

          <Button
            onClick={onSolicitarReserva}
            disabled={solicitando || !reservaDisponible}
            className="h-10 px-4 text-xs font-semibold uppercase tracking-wider rounded-none shrink-0"
          >
            {solicitando ? "..." : "Solicitar"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

