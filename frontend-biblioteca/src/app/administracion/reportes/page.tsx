"use client";

import { InformeLookerStudio } from "@/components/admin/informe-looker-studio";

export default function PaginaAdminReportes() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">
            Reportes e informes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tablero interactivo de analítica y métricas operativas de la red de bibliotecas conectado con Looker Studio.
          </p>
        </div>
      </div>

      <InformeLookerStudio
        mostrarEnlaceSeccion={false}
        alturaClase="h-[600px] sm:h-[740px] lg:h-[840px]"
      />
    </div>
  );
}
