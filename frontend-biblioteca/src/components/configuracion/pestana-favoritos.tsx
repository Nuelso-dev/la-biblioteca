"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Book02Icon, Delete02Icon, ArrowRight01Icon, RotateLeftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaginacionTabla } from "@/components/admin/paginacion-tabla";
import { useFavoritos } from "@/context/contexto-favoritos";
import { favoritosService, type Favorito } from "@/services/favoritos.service";
import { urlDetalleLibro } from "@/lib/libros-utils";

const POR_PAGINA = 12;

export function PestanaFavoritos() {
  const { alternar } = useFavoritos();
  const [pagina, setPagina] = useState(1);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [quitandoId, setQuitandoId] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) {
        setCargando(true);
        setError(null);
      }
    });
    favoritosService
      .getPagina({ page: pagina, limit: POR_PAGINA })
      .then((resultado) => {
        if (!activo) return;
        setFavoritos(resultado.data);
        setTotal(resultado.total);
        setTotalPaginas(resultado.totalPages);
        // Si se quitó el último de la página, se retrocede a la anterior
        if (resultado.data.length === 0 && resultado.total > 0 && pagina > 1) setPagina(resultado.totalPages);
      })
      .catch((err: unknown) => {
        if (activo) setError(err instanceof Error ? err.message : "No se pudieron cargar tus favoritos.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [pagina, recarga]);

  const quitar = async (idLibro: number) => {
    setQuitandoId(idLibro);
    setErrorAccion(null);
    try {
      await alternar(idLibro);
      recargar();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo quitar el libro de tus favoritos.");
    } finally {
      setQuitandoId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
          Tus libros guardados. Están asociados a tu cuenta y los verás desde cualquier dispositivo.
        </p>
        <Button variant="ghost" size="xs" asChild className="text-xs font-semibold text-primary rounded-none shrink-0">
          <Link href="/libros" className="flex items-center gap-1">
            Explorar catálogo <Icon icon={ArrowRight01Icon} className="size-3.5" />
          </Link>
        </Button>
      </div>

      {(error || errorAccion) && (
        <div role="alert" className="flex items-center justify-between gap-3 p-4 rounded-none bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <span>{errorAccion ?? error}</span>
          {error && !errorAccion && (
            <Button variant="outline" size="xs" onClick={recargar} className="gap-1 rounded-none">
              <Icon icon={RotateLeftIcon} className="size-3.5" /> Reintentar
            </Button>
          )}
        </div>
      )}

      {cargando && favoritos.length === 0 ? (
        <p className="py-12 text-center text-xs text-muted-foreground">Cargando tus favoritos...</p>
      ) : favoritos.length === 0 ? (
        <EstadoVacio
          tipo="favoritos"
          titulo="Aún no tienes libros favoritos"
          descripcion="Pulsa el marcador de cualquier libro para guardarlo en tus favoritos."
          enlaceBoton="/libros"
          textoBoton="Ver catálogo"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favoritos.map((fav) => (
            <Card key={fav.id_favorito} className="hover:border-primary transition-colors border-border bg-card rounded-none shadow-none">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-10 rounded-none bg-secondary text-primary border border-border flex items-center justify-center shrink-0">
                      <Icon icon={Book02Icon} className="size-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-semibold text-accent-foreground tracking-wider block truncate">
                        {fav.categoria ?? "Libro"}
                      </span>
                      <h3 className="font-serif font-normal text-lg text-foreground line-clamp-1">{fav.titulo_libro}</h3>
                      <p className="text-xs text-muted-foreground truncate">{fav.autor || "Autor no registrado"}</p>
                    </div>
                  </div>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    disabled={quitandoId === fav.id_libro}
                    onClick={() => void quitar(fav.id_libro)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-none"
                    title="Quitar de favoritos"
                    aria-label={`Quitar ${fav.titulo_libro} de favoritos`}
                  >
                    <Icon icon={Delete02Icon} className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Badge variant={(fav.ejemplares_disponibles ?? 0) > 0 ? "default" : "secondary"} className="rounded-none text-[10px] font-semibold uppercase tracking-wider">
                    {(fav.ejemplares_disponibles ?? 0) > 0 ? "Disponible" : "No disponible"}
                  </Badge>
                  <Button size="sm" asChild className="rounded-none font-semibold gap-1 h-9">
                    <Link href={urlDetalleLibro(fav.id_libro, fav.titulo_libro)} className="flex items-center justify-center gap-1">
                      Ver detalle <Icon icon={ArrowRight01Icon} className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!cargando && <PaginacionTabla pagina={pagina} totalPaginas={totalPaginas} total={total} limite={POR_PAGINA} onCambiar={setPagina} />}
    </div>
  );
}
