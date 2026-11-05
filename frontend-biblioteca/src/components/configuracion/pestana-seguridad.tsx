"use client";

import { useState } from "react";
import { SquareLock01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAutenticacion } from "@/context/contexto-autenticacion";

const LONGITUD_MINIMA = 8;

export function PestanaSeguridad() {
  const { usuario } = useAutenticacion();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const cambiarContrasena = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setExito(false);

    if (!usuario?.email) {
      setError("No se pudo identificar tu cuenta. Inicia sesión de nuevo.");
      return;
    }
    if (nueva.length < LONGITUD_MINIMA) {
      setError(`La nueva contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
      return;
    }
    if (nueva !== confirmar) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    if (nueva === actual) {
      setError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }

    setGuardando(true);
    try {
      // Se verifica la contraseña actual antes de permitir el cambio
      const { error: errorActual } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: actual,
      });
      if (errorActual) {
        setError("La contraseña actual no es correcta.");
        return;
      }

      const { error: errorCambio } = await supabase.auth.updateUser({ password: nueva });
      if (errorCambio) {
        setError(errorCambio.message || "No se pudo actualizar la contraseña.");
        return;
      }

      setActual("");
      setNueva("");
      setConfirmar("");
      setExito(true);
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card className="border border-border bg-card rounded-none shadow-none">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="font-serif text-2xl font-normal">Contraseña y credenciales</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Cambia la clave de acceso de tu cuenta. Necesitas confirmar tu contraseña actual.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={cambiarContrasena} className="flex flex-col gap-4 max-w-md">
          <div className="flex flex-col gap-2">
            <Label htmlFor="actual" className="text-xs font-semibold text-foreground">Contraseña actual</Label>
            <Input
              id="actual"
              type="password"
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              disabled={guardando}
              required
              className="h-10 text-xs rounded-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nueva" className="text-xs font-semibold text-foreground">Nueva contraseña</Label>
            <Input
              id="nueva"
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              disabled={guardando}
              required
              className="h-10 text-xs rounded-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmar" className="text-xs font-semibold text-foreground">Confirmar nueva contraseña</Label>
            <Input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              disabled={guardando}
              required
              className="h-10 text-xs rounded-none"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-none border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>
          )}
          {exito && (
            <p role="status" className="rounded-none border border-primary/40 bg-primary/5 p-3 text-xs font-semibold text-primary">
              Contraseña actualizada correctamente.
            </p>
          )}

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" size="sm" disabled={guardando} className="gap-2 font-semibold rounded-none">
              <Icon icon={SquareLock01Icon} className="size-4" />
              {guardando ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
