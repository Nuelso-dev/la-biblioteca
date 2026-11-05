"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginaAPI } from "@/services/api-client";

/**
 * Carga una página de un listado del servidor y la vuelve a pedir cuando cambian las dependencias
 * (filtros, página) o al llamar a `recargar`. Descarta respuestas de peticiones ya superadas.
 * Si la página pedida quedó vacía (p. ej. tras eliminar el último elemento), llama a `alPaginaVacia`
 * con la última página existente.
 */
export function useListadoPaginado<T>(
  cargar: () => Promise<PaginaAPI<T>>,
  dependencias: readonly unknown[],
  opciones: { pagina?: number; alPaginaVacia?: (ultimaPagina: number) => void; mensajeError: string }
) {
  const [datos, setDatos] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  // Siempre se usan las últimas funciones sin volver a disparar la carga
  const cargarRef = useRef(cargar);
  const opcionesRef = useRef(opciones);
  useEffect(() => {
    cargarRef.current = cargar;
    opcionesRef.current = opciones;
  });

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (!activo) return;
      setCargando(true);
      setError(null);
    });
    cargarRef
      .current()
      .then((pagina) => {
        if (!activo) return;
        setDatos(pagina.data);
        setTotal(pagina.total);
        setTotalPaginas(pagina.totalPages);
        const { pagina: actual = 1, alPaginaVacia } = opcionesRef.current;
        if (pagina.data.length === 0 && pagina.total > 0 && actual > 1) alPaginaVacia?.(pagina.totalPages);
      })
      .catch((err: unknown) => {
        if (!activo) return;
        setDatos([]);
        setError(err instanceof Error && err.message ? err.message : opcionesRef.current.mensajeError);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, recarga]);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  return { datos, total, totalPaginas, cargando, error, recargar };
}
