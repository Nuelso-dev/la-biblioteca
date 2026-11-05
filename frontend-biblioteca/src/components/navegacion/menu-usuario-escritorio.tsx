import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/hugeicon";
import {
  DashboardSquare01Icon,
  Settings02Icon,
  Logout01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RolUsuario, Usuario } from "@/context/contexto-autenticacion";

interface MenuUsuarioEscritorioProps {
  estaAutenticado: boolean;
  usuario: Usuario | null;
  rol: RolUsuario;
  iniciales: string;
  cerrarSesion: () => void;
  noLeidas?: number;
}

export function MenuUsuarioEscritorio({
  estaAutenticado,
  usuario,
  rol,
  iniciales,
  cerrarSesion,
  noLeidas = 0,
}: MenuUsuarioEscritorioProps) {
  if (!estaAutenticado) {
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
        className="h-10 rounded-none border border-foreground bg-transparent px-5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
      >
        <Link href="/iniciar-sesion">Iniciar sesión</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex min-w-0 shrink items-center gap-2.5 h-10 rounded-none border-border bg-background px-3 font-semibold text-foreground hover:bg-accent"
        >
          <Avatar className="size-6 rounded-none border border-border">
            <AvatarFallback className="rounded-none bg-primary text-[10px] font-bold text-primary-foreground">
              {iniciales}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 max-w-[120px] truncate text-xs">
            {usuario?.nombre || "Mi cuenta"}
          </span>
          {noLeidas > 0 && (
            <span aria-label={`${noLeidas} notificaciones sin leer`} className="inline-flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {noLeidas > 99 ? "99+" : noLeidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-none border border-border bg-card p-1 shadow-none"
      >
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground truncate">
              {usuario?.nombre}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {usuario?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {(rol === "administrador" || rol === "bibliotecario") && (
            <DropdownMenuItem asChild className="rounded-none cursor-pointer text-xs font-semibold text-primary">
              <Link href="/administracion" className="flex items-center gap-2">
                <Icon icon={DashboardSquare01Icon} className="size-4" />
                <span>Panel de administración</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild className="rounded-none cursor-pointer text-xs">
            <Link href="/mi-cuenta" className="flex items-center gap-2">
              <Icon icon={Settings02Icon} className="size-4 text-muted-foreground" />
              <span>Mi cuenta</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-none cursor-pointer text-xs">
            <Link href="/mi-cuenta?tab=notificaciones" className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Icon icon={Notification01Icon} className="size-4 text-muted-foreground" />
                Notificaciones
              </span>
              {noLeidas > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-bold text-primary-foreground">{noLeidas}</span>
              )}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={cerrarSesion}
          className="rounded-none cursor-pointer text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Icon icon={Logout01Icon} className="size-4 text-destructive" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
