"use client";

import { useEffect, useState } from "react";
import { SquareLock01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAutenticacion, type Usuario } from "@/context/contexto-autenticacion";
import { usuariosService } from "@/services/usuarios.service";
import { getMensajeError } from "@/lib/errores";

interface PestanaPerfilProps {
  usuario: Usuario | null;
}

const ETIQUETA_ROL = {
  administrador: "Administrador",
  bibliotecario: "Bibliotecario",
  lector: "Lector",
  invitado: "Invitado",
} as const;

export function PestanaPerfil({ usuario }: PestanaPerfilProps) {
  const { refrescarUsuario } = useAutenticacion();
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    let cancelado = false;
    usuariosService
      .getMiPerfil()
      .then((perfil) => {
        if (cancelado) return;
        setNombre(perfil.nombrecompleto_usuario ?? "");
        setDocumento(perfil.documento_usuario ?? "");
        setTelefono(perfil.telefono_usuario ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(getMensajeError(err, "No se pudo cargar tu perfil."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const guardar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      await usuariosService.updateMiPerfil({
        nombre: nombre.trim(),
        documento: documento.trim() || undefined,
        telefono: telefono.trim() || undefined,
      });
      await refrescarUsuario();
      setExito(true);
      setTimeout(() => setExito(false), 4000);
    } catch (err) {
      setError(getMensajeError(err, "No se pudo guardar tu perfil."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card className="border border-border bg-card rounded-none shadow-none">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-serif text-2xl font-normal">Información personal</CardTitle>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold rounded-none">
            {ETIQUETA_ROL[usuario?.rol ?? "invitado"]}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Actualiza tu nombre, documento y teléfono. El correo y el rol los administra la biblioteca.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={guardar} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre" className="text-xs font-semibold text-foreground">Nombre completo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={cargando || guardando}
                className="h-10 text-xs rounded-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="correo" className="text-xs font-semibold text-foreground">Correo electrónico</Label>
              <div className="relative">
                <Input
                  id="correo"
                  value={usuario?.email || ""}
                  disabled
                  className="h-10 text-xs rounded-none bg-muted text-muted-foreground cursor-not-allowed pr-8"
                />
                <Icon icon={SquareLock01Icon} className="size-3.5 absolute right-3 top-3 text-muted-foreground/60" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="documento" className="text-xs font-semibold text-foreground">Documento de identidad</Label>
              <Input
                id="documento"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                disabled={cargando || guardando}
                className="h-10 text-xs rounded-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="telefono" className="text-xs font-semibold text-foreground">Teléfono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={cargando || guardando}
                className="h-10 text-xs rounded-none font-mono"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-none border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>
          )}
          {exito && (
            <p role="status" className="rounded-none border border-primary/40 bg-primary/5 p-3 text-xs font-semibold text-primary">Perfil actualizado.</p>
          )}

          <div className="pt-4 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icon icon={InformationCircleIcon} className="size-3.5" /> ID de usuario:{" "}
              <code className="font-mono text-[11px] text-foreground font-semibold">{usuario?.id}</code>
            </span>
            <Button type="submit" disabled={cargando || guardando} className="rounded-none h-10 px-6 text-xs font-semibold">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
