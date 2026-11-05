"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search01Icon, Notification01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";

export function SiteHeader() {
  const pathname = usePathname();

  // Nombre del módulo actual: coincide con el del menú lateral y con el título de cada página
  const MODULOS: [string, string][] = [
    ["/administracion/reportes", "Reportes e informes"],
    ["/administracion/libros", "Libros"],
    ["/administracion/ejemplares", "Ejemplares"],
    ["/administracion/autores", "Autores"],
    ["/administracion/portadas", "Portadas"],
    ["/administracion/categorias", "Categorías"],
    ["/administracion/editoriales", "Editoriales"],
    ["/administracion/sedes", "Sedes"],
    ["/administracion/prestamos", "Solicitudes y préstamos"],
    ["/administracion/multas", "Multas"],
    ["/administracion/usuarios", "Usuarios"],
    ["/administracion/auditoria", "Auditoría"],
    ["/administracion/configuracion", "Configuración"],
  ];
  const obtenerNombreModulo = (path: string) => {
    if (path === "/administracion") return "Panel de control";
    return MODULOS.find(([ruta]) => path.startsWith(ruta))?.[1] ?? "Administración";
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 w-full items-center border-b border-border bg-background/95 backdrop-blur px-3 sm:px-6">
      <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
        {/* Trigger Móvil y Breadcrumb del Panel Admin */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <SidebarTrigger className="rounded-none border border-border size-9 max-md:size-11 shrink-0 md:hidden" />
          
          <Breadcrumb className="truncate">
            <BreadcrumbList className="text-xs truncate">
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink href="/administracion" className="text-muted-foreground hover:text-primary">
                  Panel
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem className="truncate">
                <BreadcrumbPage className="font-serif sm:font-sans font-semibold text-sm sm:text-xs text-foreground truncate">
                  {obtenerNombreModulo(pathname)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Buscador Rápido y Notificaciones */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-48 lg:w-64">
            <Icon icon={Search01Icon} className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar en panel..."
              className="pl-9 h-9 text-xs rounded-none bg-background"
            />
          </div>

          <Button variant="ghost" size="icon" className="size-9 max-md:size-11 rounded-none text-muted-foreground">
            <Icon icon={Notification01Icon} className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
