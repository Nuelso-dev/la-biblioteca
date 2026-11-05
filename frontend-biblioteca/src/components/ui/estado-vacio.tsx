"use client";

import React from "react";
import Link from "next/link";
import {
  Search01Icon,
  Book02Icon,
  Notification01Icon,
  InboxIcon,

  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EstadoVacioProps {
  tipo?: "busqueda" | "prestamos" | "notificaciones" | "general" | "favoritos";
  titulo?: string;
  descripcion?: string;
  textoBoton?: string;
  enlaceBoton?: string;
  onAccion?: () => void;
  className?: string;
}

export function EstadoVacio({
  tipo = "busqueda",
  titulo,
  descripcion,
  textoBoton,
  enlaceBoton = "/libros",
  onAccion,
  className,
}: EstadoVacioProps) {
  const configs = {
    busqueda: {
      icono: <Icon icon={Search01Icon} className="size-8 text-primary" />,
      titulo: titulo || "No encontramos resultados para tu búsqueda",
      descripcion: descripcion || "Prueba con otra búsqueda o revisa la ortografía.",
      textoBoton: textoBoton || "Explorar el catálogo",
    },
    prestamos: {
      icono: <Icon icon={Book02Icon} className="size-8 text-primary" />,
      titulo: titulo || "Tu lista de préstamos está vacía",
      descripcion: descripcion || "Aún no has solicitado libros. Explora el catálogo y haz tu primera solicitud.",
      textoBoton: textoBoton || "Buscar libros disponibles",
    },
    favoritos: {
      icono: <Icon icon={Book02Icon} className="size-8 text-primary" />,
      titulo: titulo || "Aún no has guardado libros",
      descripcion: descripcion || "Pulsa el marcador de cualquier libro para guardarlo en tus favoritos.",
      textoBoton: textoBoton || "Explorar catálogo",
    },
    notificaciones: {
      icono: <Icon icon={Notification01Icon} className="size-8 text-primary" />,
      titulo: titulo || "Estás al día con tus notificaciones",
      descripcion: descripcion || "No tienes notificaciones pendientes.",
      textoBoton: textoBoton || "Volver al inicio",
    },
    general: {
      icono: <Icon icon={InboxIcon} className="size-8 text-primary" />,
      titulo: titulo || "Aún no hay registros",
      descripcion: descripcion || "Cuando haya información, aparecerá aquí.",
      textoBoton: textoBoton || "Explorar el catálogo",
    },
  };

  const configActual = configs[tipo] || configs.general;

  return (
    <div className={`p-6 sm:p-8 text-center max-w-md mx-auto flex flex-col items-center ${className || ""}`}>
      <div className="size-12 border border-border bg-secondary flex items-center justify-center mb-4 text-primary">
        {configActual.icono}
      </div>

      <h3 className="font-serif text-xl font-normal text-foreground mb-1.5">
        {configActual.titulo}
      </h3>

      <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-sm">
        {configActual.descripcion}
      </p>

      {onAccion ? (
        <Button
          onClick={onAccion}
          className="rounded-none h-9 px-5 text-xs font-semibold gap-2"
        >
          {configActual.textoBoton}
          <Icon icon={ArrowRight01Icon} className="size-3.5" />
        </Button>
      ) : (
        <Button
          asChild
          className="rounded-none h-9 px-5 text-xs font-semibold gap-2"
        >
          <Link href={enlaceBoton} className="flex items-center gap-2">
            {configActual.textoBoton}
            <Icon icon={ArrowRight01Icon} className="size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}

