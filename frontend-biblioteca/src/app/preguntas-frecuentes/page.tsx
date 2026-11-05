import React from "react";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { Badge } from "@/components/ui/badge";
import { SeccionFaqCliente } from "@/app/preguntas-frecuentes/seccion-faq-cliente";

export const metadata = {
  title: "Preguntas frecuentes | LaBiblioteca",
  description:
    "Resuelve tus dudas sobre préstamos de libros físicos, reservas, renovaciones, vigencia y atención en la red de bibliotecas.",
};

export default function PaginaFaq() {
  return (
    <LayoutPublico>
      {/* SECCIÓN HERO PRINCIPAL */}
      <section className="border-b border-border bg-background py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-5 text-center flex flex-col items-center gap-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">
            <span className="h-px w-6 bg-accent-foreground" />
            Centro de Ayuda
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-[-0.02em] text-foreground leading-[1.05] text-balance">
            Preguntas Frecuentes
          </h1>

          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            Respuestas directas a las dudas más comunes sobre la consulta de ejemplares, gestión de reservas, plazos de préstamo y políticas del servicio.
          </p>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <SeccionFaqCliente />
      </div>
    </LayoutPublico>
  );
}

