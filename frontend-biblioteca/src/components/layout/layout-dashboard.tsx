"use client";

import React from "react";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { ContenedorPagina } from "@/components/ui/contenedor-pagina";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { cn } from "@/lib/utils";

interface LayoutDashboardProps {
  titulo: string;
  subtitulo?: string;
  bannerPromocional?: React.ReactNode;
  metricasHeader?: React.ReactNode;
  accionesHeader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LayoutDashboard({
  titulo,
  subtitulo,
  bannerPromocional,
  metricasHeader,
  accionesHeader,
  children,
  className,
}: LayoutDashboardProps) {
  return (
    <LayoutPublico>
      <ContenedorPagina>
        {/* Encabezado Principal */}
        <EncabezadoPagina
          titulo={titulo}
          subtitulo={subtitulo}
          acciones={accionesHeader}
        />

        {/* Banner / Alertas de Notificación */}
        {bannerPromocional && <div className="mb-6">{bannerPromocional}</div>}

        {/* Rejilla de Métricas Rápidas */}
        {metricasHeader && <div className="mb-8">{metricasHeader}</div>}

        {/* Área Principal de Contenido del Panel */}
        <div className={cn("flex flex-col gap-8", className)}>
          {children}
        </div>
      </ContenedorPagina>
    </LayoutPublico>
  );
}
