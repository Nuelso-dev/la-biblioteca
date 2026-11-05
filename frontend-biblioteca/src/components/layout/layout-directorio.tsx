"use client";

import React from "react";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { ContenedorPagina } from "@/components/ui/contenedor-pagina";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { cn } from "@/lib/utils";

interface LayoutDirectorioProps {
  titulo: string;
  subtitulo?: string;
  buscador?: React.ReactNode;
  children: React.ReactNode;
  columnasClass?: string;
  className?: string;
}

export function LayoutDirectorio({
  titulo,
  subtitulo,
  buscador,
  children,
  className,
}: LayoutDirectorioProps) {
  return (
    <LayoutPublico>
      <ContenedorPagina>
        {/* Encabezado Unificado con Buscador */}
        <EncabezadoPagina
          titulo={titulo}
          subtitulo={subtitulo}
          acciones={buscador}
        />

        {/* Contenido del Directorio */}
        <div className={cn("w-full flex flex-col gap-6", className)}>
          {children}
        </div>
      </ContenedorPagina>
    </LayoutPublico>
  );
}
