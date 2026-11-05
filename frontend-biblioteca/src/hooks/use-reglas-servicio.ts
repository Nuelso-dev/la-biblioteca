"use client";

import { useEffect, useState } from "react";
import { configPublicaService, type ReglasServicio } from "@/services/config.service";

const dinero = (valor: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`;

/** Promesa compartida: varias secciones de una misma página piden las reglas con una sola consulta. */
let consulta: Promise<ReglasServicio> | null = null;

/**
 * Reglas del servicio definidas por la biblioteca (préstamos, plazos y multas), ya redactadas para mostrarlas.
 * Mientras llegan, o si la consulta falla, se usan frases genéricas en lugar de cifras que podrían estar desactualizadas.
 */
export function useReglasServicio() {
  const [reglas, setReglas] = useState<ReglasServicio | null>(null);

  useEffect(() => {
    let activo = true;
    consulta ??= configPublicaService.getReglas().catch((error) => {
      consulta = null;
      throw error;
    });
    consulta
      .then((datos) => {
        if (activo) setReglas(datos);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, []);

  return {
    reglas,
    diasRetiro: reglas ? plural(reglas.diasRetiro, "día", "días") : "unos días",
    diasPrestamo: reglas ? plural(reglas.diasPrestamo, "día", "días") : "el plazo indicado",
    maxPrestamos: reglas ? plural(reglas.maxPrestamos, "préstamo abierto", "préstamos abiertos") : "un número limitado de préstamos",
    tarifa: reglas ? dinero(reglas.tarifaMultaDiaria) : "una tarifa diaria",
  };
}

export { plural };
