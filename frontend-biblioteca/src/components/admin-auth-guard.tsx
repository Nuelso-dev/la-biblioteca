"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAutenticacion } from "@/context/contexto-autenticacion";

/** Secciones que el backend reserva al rol Administrador */
const RUTAS_SOLO_ADMINISTRADOR = ["/administracion/usuarios", "/administracion/auditoria", "/administracion/configuracion"];

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { rol, esPersonal, cargando } = useAutenticacion();

  const requiereAdministrador = RUTAS_SOLO_ADMINISTRADOR.some((ruta) => pathname.startsWith(ruta));
  const sinAcceso = !esPersonal || (requiereAdministrador && rol !== "administrador");

  useEffect(() => {
    if (cargando || !sinAcceso) return;
    router.replace(esPersonal ? "/administracion" : "/");
  }, [cargando, sinAcceso, esPersonal, router]);

  if (cargando) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-muted-foreground gap-2">
        <span className="text-xs font-semibold tracking-wide animate-pulse">Verificando permisos...</span>
      </div>
    );
  }

  if (sinAcceso) return null;
  return <>{children}</>;
}
