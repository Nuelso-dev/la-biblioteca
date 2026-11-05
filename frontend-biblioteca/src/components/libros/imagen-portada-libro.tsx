"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Book02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { obtenerImagenPortada } from "@/lib/libros-utils";

interface ImagenPortadaLibroProps {
  libro?: {
    portada_libro?: string | null;
    portada?: string | null;
    imagenPortada?: string | null;
    titulo_libro?: string | null;
    titulo?: string | null;
  };
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  aspectRatioClass?: string;
}

export function ImagenPortadaLibro({
  libro,
  src,
  alt,
  className = "w-full h-full object-cover",
  fill,
  sizes,
}: ImagenPortadaLibroProps) {
  const urlInicial = src ?? (libro ? obtenerImagenPortada(libro) : null);
  const [srcFallida, setSrcFallida] = useState<string | null>(null);
  const errorCarga = !urlInicial || srcFallida === urlInicial;

  if (errorCarga) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted text-muted-foreground border border-border/40 select-none text-center rounded-inherit">
        <Icon icon={Book02Icon} className="size-8 text-muted-foreground/50 mb-1" />
        <span className="text-[11px] font-semibold text-muted-foreground/80">Sin imagen</span>
        {(libro?.titulo_libro ?? libro?.titulo) && (
          <span className="text-[10px] text-muted-foreground/60 line-clamp-2 mt-1 px-2 font-serif">
            {libro?.titulo_libro ?? libro?.titulo}
          </span>
        )}
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={urlInicial}
        alt={alt}
        fill={fill}
        sizes={sizes}
        unoptimized
        className={className}
        onError={() => setSrcFallida(urlInicial)}
      />
    );
  }

  return (
    <Image
      src={urlInicial}
      alt={alt}
      width={300}
      height={400}
      unoptimized
      className={className}
      onError={() => setSrcFallida(urlInicial)}
    />
  );
}

