"use client";

import { useMemo, useState } from "react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { autoresService, type Autor } from "@/services/autores.service";
import { getMensajeError } from "@/lib/errores";

interface SelectorAutoresProps {
  autores: Autor[];
  seleccionados: number[];
  onChange: (ids: number[]) => void;
  /** Se invoca cuando se crea un autor nuevo desde el selector */
  onAutorCreado: (autor: Autor) => void;
  disabled?: boolean;
}

const nombreDe = (a: Autor) => a.nombrecompleto_autor ?? "";

export function SelectorAutores({ autores, seleccionados, onChange, onAutorCreado, disabled }: SelectorAutoresProps) {
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const porId = useMemo(() => new Map(autores.map((a) => [Number(a.id_autor), a])), [autores]);
  const termino = busqueda.trim().toLowerCase();
  const filtrados = useMemo(
    () => (termino ? autores.filter((a) => nombreDe(a).toLowerCase().includes(termino)) : autores),
    [autores, termino]
  );
  const existeExacto = autores.some((a) => nombreDe(a).trim().toLowerCase() === termino);

  const alternar = (id: number) => {
    onChange(seleccionados.includes(id) ? seleccionados.filter((s) => s !== id) : [...seleccionados, id]);
  };

  const crearAutor = async () => {
    const nombre = busqueda.trim();
    if (nombre.length < 2) return;
    setCreando(true);
    setError(null);
    try {
      const creado = await autoresService.create({ nombre });
      onAutorCreado(creado);
      onChange([...seleccionados, Number(creado.id_autor)]);
      setBusqueda("");
    } catch (err) {
      setError(getMensajeError(err, "No se pudo crear el autor."));
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {seleccionados.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {seleccionados.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 border border-border bg-secondary px-2 py-1 text-xs text-foreground">
              {porId.get(id) ? nombreDe(porId.get(id)!) : `Autor #${id}`}
              <button
                type="button"
                disabled={disabled}
                onClick={() => alternar(id)}
                aria-label="Quitar autor"
                className="text-muted-foreground hover:text-destructive"
              >
                <Icon icon={Cancel01Icon} className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        disabled={disabled}
        placeholder="Buscar autor o escribir uno nuevo..."
        className="h-10 rounded-none border-border bg-background text-xs"
      />

      <div className="max-h-36 overflow-y-auto border border-border bg-background">
        {filtrados.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">
            {autores.length === 0 ? "Aún no hay autores registrados." : "Ningún autor coincide con la búsqueda."}
          </p>
        ) : (
          filtrados.map((autor) => {
            const id = Number(autor.id_autor);
            return (
              <label key={id} className="flex cursor-pointer items-center gap-2 border-b border-border/60 px-3 py-2 text-xs last:border-b-0 hover:bg-accent/40">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(id)}
                  disabled={disabled}
                  onChange={() => alternar(id)}
                  className="size-3.5 accent-primary"
                />
                <span className="text-foreground">{nombreDe(autor)}</span>
              </label>
            );
          })
        )}
      </div>

      {termino.length >= 2 && !existeExacto && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || creando}
          onClick={() => void crearAutor()}
          className="h-8 self-start rounded-none border-border text-xs font-semibold"
        >
          {creando ? "Creando..." : `Crear autor «${busqueda.trim()}»`}
        </Button>
      )}
      {error && <p role="alert" className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
