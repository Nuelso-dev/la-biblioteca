"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { Icon } from "@/components/ui/hugeicon";
import { Book02Icon } from "@hugeicons/core-free-icons";
import { NavEscritorio } from "./nav-escritorio";
import { MenuUsuarioEscritorio } from "./menu-usuario-escritorio";
import { MenuMovil } from "./menu-movil";
import { useNotificacionesNoLeidas } from "@/hooks/use-notificaciones-no-leidas";

export function HeaderPublico() {
  const pathname = usePathname();
  const { usuario, rol, estaAutenticado, cerrarSesion } = useAutenticacion();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const noLeidas = useNotificacionesNoLeidas(estaAutenticado, pathname);

  const iniciales = usuario?.nombre
    ? usuario.nombre.substring(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3 group">
          <Icon
            icon={Book02Icon}
            className="size-6 text-foreground transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-2xl font-normal tracking-[-0.01em] text-foreground">
            LaBiblioteca
          </span>
        </Link>

        <NavEscritorio pathname={pathname} />

        <div className="hidden min-w-0 items-center gap-3 md:flex">
          <MenuUsuarioEscritorio
            estaAutenticado={estaAutenticado}
            usuario={usuario}
            rol={rol}
            iniciales={iniciales}
            cerrarSesion={cerrarSesion}
            noLeidas={noLeidas}
          />
        </div>

        <MenuMovil
          pathname={pathname}
          abierto={menuMovilAbierto}
          setAbierto={setMenuMovilAbierto}
          estaAutenticado={estaAutenticado}
          usuario={usuario}
          rol={rol}
          iniciales={iniciales}
          cerrarSesion={cerrarSesion}
          noLeidas={noLeidas}
        />
      </div>
    </header>
  );
}
