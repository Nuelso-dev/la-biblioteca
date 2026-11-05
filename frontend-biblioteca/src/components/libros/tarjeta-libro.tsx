"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark02Icon,
  Location01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { ImagenPortadaLibro } from "./imagen-portada-libro";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavoritos } from "@/context/contexto-favoritos";
import { solicitudesService } from "@/services/api";
import { getMensajeError } from "@/lib/errores";
import { resumenSedes, urlDetalleLibro } from "@/lib/libros-utils";

export interface LibroProps {
  id?: string | number;
  id_libro?: string | number;
  id_ejemplar?: string | number;
  slug?: string;

  // Canonical DB fields
  titulo_libro?: string;
  portada_libro?: string | null;
  isbn_libro?: string | null;
  descripcion_libro?: string | null;
  nombre_estado?: string;
  codigo_estado?: string;
  nombre_biblioteca?: string | null;
  numpaginas_libro?: number;

  autor?: string | null;
  categoria?: string | null;
  disponible?: boolean;
  paginas?: number;
  editorial?: string | null;
}

export function TarjetaLibro(props: LibroProps) {
  const router = useRouter();
  const { estaAutenticado, usuario } = useAutenticacion();

  const autor = props.autor || "Autor desconocido";
  const categoria = props.categoria || "General";

  const titulo = props.titulo_libro ?? "Sin título";
  const portadaSrc = props.portada_libro;
  const sedeReal = resumenSedes(props.nombre_biblioteca) ?? "Sede principal";
  const estadoTexto =
    props.nombre_estado ??
    props.codigo_estado ??
    (props.disponible !== false ? "Disponible" : "En préstamo");
  const estaDisponible =
    estadoTexto.toUpperCase().includes("DISPONIBLE") ||
    estadoTexto.toLowerCase().includes("disponible") ||
    props.disponible === true;

  // El detalle se resuelve por id entero, porque el backend valida /libros/:id como entero
  const libroId = props.id_libro ?? props.id ?? "";

  const { esFavorito: marcadoComoFavorito, alternar } = useFavoritos();
  const esFavorito = marcadoComoFavorito(libroId);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState<string | null>(null);

  // Guardar o quitar el libro de los favoritos de la cuenta
  const manejarGuardar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!estaAutenticado) {
      router.push(`/iniciar-sesion?redirect=${encodeURIComponent("/libros")}`);
      return;
    }

    setGuardandoFavorito(true);
    setErrorSolicitud(null);
    try {
      await alternar(libroId);
    } catch (err: unknown) {
      setErrorSolicitud(getMensajeError(err, "No se pudo actualizar tus favoritos."));
    } finally {
      setGuardandoFavorito(false);
    }
  };

  // Manejar clic en Solicitar préstamo
  const manejarSolicitud = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!estaAutenticado) {
      router.push(`/iniciar-sesion?redirect=${encodeURIComponent('/libros')}&accion=solicitar&libroId=${encodeURIComponent(String(libroId))}&titulo=${encodeURIComponent(titulo)}`);
      return;
    }

    if (!usuario?.id || !props.id_ejemplar) {
      setErrorSolicitud("No hay un ejemplar disponible para solicitar en este momento.");
      return;
    }

    setSolicitando(true);
    setErrorSolicitud(null);
    try {
      await solicitudesService.crear({ id_ejemplar: props.id_ejemplar });
      router.push("/mi-cuenta?tab=prestamos");
    } catch (err: unknown) {
      setErrorSolicitud(getMensajeError(err, "No se pudo enviar la solicitud."));
    } finally {
      setSolicitando(false);
    }
  };

  return (
    <Card className="group flex flex-col justify-between overflow-hidden border border-border bg-card hover:border-primary transition-colors duration-200 rounded-none shadow-none">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Contenedor Imagen Portada */}
        <div className="relative aspect-[3/4] w-full rounded-none overflow-hidden bg-secondary border border-border">
          <ImagenPortadaLibro
            libro={props}
            alt={titulo}
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
          />
          
          {/* Badge Estado Disponibilidad Real */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {estaDisponible ? (
              <span className="inline-flex items-center gap-1.5 bg-background/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-foreground uppercase border border-border">
                <span className="size-1.5 rounded-full bg-success" /> {estadoTexto}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-background/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase border border-border">
                <span className="size-1.5 rounded-full bg-warning" /> {estadoTexto}
              </span>
            )}
          </div>

          {/* Botón Guardar Localmente en Dispositivo */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => void manejarGuardar(e)}
            disabled={guardandoFavorito}
            title={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-label={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
            className={`absolute top-2.5 right-2.5 z-10 rounded-none border border-border transition-colors size-7 ${
              esFavorito
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-background/90 text-muted-foreground hover:text-foreground hover:bg-background"
            }`}
          >
            <Icon icon={Bookmark02Icon} className="size-3.5" />
          </Button>
        </div>

        {/* Información Bibliográfica Real */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-accent-foreground tracking-wider uppercase truncate max-w-[150px]">
              {categoria}
            </span>
          </div>

          <h3 className="font-serif text-lg font-normal text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
            {titulo}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-1">
            {autor}
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-1">
            <Icon icon={Location01Icon} className="size-3 shrink-0" />
            <span className="truncate">{sedeReal}</span>
          </div>
        </div>
      </CardContent>

      {/* Botones de Acción Funcionales */}
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold rounded-none border-border hover:bg-muted"
          >
            <Link href={urlDetalleLibro(libroId, titulo)}>Detalle</Link>
          </Button>
          <Button
            size="sm"
            onClick={(e) => void manejarSolicitud(e)}
            disabled={!estaDisponible || !props.id_ejemplar || solicitando}
            className="w-full text-xs font-semibold rounded-none"
          >
            {solicitando ? "..." : "Solicitar"}
          </Button>
        </div>
        {errorSolicitud && (
          <p className="text-[11px] text-destructive leading-snug">{errorSolicitud}</p>
        )}
      </CardFooter>
    </Card>
  );
}

export function TarjetaLibroSkeleton() {
  return (
    <Card className="flex flex-col justify-between overflow-hidden border-border rounded-none bg-card">
      <CardContent className="p-4 flex flex-col gap-3">
        <Skeleton className="aspect-[3/4] w-full rounded-none" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded-none" />
            <Skeleton className="h-3 w-8 rounded-none" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-none" />
          <Skeleton className="h-3 w-1/2 rounded-none" />
          <Skeleton className="h-3 w-2/3 rounded-none" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Skeleton className="h-8 w-full rounded-none" />
        <Skeleton className="h-8 w-full rounded-none" />
      </CardFooter>
    </Card>
  );
}

