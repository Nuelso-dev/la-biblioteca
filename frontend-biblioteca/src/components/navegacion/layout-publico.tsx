"use client";

import React from "react";
import { HeaderPublico } from "@/components/navegacion/header-publico";
import { PiePagina } from "@/components/pie-pagina/pie-pagina";

interface LayoutPublicoProps {
  children: React.ReactNode;
}

export function LayoutPublico({ children }: LayoutPublicoProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
      {/* Barra superior de navegación editorial */}
      <HeaderPublico />

      {/* Contenedor principal de contenido */}
      <main className="flex-1 w-full flex flex-col">{children}</main>

      {/* Pie de página editorial */}
      <PiePagina />
    </div>
  );
}

