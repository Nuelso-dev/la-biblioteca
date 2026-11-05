"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Delete02Icon, RotateLeftIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagenPortadaLibro } from "@/components/libros/imagen-portada-libro";
import { obtenerImagenPortada } from "@/lib/libros-utils";
import { MAX_ARCHIVOS_POR_SUBIDA, eliminarPortada, subirPortada } from "@/lib/portadas";
import { storageService, type PortadaFaltante, type PortadaStorage } from "@/services/libros.service";
import { useBusquedaDiferida, useFiltrosUrl } from "@/hooks/use-filtros-url";
import { getMensajeError } from "@/lib/errores";

type Filtro = "todas" | "sin-uso" | "en-uso";

const formatearTamano = (bytes: string | number | null) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const FILTROS_INICIALES = { busqueda: "", filtro: "todas" };
const FILTROS_VALIDOS: Filtro[] = ["todas", "sin-uso", "en-uso"];

function ContenidoAdminPortadas() {
  const { filtros, actualizar } = useFiltrosUrl(FILTROS_INICIALES);
  const filtro = (FILTROS_VALIDOS.includes(filtros.filtro as Filtro) ? filtros.filtro : "todas") as Filtro;
  const [busqueda, setBusqueda] = useBusquedaDiferida(filtros.busqueda, (valor) => actualizar({ busqueda: valor }));
  const busquedaAplicada = filtros.busqueda;
  const setFiltro = (valor: Filtro) => actualizar({ filtro: valor });
  const [imagenes, setImagenes] = useState<PortadaStorage[]>([]);
  const [faltantes, setFaltantes] = useState<PortadaFaltante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [porEliminar, setPorEliminar] = useState<PortadaStorage | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, sinArchivo] = await Promise.all([storageService.listarPortadas(), storageService.listarFaltantes()]);
      setImagenes(lista);
      setFaltantes(sinArchivo);
    } catch (err) {
      setError(getMensajeError(err, "No se pudieron cargar las portadas."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const visibles = useMemo(() => {
    const termino = busquedaAplicada.trim().toLowerCase();
    return imagenes.filter((img) => {
      if (termino && !img.name.toLowerCase().includes(termino) && !img.libros.some((l) => l.titulo.toLowerCase().includes(termino))) return false;
      if (filtro === "sin-uso") return img.libros.length === 0;
      if (filtro === "en-uso") return img.libros.length > 0;
      return true;
    });
  }, [imagenes, busquedaAplicada, filtro]);

  const sinUso = imagenes.filter((img) => img.libros.length === 0).length;

  const subir = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;
    if (archivos.length > MAX_ARCHIVOS_POR_SUBIDA) {
      setError(`Sube máximo ${MAX_ARCHIVOS_POR_SUBIDA} imágenes a la vez.`);
      if (inputArchivo.current) inputArchivo.current.value = "";
      return;
    }
    setSubiendo(true);
    setError(null);
    setAviso(null);
    const errores: string[] = [];
    let subidas = 0;
    for (const archivo of Array.from(archivos)) {
      try {
        await subirPortada(archivo);
        subidas += 1;
      } catch (err) {
        errores.push(`${archivo.name}: ${getMensajeError(err, "no se pudo subir")}`);
      }
    }
    if (subidas > 0) setAviso(`Se subieron ${subidas} ${subidas === 1 ? "imagen" : "imágenes"}.`);
    if (errores.length > 0) setError(errores.join(" · "));
    if (inputArchivo.current) inputArchivo.current.value = "";
    setSubiendo(false);
    await cargar();
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    setError(null);
    setAviso(null);
    try {
      await eliminarPortada(porEliminar.name);
      setAviso(`Se eliminó ${porEliminar.name}.`);
      setPorEliminar(null);
      await cargar();
    } catch (err) {
      setPorEliminar(null);
      setError(getMensajeError(err, "No se pudo eliminar la imagen."));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">Portadas</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Imágenes subidas y los libros que las usan. Solo se pueden eliminar las que ningún libro utiliza.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputArchivo}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => void subir(e.target.files)}
          />
          <Button variant="outline" onClick={() => void cargar()} disabled={cargando} className="h-10 rounded-none border-border px-4">
            <Icon icon={RotateLeftIcon} className={`size-4 ${cargando ? "animate-spin text-primary" : ""}`} />
          </Button>
          <Button onClick={() => inputArchivo.current?.click()} disabled={subiendo} className="h-10 rounded-none bg-foreground px-5 text-xs font-semibold text-background hover:bg-foreground/90 gap-2">
            <Icon icon={Add01Icon} className="size-4" /> {subiendo ? "Subiendo..." : "Subir imágenes"}
          </Button>
        </div>
      </div>

      {error && <div role="alert" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</div>}
      {aviso && <div role="status" className="border border-primary/40 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">{aviso}</div>}

      {faltantes.length > 0 && (
        <div className="border border-destructive/30 bg-destructive/5 p-4 text-xs">
          <p className="font-semibold text-foreground">
            {faltantes.length} {faltantes.length === 1 ? "libro apunta" : "libros apuntan"} a una imagen que ya no existe
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
            {faltantes.map((f) => (
              <li key={f.id_libro}>
                <Link href="/administracion/libros" className="font-semibold text-foreground underline-offset-2 hover:underline">{f.titulo_libro}</Link>
                {" "}— <span className="font-mono">{f.portada_libro}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">Edita cada libro y elige otra portada en el selector.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre de archivo o título del libro..."
          className="h-10 rounded-none border-border bg-background text-xs sm:max-w-sm"
        />
        <div className="flex gap-2">
          {([
            ["todas", `Todas (${imagenes.length})`],
            ["en-uso", `En uso (${imagenes.length - sinUso})`],
            ["sin-uso", `Sin uso (${sinUso})`],
          ] as const).map(([valor, etiqueta]) => (
            <Button key={valor} size="sm" variant={filtro === valor ? "default" : "outline"} onClick={() => setFiltro(valor)} className="rounded-none text-xs font-semibold">
              {etiqueta}
            </Button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-none" />)}
        </div>
      ) : visibles.length === 0 ? (
        <p className="py-16 text-center text-xs text-muted-foreground">
          {imagenes.length === 0 ? "No hay imágenes subidas." : "Ninguna imagen coincide con el filtro."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {visibles.map((img) => {
            const enUso = img.libros.length > 0;
            return (
              <div key={img.name} className="flex min-w-0 flex-col gap-2 border border-border bg-card p-2">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                  <ImagenPortadaLibro src={obtenerImagenPortada({ portada_libro: img.name })} alt={img.name} fill sizes="200px" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-mono text-[11px] text-foreground" title={img.name}>{img.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatearTamano(img.size)}</span>
                  {enUso ? (
                    <Badge variant="default" className="w-fit max-w-full min-w-0 truncate rounded-none text-[10px] font-semibold uppercase tracking-wider" title={img.libros.map((l) => l.titulo).join(", ")}>
                      {img.libros.length === 1 ? img.libros[0].titulo : `${img.libros.length} libros`}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="w-fit max-w-full min-w-0 truncate rounded-none text-[10px] font-semibold uppercase tracking-wider">Sin uso</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enUso}
                  onClick={() => setPorEliminar(img)}
                  title={enUso ? "En uso: cambia la portada del libro antes de eliminarla" : "Eliminar imagen"}
                  className="h-8 rounded-none border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:border-border disabled:text-muted-foreground"
                >
                  <Icon icon={Delete02Icon} className="size-3.5" /> Eliminar
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(porEliminar)} onOpenChange={(abierto) => !abierto && !eliminando && setPorEliminar(null)}>
        <DialogContent role="alertdialog" className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">¿Eliminar imagen?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se borrará <strong className="font-mono text-foreground">{porEliminar?.name}</strong> del almacenamiento. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPorEliminar(null)} disabled={eliminando} className="rounded-none font-semibold">Cancelar</Button>
            <Button variant="destructive" onClick={() => void eliminar()} disabled={eliminando} className="rounded-none font-semibold">{eliminando ? "Eliminando..." : "Sí, eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PaginaAdminPortadas() {
  return (
    <Suspense fallback={null}>
      <ContenidoAdminPortadas />
    </Suspense>
  );
}
