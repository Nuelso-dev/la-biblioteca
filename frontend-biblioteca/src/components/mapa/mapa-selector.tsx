"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Leaflet necesita el navegador: el mapa se carga solo en el cliente
const MapaBase = dynamic(() => import("./mapa-base").then((m) => m.MapaBase), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse border border-border bg-secondary" />,
});

const NOMINATIM = "https://nominatim.openstreetmap.org";

interface Resultado {
  display_name: string;
  lat: string;
  lon: string;
}

export interface PuntoElegido {
  lat: number;
  lng: number;
  /** Dirección legible del punto, cuando el servicio de mapas pudo resolverla. */
  direccion?: string;
}

interface MapaSelectorProps {
  latitud: number | null;
  longitud: number | null;
  onChange: (punto: PuntoElegido) => void;
  /** Texto con el que se precarga el buscador (por ejemplo, la dirección ya escrita). */
  busquedaInicial?: string;
}

const redondear = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * Selector de ubicación: se busca una dirección o se hace clic (o se arrastra el marcador) sobre el mapa.
 * Al elegir un punto se devuelve su latitud/longitud y la dirección más cercana.
 */
export function MapaSelector({ latitud, longitud, onChange, busquedaInicial = "" }: MapaSelectorProps) {
  const [texto, setTexto] = useState(busquedaInicial);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const buscar = async () => {
    const consulta = texto.trim();
    if (consulta.length < 3) {
      setAviso("Escribe al menos 3 caracteres para buscar.");
      return;
    }
    setBuscando(true);
    setAviso(null);
    try {
      const respuesta = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=5&accept-language=es&q=${encodeURIComponent(consulta)}`);
      if (!respuesta.ok) throw new Error("respuesta no válida");
      const lista: Resultado[] = await respuesta.json();
      if (lista.length === 0) {
        setResultados([]);
        setAviso("No se encontró esa dirección. Prueba con más detalle (ciudad, barrio) o haz clic en el mapa.");
      } else if (lista.length === 1) {
        // Un solo resultado: se marca directamente, sin obligar a elegirlo de la lista
        elegirResultado(lista[0]);
      } else {
        setResultados(lista);
      }
    } catch {
      setAviso("No se pudo consultar el buscador de direcciones. Puedes hacer clic directamente en el mapa.");
    } finally {
      setBuscando(false);
    }
  };

  const elegirDesdeMapa = async (lat: number, lng: number) => {
    const punto = { lat: redondear(lat), lng: redondear(lng) };
    onChange(punto);
    try {
      const respuesta = await fetch(`${NOMINATIM}/reverse?format=jsonv2&accept-language=es&lat=${punto.lat}&lon=${punto.lng}`);
      if (!respuesta.ok) return;
      const dato: { display_name?: string } = await respuesta.json();
      if (dato.display_name) onChange({ ...punto, direccion: dato.display_name });
    } catch {
      // Sin dirección legible se conservan solo las coordenadas
    }
  };

  const elegirResultado = (r: Resultado) => {
    setResultados([]);
    setTexto(r.display_name);
    onChange({ lat: redondear(Number(r.lat)), lng: redondear(Number(r.lon)), direccion: r.display_name });
  };

  const hayPunto = latitud != null && longitud != null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void buscar();
            }
          }}
          placeholder="Buscar dirección en el mapa"
          aria-label="Buscar dirección en el mapa"
          className="h-10 rounded-none border-border bg-background text-xs"
        />
        <Button type="button" variant="outline" onClick={() => void buscar()} disabled={buscando} className="h-10 shrink-0 rounded-none border-border px-3 text-xs font-semibold gap-1.5">
          <Icon icon={Search01Icon} className="size-4" /> {buscando ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {resultados.length > 0 && (
        <ul aria-label="Resultados de la búsqueda" className="max-h-40 overflow-y-auto border border-border bg-background text-xs">
          {resultados.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button type="button" onClick={() => elegirResultado(r)} className="w-full px-3 py-2 text-left hover:bg-secondary">
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {aviso && <p role="status" className="text-[11px] text-muted-foreground">{aviso}</p>}

      <MapaBase
        altoClass="h-72"
        marcadores={hayPunto ? [{ id: "sede", lat: latitud, lng: longitud, seleccionado: true }] : []}
        onElegirPunto={(lat, lng) => void elegirDesdeMapa(lat, lng)}
      />
      <p className="text-[11px] text-muted-foreground">
        {hayPunto
          ? `Punto elegido: ${latitud.toFixed(5)}, ${longitud.toFixed(5)}. Arrastra el marcador o haz clic para ajustarlo.`
          : "Haz clic en el mapa o busca una dirección para marcar dónde queda la sede."}
      </p>
    </div>
  );
}
