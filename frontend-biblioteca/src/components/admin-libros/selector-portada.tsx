"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagenPortadaLibro } from "@/components/libros/imagen-portada-libro";
import { obtenerImagenPortada } from "@/lib/libros-utils";
import { storageService, type PortadaStorage } from "@/services/libros.service";
import { getMensajeError } from "@/lib/errores";
import { subirPortada } from "@/lib/portadas";

const POR_PAGINA = 48;
interface SelectorPortadaProps {
  /** Nombre del archivo dentro del bucket `covers` (valor de libros.portada_libro) */
  valor: string;
  onChange: (nombreArchivo: string) => void;
  disabled?: boolean;
}

export function SelectorPortada({ valor, onChange, disabled }: SelectorPortadaProps) {
  const [abierto, setAbierto] = useState(false);
  const [imagenes, setImagenes] = useState<PortadaStorage[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto || imagenes.length > 0) return;
    let cancelado = false;
    void Promise.resolve()
      .then(() => {
        if (cancelado) return [];
        setCargando(true);
        setError(null);
        return storageService.listarPortadas();
      })
      .then((lista) => {
        if (!cancelado) setImagenes(Array.isArray(lista) ? lista : []);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getMensajeError(err, "No se pudieron cargar las imágenes."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [abierto, imagenes.length]);

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return termino ? imagenes.filter((img) => img.name.toLowerCase().includes(termino)) : imagenes;
  }, [imagenes, busqueda]);

  const subirImagen = async (archivo: File) => {
    setErrorSubida(null);
    setSubiendo(true);
    try {
      const nombre = await subirPortada(archivo);
      setImagenes((actuales) => [{ name: nombre, size: archivo.size, created_at: null, libros: [] }, ...actuales]);
      onChange(nombre);
      setAbierto(false);
    } catch (err) {
      setErrorSubida(getMensajeError(err, "No se pudo subir la imagen."));
    } finally {
      setSubiendo(false);
      if (inputArchivo.current) inputArchivo.current.value = "";
    }
  };

  const seleccionar = (nombre: string) => {
    onChange(nombre);
    setAbierto(false);
  };

  const urlActual = valor ? obtenerImagenPortada({ portada_libro: valor }) : null;

  return (
    <div className="flex items-start gap-3">
      <div className="relative h-[84px] w-[60px] shrink-0 border border-border bg-muted overflow-hidden">
        {urlActual ? (
          <ImagenPortadaLibro src={urlActual} alt="Portada seleccionada" fill sizes="60px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Icon icon={Image01Icon} className="size-5" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="truncate font-mono text-xs text-foreground">{valor || "Sin portada seleccionada"}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setAbierto(true)}
            className="h-8 rounded-none border-border text-xs font-semibold"
          >
            {valor ? "Cambiar imagen" : "Elegir imagen subida"}
          </Button>
          {valor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange("")}
              className="h-8 rounded-none text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              Quitar
            </Button>
          )}
        </div>
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="admin-touch sm:max-w-3xl rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Imágenes subidas</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecciona una imagen para asignarla al libro.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 border border-dashed border-border bg-secondary/50 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={inputArchivo}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                id="subir-portada"
                disabled={subiendo}
                onChange={(e) => {
                  const archivo = e.target.files?.[0];
                  if (archivo) void subirImagen(archivo);
                }}
              />
              <Button
                type="button"
                disabled={subiendo}
                onClick={() => inputArchivo.current?.click()}
                className="h-9 rounded-none text-xs font-semibold"
              >
                {subiendo ? "Subiendo..." : "Subir imagen nueva"}
              </Button>
              <span className="text-[11px] text-muted-foreground">JPG, PNG o WebP · máximo 5 MB. Se asigna al libro automáticamente.</span>
            </div>
            {errorSubida && <p role="alert" className="text-[11px] text-destructive">{errorSubida}</p>}
          </div>

          <Input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setVisibles(POR_PAGINA);
            }}
            placeholder="Buscar por nombre de archivo..."
            className="h-10 rounded-none border-border bg-background text-xs"
          />

          {cargando ? (
            <p className="py-10 text-center text-xs text-muted-foreground">Cargando imágenes...</p>
          ) : error ? (
            <p role="alert" className="py-10 text-center text-xs text-destructive">{error}</p>
          ) : filtradas.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              {imagenes.length === 0 ? "No hay imágenes subidas." : "Ninguna imagen coincide con la búsqueda."}
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">
                {filtradas.length} {filtradas.length === 1 ? "imagen" : "imágenes"}
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {filtradas.slice(0, visibles).map((img) => {
                  const url = obtenerImagenPortada({ portada_libro: img.name });
                  const activa = img.name === valor;
                  return (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => seleccionar(img.name)}
                      title={img.name}
                      className={`group flex flex-col gap-1 border p-1.5 text-left transition-colors hover:border-primary ${
                        activa ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-background"
                      }`}
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                        <ImagenPortadaLibro src={url} alt={img.name} fill sizes="120px" className="object-cover" />
                      </div>
                      <span className="line-clamp-2 break-all text-[10px] leading-tight text-muted-foreground">{img.name}</span>
                    </button>
                  );
                })}
              </div>
              {visibles < filtradas.length && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisibles((v) => v + POR_PAGINA)}
                  className="mx-auto rounded-none text-xs font-semibold"
                >
                  Mostrar más ({filtradas.length - visibles} restantes)
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
