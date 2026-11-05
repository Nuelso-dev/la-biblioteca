"use client";

import dynamic from "next/dynamic";
import { escaparHtml, urlComoLlegar } from "./mapa-base";

const MapaBase = dynamic(() => import("./mapa-base").then((m) => m.MapaBase), {
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse border border-border bg-secondary" />,
});

export interface SedeEnMapa {
  id: string | number;
  nombre: string;
  direccion?: string | null;
  lat: number;
  lng: number;
}

/** Mapa con las sedes que tienen ubicación; cada globo trae el enlace para llegar. */
export function MapaSedes({ sedes, enfocarId, altoClass = "h-96" }: { sedes: SedeEnMapa[]; enfocarId?: string | number | null; altoClass?: string }) {
  return (
    <MapaBase
      altoClass={altoClass}
      enfocarId={enfocarId}
      marcadores={sedes.map((s) => {
        const ruta = urlComoLlegar({ lat: s.lat, lng: s.lng });
        return {
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          popup: `<strong>${escaparHtml(s.nombre)}</strong>${s.direccion ? `<br/>${escaparHtml(s.direccion)}` : ""}${
            ruta ? `<br/><a href="${ruta}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>` : ""
          }`,
        };
      })}
    />
  );
}
