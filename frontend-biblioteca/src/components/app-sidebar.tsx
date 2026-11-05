"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Analytics01Icon,
  Book02Icon,
  UserGroupIcon,
  Building01Icon,
  DashboardSquare01Icon,
  AlertCircleIcon,
  UserIcon,
  Settings02Icon,
  Logout01Icon,
  Share01Icon,
  NewsIcon,
  Layers01Icon,
  Tag01Icon,
  SecurityCheckIcon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { multasService, solicitudesService } from "@/services/api";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { usuario, rol, cerrarSesion } = useAutenticacion();
  const esAdmin = rol === "administrador";
  const [totalMultas, setTotalMultas] = React.useState<number>(0);
  const [totalSolicitudes, setTotalSolicitudes] = React.useState<number>(0);

  React.useEffect(() => {
    let activo = true;
    const fetchMultas = async () => {
      try {
        const resumen = await multasService.getResumen();
        if (activo) setTotalMultas(resumen.pendientes);
      } catch {
        if (activo) setTotalMultas(0);
      }
    };
    const fetchSolicitudes = async () => {
      try {
        const res = await solicitudesService.getPagina({ vista: "porAtender", limit: 1 });
        if (activo) setTotalSolicitudes(res.total);
      } catch {
        if (activo) setTotalSolicitudes(0);
      }
    };
    void fetchMultas();
    void fetchSolicitudes();
    return () => {
      activo = false;
    };
  }, []);

  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  const itemDashboard = {
    href: "/administracion",
    label: "Panel de control",
    icon: DashboardSquare01Icon,
  };

  const itemReportes = {
    href: "/administracion/reportes",
    label: "Reportes e informes",
    icon: Analytics01Icon,
  };

  const itemsAcervo = [
    { href: "/administracion/libros", label: "Libros", icon: Book02Icon },
    { href: "/administracion/ejemplares", label: "Ejemplares", icon: Layers01Icon },
    { href: "/administracion/autores", label: "Autores", icon: UserIcon },
    { href: "/administracion/portadas", label: "Portadas", icon: Image01Icon },
    { href: "/administracion/categorias", label: "Categorías", icon: Tag01Icon },
    { href: "/administracion/editoriales", label: "Editoriales", icon: Tag01Icon },
    { href: "/administracion/sedes", label: "Sedes", icon: Building01Icon },
  ];

  const itemsGestion: { href: string; label: string; icon: typeof NewsIcon; badge?: number }[] = [
    { href: "/administracion/prestamos", label: "Solicitudes y préstamos", icon: NewsIcon, badge: totalSolicitudes },
    { href: "/administracion/multas", label: "Multas", icon: AlertCircleIcon, badge: totalMultas },
    ...(esAdmin
      ? [
          { href: "/administracion/usuarios", label: "Usuarios", icon: UserGroupIcon },
          { href: "/administracion/auditoria", label: "Auditoría", icon: SecurityCheckIcon },
          { href: "/administracion/configuracion", label: "Configuración", icon: Settings02Icon },
        ]
      : []),
  ];

  const esDashboardActivo = pathname === "/administracion";
  const esReportesActivo = pathname.startsWith("/administracion/reportes");

  return (
    <Sidebar
      className="w-58 border-r border-ink-soft bg-ink text-paper"
      {...props}
    >
      {/* Header del Sidebar */}
      <SidebarHeader className="p-0 border-b border-ink-soft">
        <Link
          href="/administracion"
          className="flex items-center gap-3 px-4 py-4 text-paper transition-colors hover:bg-ink-hover group"
        >
          <div className="flex size-8 items-center justify-center bg-rust text-paper rounded-none shrink-0 group-hover:bg-rust-hover transition-colors">
            <Icon icon={Book02Icon} className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-[17px] font-normal tracking-tight text-paper leading-none">
              LaBiblioteca
            </span>
            <span className="text-[10px] font-semibold tracking-[0.12em] text-stone uppercase mt-1">
              Administración
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Contenido Organizado */}
      <SidebarContent className="px-3 py-3 flex flex-col gap-4 overflow-y-auto">
        {/* Enlace Directo a Dashboard y Reportes */}
        <div className="flex flex-col gap-1">
          <Link
            href={itemDashboard.href}
            className={`flex h-9 max-md:h-11 items-center gap-2.5 px-3 text-xs transition-colors rounded-none ${
              esDashboardActivo
                ? "bg-rust text-paper font-semibold"
                : "text-paper-dim hover:bg-ink-raised hover:text-paper font-medium"
            }`}
          >
            <Icon
              icon={itemDashboard.icon}
              className={`size-4 shrink-0 ${esDashboardActivo ? "text-paper" : "text-stone"}`}
            />
            <span>{itemDashboard.label}</span>
          </Link>

          <Link
            href={itemReportes.href}
            className={`flex h-9 max-md:h-11 items-center gap-2.5 px-3 text-xs transition-colors rounded-none ${
              esReportesActivo
                ? "bg-rust text-paper font-semibold"
                : "text-paper-dim hover:bg-ink-raised hover:text-paper font-medium"
            }`}
          >
            <Icon
              icon={itemReportes.icon}
              className={`size-4 shrink-0 ${esReportesActivo ? "text-paper" : "text-stone"}`}
            />
            <span>{itemReportes.label}</span>
          </Link>
        </div>

        {/* Grupo ACERVO */}
        <div className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-stone-dim uppercase">
            Acervo
          </div>
          {itemsAcervo.map((item) => {
            const activo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-9 max-md:h-11 items-center gap-2.5 px-3 text-xs transition-colors rounded-none ${
                  activo
                    ? "bg-rust text-paper font-semibold"
                    : "text-paper-dim hover:bg-ink-raised hover:text-paper font-medium"
                }`}
              >
                <Icon
                  icon={item.icon}
                  className={`size-4 shrink-0 ${activo ? "text-paper" : "text-stone"}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Grupo GESTIÓN & CIRCULACIÓN */}
        <div className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-stone-dim uppercase">
            Gestión
          </div>
          {itemsGestion.map((item) => {
            const activo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-9 max-md:h-11 items-center justify-between px-3 text-xs transition-colors rounded-none ${
                  activo
                    ? "bg-rust text-paper font-semibold"
                    : "text-paper-dim hover:bg-ink-raised hover:text-paper font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    icon={item.icon}
                    className={`size-4 shrink-0 ${activo ? "text-paper" : "text-stone"}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`inline-flex h-4.5 min-w-[18px] items-center justify-center px-1 text-[10px] font-bold ${
                    activo ? "bg-paper text-rust" : "bg-rust text-paper"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Acceso Rápido al Portal Público */}
        <div className="pt-2 border-t border-ink-soft/80">
          <Link
            href="/"
            className="flex h-8 max-md:h-11 items-center gap-2.5 px-3 text-xs text-stone hover:text-paper hover:bg-ink-raised transition-colors rounded-none"
          >
            <Icon icon={Share01Icon} className="size-3.5 shrink-0" />
            <span>Ver portal público</span>
          </Link>
        </div>
      </SidebarContent>

      {/* Footer del Sidebar con perfil de bibliotecario */}
      <SidebarFooter className="p-0 border-t border-ink-soft mt-auto">
        <div className="flex items-center justify-between p-3 bg-ink-deep">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex size-7 shrink-0 items-center justify-center bg-paper text-xs font-bold text-ink">
              {iniciales}
            </span>
            <div className="flex flex-col min-w-0 text-left">
              <span className="truncate text-xs font-semibold text-paper">
                {usuario?.nombre || "Administrador"}
              </span>
              <span className="text-[10px] text-stone truncate">
                {esAdmin ? "Administrador" : "Bibliotecario"}
              </span>
            </div>
          </div>

          <Button variant="unstyled" size={null}
            onClick={() => void cerrarSesion()}
            title="Cerrar sesión"
            type="button"
            className="p-1 max-md:p-3.5 text-stone hover:text-rust hover:bg-ink-raised transition-colors cursor-pointer"
          >
            <Icon icon={Logout01Icon} className="size-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
