"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Input } from "@/components/ui/input";

export interface OpcionBuscable {
  valor: string;
  etiqueta: string;
}

interface SelectorBuscableProps {
  id: string;
  valor: string;
  onChange: (valor: string, etiqueta: string) => void;
  /** Consulta al servidor las opciones que coinciden con el texto (ya limitadas en número). */
  buscar: (texto: string) => Promise<OpcionBuscable[]>;
  placeholder: string;
  vacio?: string;
  /** Texto de la opción ya elegida cuando el formulario se abre con un valor (p. ej. al editar). */
  etiquetaInicial?: string;
  disabled?: boolean;
}

/**
 * Campo único para elegir un elemento de una lista grande: se escribe para buscar en el servidor
 * y las coincidencias aparecen en una lista debajo del campo. No descarga todas las opciones.
 */
export function SelectorBuscable({ id, valor, onChange, buscar, placeholder, vacio = "Sin resultados", etiquetaInicial, disabled }: SelectorBuscableProps) {
  const idLista = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [opciones, setOpciones] = useState<OpcionBuscable[]>([]);
  const [error, setError] = useState(false);
  const [resaltada, setResaltada] = useState(0);
  const [elegida, setElegida] = useState<{ valor: string; etiqueta: string } | null>(null);
  const buscarRef = useRef(buscar);
  useEffect(() => {
    buscarRef.current = buscar;
  });

  // Solo se usa la etiqueta guardada si corresponde al valor actual (el valor puede cambiar desde fuera)
  const etiquetaVisible = valor ? (elegida?.valor === valor ? elegida.etiqueta : etiquetaInicial ?? "Selección actual") : "";
  const textoCampo = editando ? texto : etiquetaVisible;

  // Busca en el servidor (con pausa al escribir) mientras la lista está abierta
  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    const temporizador = setTimeout(
      () => {
        buscarRef
          .current(editando ? texto.trim() : "")
          .then((lista) => {
            if (!activo) return;
            setOpciones(lista);
            setResaltada(0);
            setError(false);
          })
          .catch(() => {
            if (activo) setError(true);
          });
      },
      editando && texto ? 300 : 0
    );
    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [abierto, editando, texto]);

  // Un clic fuera cierra la lista y descarta lo que se estaba escribiendo
  useEffect(() => {
    if (!abierto) return;
    const alHacerClic = (evento: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(evento.target as Node)) {
        setAbierto(false);
        setEditando(false);
      }
    };
    document.addEventListener("mousedown", alHacerClic);
    return () => document.removeEventListener("mousedown", alHacerClic);
  }, [abierto]);

  const elegir = (opcion: OpcionBuscable) => {
    setElegida(opcion);
    setAbierto(false);
    setEditando(false);
    onChange(opcion.valor, opcion.etiqueta);
  };

  const limpiar = () => {
    setElegida(null);
    setTexto("");
    setEditando(false);
    setAbierto(false);
    onChange("", "");
  };

  const alTeclear = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (!abierto) setAbierto(true);
      else setResaltada((n) => Math.min(n + 1, Math.max(opciones.length - 1, 0)));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setResaltada((n) => Math.max(n - 1, 0));
    } else if (evento.key === "Enter" && abierto) {
      evento.preventDefault();
      if (opciones[resaltada]) elegir(opciones[resaltada]);
    } else if (evento.key === "Escape") {
      setAbierto(false);
      setEditando(false);
    }
  };

  return (
    <div ref={contenedor} className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-autocomplete="list"
        autoComplete="off"
        value={textoCampo}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={(e) => {
          if (disabled) return;
          setAbierto(true);
          if (valor) e.currentTarget.select();
        }}
        onChange={(e) => {
          setTexto(e.target.value);
          setEditando(true);
          setAbierto(true);
        }}
        onKeyDown={alTeclear}
        className={`h-10 rounded-none border-border bg-background text-xs ${valor ? "pr-9" : ""}`}
      />
      {valor && !disabled && (
        <button
          type="button"
          onClick={limpiar}
          aria-label="Quitar selección"
          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <Icon icon={Cancel01Icon} className="size-4" />
        </button>
      )}

      {abierto && (
        <ul id={idLista} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto border border-border bg-card text-xs shadow-md">
          {error ? (
            <li className="px-3 py-2 text-destructive">No se pudo buscar. Inténtalo de nuevo.</li>
          ) : opciones.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">{vacio}</li>
          ) : (
            opciones.map((opcion, indice) => (
              <li
                key={opcion.valor}
                role="option"
                aria-selected={opcion.valor === valor}
                onMouseEnter={() => setResaltada(indice)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(opcion);
                }}
                className={`cursor-pointer px-3 py-2 ${indice === resaltada ? "bg-secondary text-foreground" : "text-foreground"} ${opcion.valor === valor ? "font-semibold" : ""}`}
              >
                {opcion.etiqueta}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
