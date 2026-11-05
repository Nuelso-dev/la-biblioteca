"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutFormulario } from "@/components/layout/layout-formulario";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User02Icon,
  Notification01Icon,
  SquareLock01Icon,
  Bookmark02Icon,
  Book02Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { PestanaPerfil } from "@/components/configuracion/pestana-perfil";
import { PestanaNotificaciones } from "@/components/configuracion/pestana-notificaciones";
import { PestanaSeguridad } from "@/components/configuracion/pestana-seguridad";
import { PestanaFavoritos } from "@/components/configuracion/pestana-favoritos";
import { PestanaPrestamos } from "@/components/configuracion/pestana-prestamos";
import { PestanaMultas } from "@/components/configuracion/pestana-multas";

const TABS_VALIDAS = ["perfil", "favoritos", "prestamos", "multas", "notificaciones", "seguridad"] as const;
type TabValida = (typeof TABS_VALIDAS)[number];

function ContenidoConfiguracion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario, estaAutenticado, cargando: cargandoAuth } = useAutenticacion();

  const tabParam = searchParams.get("tab");
  const tabActiva: TabValida = TABS_VALIDAS.includes(tabParam as TabValida) ? (tabParam as TabValida) : "perfil";

  const cambiarTab = (valor: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === "perfil") {
      params.delete("tab");
    } else {
      params.set("tab", valor);
    }
    const query = params.toString();
    router.replace(query ? `/mi-cuenta?${query}` : "/mi-cuenta", { scroll: false });
  };

  if (cargandoAuth) {
    return (
      <LayoutFormulario
        titulo="Mi cuenta"
        subtitulo="Cargando información del lector..."
      >
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Card className="p-6 flex flex-col gap-4 shadow-2xs border-border bg-card">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      </LayoutFormulario>
    );
  }

  if (!estaAutenticado) {
    return (
      <LayoutFormulario
        titulo="Mi cuenta"
        subtitulo="Perfil, favoritos, préstamos y multas."
      >
        <EstadoVacio
          tipo="general"
          titulo="Acceso restringido"
          descripcion="Debes iniciar sesión con tu cuenta de lector para acceder a tu perfil, favoritos y préstamos."
          textoBoton="Iniciar sesión"
          enlaceBoton="/iniciar-sesion"
        />
      </LayoutFormulario>
    );
  }

  return (
    <LayoutFormulario
      titulo="Mi cuenta"
      subtitulo="Perfil, favoritos, préstamos y notificaciones de la biblioteca."
    >
      <Tabs value={tabActiva} onValueChange={cambiarTab} className="flex flex-col md:flex-row! gap-6 md:gap-8 items-stretch md:items-start w-full">
        <TabsList className="h-auto group-data-horizontal/tabs:h-auto w-full md:w-56 shrink-0 bg-card border border-border p-1.5 gap-1 flex flex-row md:flex-col justify-start overflow-x-auto scrollbar-none">
          <TabsTrigger value="perfil" className="justify-start gap-2 text-xs font-semibold h-9 shrink-0 md:w-full">
            <Icon icon={User02Icon} className="size-4" /> Mi perfil
          </TabsTrigger>
          <TabsTrigger value="favoritos" className="justify-start gap-2 text-xs font-semibold h-9 shrink-0 md:w-full">
            <Icon icon={Bookmark02Icon} className="size-4" /> Favoritos
          </TabsTrigger>
          <TabsTrigger value="prestamos" className="justify-start gap-2 text-xs font-semibold h-9 shrink-0 md:w-full">
            <Icon icon={Book02Icon} className="size-4" /> Mis préstamos
          </TabsTrigger>
          <TabsTrigger value="multas" className="justify-start gap-2 text-xs font-semibold h-9 shrink-0 md:w-full">
            <Icon icon={Invoice01Icon} className="size-4" /> Mis multas
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="justify-start gap-2 text-xs font-semibold h-9 shrink-0 md:w-full">
            <Icon icon={Notification01Icon} className="size-4" /> Notificaciones
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="justify-start gap-2 text-xs font-semibold h-9 shrink-0 md:w-full">
            <Icon icon={SquareLock01Icon} className="size-4" /> Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="min-w-0 flex-1 w-full">
          <PestanaPerfil usuario={usuario} />
        </TabsContent>

        <TabsContent value="favoritos" className="min-w-0 flex-1 w-full">
          <PestanaFavoritos />
        </TabsContent>

        <TabsContent value="prestamos" className="min-w-0 flex-1 w-full">
          <PestanaPrestamos />
        </TabsContent>

        <TabsContent value="multas" className="min-w-0 flex-1 w-full">
          <PestanaMultas />
        </TabsContent>

        <TabsContent value="notificaciones" className="min-w-0 flex-1 w-full flex flex-col gap-6">
          <PestanaNotificaciones />
        </TabsContent>

        <TabsContent value="seguridad" className="min-w-0 flex-1 w-full">
          <PestanaSeguridad />
        </TabsContent>
      </Tabs>
    </LayoutFormulario>
  );
}

export default function PaginaConfiguracion() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-24">
        <Icon icon={Book02Icon} className="size-8 animate-spin text-primary" />
      </div>
    }>
      <ContenidoConfiguracion />
    </Suspense>
  );
}
