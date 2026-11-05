"use client";

import { useReglasServicio } from "@/hooks/use-reglas-servicio";

export function SeccionComoFunciona() {
  const { diasRetiro, diasPrestamo } = useReglasServicio();
  const PASOS = [
    {
      numero: "01",
      titulo: "Busca y solicita",
      descripcion: "Encuentra el título, elige un ejemplar disponible y solicítalo con tu cuenta. El personal revisa tu solicitud y te avisa.",
    },
    {
      numero: "02",
      titulo: "Retira en la sede",
      descripcion: `Al aprobarse, el ejemplar queda reservado a tu nombre. Tienes ${diasRetiro} para pasar por la sede y llevarte el libro.`,
    },
    {
      numero: "03",
      titulo: "Devuelve a tiempo",
      descripcion: `Cada préstamo dura ${diasPrestamo} y se puede renovar. Si te pasas del vencimiento se genera una multa por cada día de retraso.`,
    },
  ];

  return (
    <section className="border-t border-b border-border bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {PASOS.map((paso) => (
            <div key={paso.numero} className="p-8 sm:p-10 lg:p-12">
              <div className="font-serif text-4xl leading-none text-primary">{paso.numero}</div>
              <h3 className="mt-4 font-serif text-2xl font-normal text-foreground">
                {paso.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {paso.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
