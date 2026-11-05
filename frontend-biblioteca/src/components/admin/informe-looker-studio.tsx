"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Analytics01Icon,
  ArrowRight01Icon,
  RotateLeftIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const LOOKER_STUDIO_EMBED_URL =
  "https://lookerstudio.google.com/embed/reporting/381fa5f6-d275-4440-ac4a-8f16c41cb14a/page/p_9rkabxrj8d";

export const LOOKER_STUDIO_EXTERNAL_URL =
  "https://lookerstudio.google.com/reporting/381fa5f6-d275-4440-ac4a-8f16c41cb14a/page/p_9rkabxrj8d";

interface InformeLookerStudioProps {
  /** Si se muestra dentro del resumen principal, incluye el enlace a la vista dedicada (/administracion/reportes) */
  mostrarEnlaceSeccion?: boolean;
  /** Altura personalizada para el contenedor del iframe */
  alturaClase?: string;
}

export function InformeLookerStudio({
  mostrarEnlaceSeccion = false,
  alturaClase = "h-[520px] sm:h-[640px] lg:h-[720px]",
}: InformeLookerStudioProps) {
  const [cargandoIframe, setCargandoIframe] = useState(true);
  const [versionIframe, setVersionIframe] = useState(0);

  const recargarInforme = () => {
    setCargandoIframe(true);
    setVersionIframe((v) => v + 1);
  };

  return (
    <Card className="border border-border bg-card rounded-none shadow-none">
      <CardHeader className="p-4 sm:p-6 flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4 border-b border-border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon icon={Analytics01Icon} className="size-4 text-primary" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Looker Studio · Analítica en vivo
            </span>
          </div>
          <CardTitle className="font-serif text-xl sm:text-2xl font-normal text-foreground">
            Informe estadístico de la red de bibliotecas
          </CardTitle>
          <CardDescription className="text-xs">
            Visualización interactiva de indicadores, distribución geográfica por sedes y comportamiento del catálogo.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start @2xl:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={recargarInforme}
            className="rounded-none h-8 px-3 text-xs font-semibold gap-1.5 border-border"
            title="Recargar informe"
          >
            <Icon
              icon={RotateLeftIcon}
              className={`size-3.5 ${cargandoIframe ? "animate-spin text-primary" : ""}`}
            />
            <span>Recargar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-none h-8 px-3 text-xs font-semibold gap-1.5 border-border"
          >
            <a
              href={LOOKER_STUDIO_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Abrir en Looker Studio</span>
              <Icon icon={Share01Icon} className="size-3.5" />
            </a>
          </Button>

          {mostrarEnlaceSeccion && (
            <Button
              variant="default"
              size="sm"
              asChild
              className="rounded-none h-8 px-3 text-xs font-semibold gap-1.5"
            >
              <Link href="/administracion/reportes">
                <span>Vista completa</span>
                <Icon icon={ArrowRight01Icon} className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={`relative w-full bg-secondary/40 ${alturaClase}`}>
          {cargandoIframe && (
            <div className="absolute inset-0 z-10 flex flex-col gap-4 p-6 bg-card">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48 rounded-none" />
                <Skeleton className="h-6 w-28 rounded-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full rounded-none" />
                <Skeleton className="h-24 w-full rounded-none" />
                <Skeleton className="h-24 w-full rounded-none" />
              </div>
              <Skeleton className="flex-1 w-full rounded-none" />
            </div>
          )}

          <iframe
            key={versionIframe}
            title="Informe estadístico de LaBiblioteca en Looker Studio"
            src={LOOKER_STUDIO_EMBED_URL}
            onLoad={() => setCargandoIframe(false)}
            className="h-full w-full border-0"
            style={{ border: 0 }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </CardContent>
    </Card>
  );
}
