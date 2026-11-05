"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Mantiene los filtros y la página de un listado en la URL (?estado=...&pagina=2),
 * de modo que se conservan al recargar, al volver atrás y al compartir el enlace.
 * Los valores iguales al predeterminado no se escriben en la URL. Cambiar un filtro vuelve a la página 1.
 * La página que use este hook debe estar dentro de un <Suspense>.
 */
export function useFiltrosUrl<T extends Record<string, string>>(predeterminados: T) {
  const parametros = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filtros = useMemo(() => {
    const actuales = {} as Record<string, string>;
    for (const clave of Object.keys(predeterminados)) {
      actuales[clave] = parametros.get(clave) ?? predeterminados[clave];
    }
    return actuales as T;
  }, [parametros, predeterminados]);

  const pagina = Math.max(1, Number(parametros.get("pagina")) || 1);

  const actualizar = useCallback(
    (cambios: Partial<T> & { pagina?: number }) => {
      const siguiente = new URLSearchParams(parametros.toString());
      let cambioFiltro = false;
      for (const [clave, valor] of Object.entries(cambios)) {
        if (clave === "pagina") continue;
        cambioFiltro = true;
        if (valor === undefined || valor === "" || valor === predeterminados[clave]) siguiente.delete(clave);
        else siguiente.set(clave, String(valor));
      }
      const nuevaPagina = cambios.pagina ?? (cambioFiltro ? 1 : pagina);
      if (nuevaPagina <= 1) siguiente.delete("pagina");
      else siguiente.set("pagina", String(nuevaPagina));
      const qs = siguiente.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [parametros, pagina, pathname, predeterminados, router]
  );

  return { filtros, pagina, actualizar };
}

/**
 * Texto de un campo de búsqueda que se confirma (por ejemplo, en la URL) tras una breve pausa al escribir.
 * Devuelve el texto local y su setter; `confirmar` recibe el texto ya estable.
 */
export function useBusquedaDiferida(valorConfirmado: string, confirmar: (valor: string) => void, esperaMs = 350) {
  const [texto, setTexto] = useState(valorConfirmado);

  // Si la URL cambia desde fuera (atrás/adelante), el campo la sigue
  const [anterior, setAnterior] = useState(valorConfirmado);
  if (anterior !== valorConfirmado) {
    setAnterior(valorConfirmado);
    setTexto(valorConfirmado);
  }

  useEffect(() => {
    if (texto.trim() === valorConfirmado) return;
    const temporizador = setTimeout(() => confirmar(texto.trim()), esperaMs);
    return () => clearTimeout(temporizador);
    // `confirmar` cambia en cada render; solo importa el texto escrito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return [texto, setTexto] as const;
}
