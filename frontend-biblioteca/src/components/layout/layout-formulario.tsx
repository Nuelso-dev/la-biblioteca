"use client";

import React from "react";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { ContenedorPagina } from "@/components/ui/contenedor-pagina";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { cn } from "@/lib/utils";

interface LayoutFormularioProps {
  titulo: string;
  subtitulo?: string;
  bannerNotificacion?: React.ReactNode;
  children: React.ReactNode;
  maxAnchoClass?: string;
  className?: string;
}

export function LayoutFormulario({
  titulo,
  subtitulo,
  bannerNotificacion,
  children,
  maxAnchoClass = "max-w-7xl",
  className,
}: LayoutFormularioProps) {
  return (
    <LayoutPublico>
      <ContenedorPagina maxAnchoClass={maxAnchoClass}>
        {/* Banner de Notificación */}
        {bannerNotificacion && <div className="mb-6">{bannerNotificacion}</div>}

        {/* Encabezado Estandarizado */}
        <EncabezadoPagina
          titulo={titulo}
          subtitulo={subtitulo}
        />

        {/* Cuerpo del Formulario / Pestañas de Ajustes */}
        <div className={cn("flex flex-col gap-8", className)}>
          {children}
        </div>
      </ContenedorPagina>
    </LayoutPublico>
  );
}
