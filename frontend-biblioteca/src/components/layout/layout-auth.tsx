import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";

/** Marco común de las pantallas de acceso (tarjeta centrada con enlace para volver al inicio). */
export function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon icon={ArrowLeft01Icon} className="size-3.5" /> Volver al inicio
        </Link>
      </div>

      <div className="w-full max-w-sm sm:max-w-md bg-card border border-border rounded-none p-6 sm:p-8 relative z-10">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs font-medium text-muted-foreground">
              <span>Cargando...</span>
            </div>
          }
        >
          {children}
        </Suspense>
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center relative z-10">
        © 2026 LaBiblioteca · Red pública de lectura
      </p>
    </div>
  );
}
