"use client";

import { useEffect, useState } from "react";
import { notificacionesService } from "@/services/notificaciones.service";

const INTERVALO_MS = 60_000;

/**
 * Cantidad de notificaciones sin leer del usuario autenticado.
 * Se refresca al cambiar de página (`clave`) y cada minuto.
 */
export function useNotificacionesNoLeidas(estaAutenticado: boolean, clave: string): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!estaAutenticado) return;
    let activo = true;

    const consultar = () => {
      notificacionesService
        .contarNoLeidas()
        .then((cantidad) => {
          if (activo) setTotal(cantidad);
        })
        .catch(() => {
          if (activo) setTotal(0);
        });
    };

    const inicial = setTimeout(consultar, 0);
    const intervalo = setInterval(consultar, INTERVALO_MS);
    return () => {
      activo = false;
      clearTimeout(inicial);
      clearInterval(intervalo);
    };
  }, [estaAutenticado, clave]);

  return estaAutenticado ? total : 0;
}
