import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/hugeicon";
import {
  Book02Icon,
  Menu01Icon,
  DashboardSquare01Icon,
  Settings02Icon,
  Logout01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ENLACES_NAVEGACION, esEnlaceActivo } from "./enlaces-navegacion";
import type { RolUsuario, Usuario } from "@/context/contexto-autenticacion";

interface MenuMovilProps {
  pathname: string;
  abierto: boolean;
  setAbierto: (abierto: boolean) => void;
  estaAutenticado: boolean;
  usuario: Usuario | null;
  rol: RolUsuario;
  iniciales: string;
  cerrarSesion: () => void;
  noLeidas?: number;
}

export function MenuMovil({
  pathname,
  abierto,
  setAbierto,
  estaAutenticado,
  usuario,
  rol,
  iniciales,
  cerrarSesion,
  noLeidas = 0,
}: MenuMovilProps) {
  const cerrar = () => setAbierto(false);

  return (
    <div className="flex md:hidden">
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-none border-border"
            aria-label="Abrir menú de navegación"
          >
            <Icon icon={Menu01Icon} className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[300px] sm:w-[360px] rounded-none border-l border-border bg-background p-6 flex flex-col justify-between"
        >
          <SheetHeader className="text-left border-b border-border pb-4">
            <SheetTitle className="flex items-center gap-2.5 font-serif text-xl font-normal text-foreground">
              <Icon icon={Book02Icon} className="size-5" />
              LaBiblioteca
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 py-6">
            <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Navegación
            </div>
            {ENLACES_NAVEGACION.map((enlace) => {
              const activo = esEnlaceActivo(pathname, enlace.href);

              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  onClick={cerrar}
                  className={`text-base py-1.5 transition-colors ${
                    activo
                      ? "font-serif text-xl font-normal text-primary"
                      : "text-foreground hover:text-primary font-normal"
                  }`}
                >
                  {enlace.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border pt-4">
            {estaAutenticado ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8 rounded-none border border-border">
                    <AvatarFallback className="rounded-none bg-primary text-xs font-bold text-primary-foreground">
                      {iniciales}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {usuario?.nombre}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {usuario?.email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-2">
                  <Link
                    href="/mi-cuenta"
                    onClick={cerrar}
                    className="flex items-center gap-2 py-1.5 text-xs text-foreground hover:text-primary"
                  >
                    <Icon icon={Settings02Icon} className="size-4 text-muted-foreground" />
                    Mi cuenta
                  </Link>
                  <Link
                    href="/mi-cuenta?tab=notificaciones"
                    onClick={cerrar}
                    className="flex items-center justify-between py-1.5 text-xs text-foreground hover:text-primary"
                  >
                    <span className="flex items-center gap-2">
                      <Icon icon={Notification01Icon} className="size-4 text-muted-foreground" />
                      Notificaciones
                    </span>
                    {noLeidas > 0 && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-bold text-primary-foreground">{noLeidas}</span>
                    )}
                  </Link>
                  {(rol === "administrador" || rol === "bibliotecario") && (
                    <Link
                      href="/administracion"
                      onClick={cerrar}
                      className="flex items-center gap-2 py-1.5 text-xs font-semibold text-primary"
                    >
                      <Icon icon={DashboardSquare01Icon} className="size-4" />
                      Panel de administración
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      cerrar();
                      void cerrarSesion();
                    }}
                    className="mt-2 justify-start px-0 text-xs text-destructive hover:bg-transparent hover:text-destructive"
                  >
                    <Icon icon={Logout01Icon} className="mr-2 size-4" />
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Button
                  asChild
                  className="w-full rounded-none bg-primary text-primary-foreground font-semibold h-10"
                >
                  <Link href="/iniciar-sesion" onClick={cerrar}>
                    Iniciar sesión
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
