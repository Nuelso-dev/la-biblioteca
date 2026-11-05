"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface EncabezadoPaginaProps {
  titulo: string;
  subtitulo?: string;
  acciones?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function EncabezadoPagina({
  titulo,
  subtitulo,
  acciones,
  children,
  className,
}: EncabezadoPaginaProps) {
  // El contenedor decide la disposición según el ancho disponible (con o sin sidebar), no según la ventana
  return (
    <div className="@container">
      <div
        className={cn(
          "mb-6 sm:mb-8 border-b border-border pb-5 sm:pb-6 flex flex-col @2xl:flex-row @2xl:items-end justify-between gap-4 sm:gap-6",
          className
        )}
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-foreground tracking-[-0.02em] leading-tight break-words">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {subtitulo}
            </p>
          )}
        </div>

        {(acciones || children) && (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 w-full @2xl:w-auto">
            {acciones}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
