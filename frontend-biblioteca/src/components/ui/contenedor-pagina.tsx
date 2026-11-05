"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ContenedorPaginaProps {
  children: React.ReactNode;
  className?: string;
  maxAnchoClass?: string;
}

export function ContenedorPagina({
  children,
  className,
  maxAnchoClass = "max-w-7xl",
}: ContenedorPaginaProps) {
  return (
    <div className={cn("flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10", maxAnchoClass, className)}>
      {children}
    </div>
  );
}
