"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";

/** Centro predeterminado (Medellín) cuando todavía no hay ninguna sede con coordenadas. */
export const CENTRO_PREDETERMINADO: [number, number] = [6.2442, -75.5812];

export interface MarcadorMapa {
  id: string | number;
  lat: number;
  lng: number;
  /** HTML del globo emergente; debe venir ya escapado con `escaparHtml`. */
  popup?: string;
  seleccionado?: boolean;
}

interface MapaBaseProps {
  marcadores: MarcadorMapa[];
  /** Si se define, el mapa permite elegir un punto con clic y arrastrar el marcador. */
  onElegirPunto?: (lat: number, lng: number) => void;
  /** Marcador que debe centrarse y abrirse (p. ej. al pulsar "Ver en el mapa" en una tarjeta). */
  enfocarId?: string | number | null;
  className?: string;
  altoClass?: string;
}

/** Escapa texto para insertarlo en el HTML de un globo emergente. */
export function escaparHtml(texto: string): string {
  const reemplazos: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return texto.replace(/[&<>"']/g, (c) => reemplazos[c]);
}

/** Enlace para navegar hasta un punto (abre Google Maps con la ruta desde donde esté la persona). */
export function urlComoLlegar(destino: { lat?: number | null; lng?: number | null; direccion?: string | null }): string | null {
  if (destino.lat != null && destino.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}`;
  if (destino.direccion) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino.direccion)}`;
  return null;
}

/** Marcador hecho con CSS: evita depender de las imágenes por defecto de Leaflet, que fallan con el empaquetador. */
function crearIcono(L: typeof Leaflet, seleccionado: boolean) {
  const color = seleccionado ? "var(--map-pin-selected)" : "var(--map-pin)";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid var(--map-pin-border);box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });
}

/**
 * Mapa de OpenStreetMap con Leaflet (sin llave de API). Muestra marcadores y, opcionalmente,
 * deja elegir un punto. Leaflet se carga solo en el navegador.
 */
export function MapaBase({ marcadores, onElegirPunto, enfocarId, className, altoClass = "h-80" }: MapaBaseProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<Leaflet.Map | null>(null);
  const capa = useRef<Leaflet.LayerGroup | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const marcadoresPorId = useRef(new Map<string | number, Leaflet.Marker>());
  const alElegir = useRef(onElegirPunto);
  const primeraVez = useRef(true);
  // Función que dibuja los marcadores actuales; el mapa la invoca al terminar de crearse
  const pintarRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    alElegir.current = onElegirPunto;
  });

  // Crea el mapa una sola vez
  useEffect(() => {
    let cancelado = false;
    let observador: ResizeObserver | null = null;
    const porId = marcadoresPorId.current;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !contenedor.current || mapa.current) return;
      leaflet.current = L;
      const m = L.map(contenedor.current, { scrollWheelZoom: false }).setView(CENTRO_PREDETERMINADO, 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(m);
      capa.current = L.layerGroup().addTo(m);
      m.on("click", (evento: Leaflet.LeafletMouseEvent) => {
        m.scrollWheelZoom.enable();
        alElegir.current?.(evento.latlng.lat, evento.latlng.lng);
      });
      m.on("mouseout", () => m.scrollWheelZoom.disable());
      // Si el contenedor cambia de tamaño (p. ej. al abrir un diálogo) se recalcula el mapa
      observador = new ResizeObserver(() => m.invalidateSize());
      observador.observe(contenedor.current);
      mapa.current = m;
      // El mapa se crea de forma asíncrona: cuando existe se dibujan los marcadores pendientes
      pintarRef.current?.();
    })();
    return () => {
      cancelado = true;
      observador?.disconnect();
      mapa.current?.remove();
      mapa.current = null;
      capa.current = null;
      primeraVez.current = true;
      porId.clear();
    };
  }, []);

  // Dibuja los marcadores cada vez que cambian (y cuando el mapa termina de crearse)
  const marcadoresClave = JSON.stringify(marcadores);
  useEffect(() => {
    const pintar = () => {
      const L = leaflet.current;
      const m = mapa.current;
      if (!L || !m || !capa.current) return;
      // Dentro de un diálogo el contenedor puede no tener su tamaño final todavía
      m.invalidateSize();
      capa.current.clearLayers();
      marcadoresPorId.current.clear();
      marcadores.forEach((dato) => {
        const marcador = L.marker([dato.lat, dato.lng], {
          icon: crearIcono(L, Boolean(dato.seleccionado)),
          draggable: Boolean(alElegir.current),
        });
        if (dato.popup) marcador.bindPopup(dato.popup);
        marcador.on("dragend", () => {
          const { lat, lng } = marcador.getLatLng();
          alElegir.current?.(lat, lng);
        });
        marcador.addTo(capa.current!);
        marcadoresPorId.current.set(dato.id, marcador);
      });
      if (marcadores.length === 1) {
        m.setView([marcadores[0].lat, marcadores[0].lng], Math.max(m.getZoom(), 15));
      } else if (marcadores.length > 1 && primeraVez.current) {
        m.fitBounds(L.latLngBounds(marcadores.map((x) => [x.lat, x.lng] as [number, number])), { padding: [40, 40], maxZoom: 16 });
      }
      if (marcadores.length > 0) primeraVez.current = false;
    };
    pintarRef.current = pintar;
    pintar();
    // La clave serializada evita repintar por cambios de identidad del arreglo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcadoresClave]);

  // Centra y abre el globo del marcador pedido
  useEffect(() => {
    if (enfocarId == null) return;
    const marcador = marcadoresPorId.current.get(enfocarId);
    if (!marcador || !mapa.current) return;
    mapa.current.setView(marcador.getLatLng(), 16);
    marcador.openPopup();
  }, [enfocarId]);

  return <div ref={contenedor} aria-label="Mapa" className={`${altoClass} w-full z-0 border border-border bg-secondary ${className ?? ""}`} />;
}
