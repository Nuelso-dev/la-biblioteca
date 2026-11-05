"use client";

import { useEffect } from "react";

const NOMBRE_SITIO = "LaBiblioteca";

/**
 * Actualiza el título de la pestaña del navegador (p. ej. con el nombre del libro que se está viendo).
 * Con `null` o vacío deja el título general del sitio.
 */
export function useTituloPagina(titulo: string | null | undefined) {
  useEffect(() => {
    const anterior = document.title;
    if (titulo) document.title = `${titulo} | ${NOMBRE_SITIO}`;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
