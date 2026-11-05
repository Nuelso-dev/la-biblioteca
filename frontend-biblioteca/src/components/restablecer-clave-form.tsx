"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book02Icon, AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { supabase } from "@/lib/supabase";

const LONGITUD_MINIMA = 8;
/** Tiempo máximo esperando a que Supabase procese el enlace del correo */
const ESPERA_ENLACE_MS = 4000;

type EstadoEnlace = "verificando" | "valido" | "invalido";

export function RestablecerClaveForm() {
  const router = useRouter();
  const [enlace, setEnlace] = useState<EstadoEnlace>("verificando");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  // El enlace del correo trae un token en la URL; supabase-js lo convierte en sesión de recuperación
  useEffect(() => {
    let activo = true;

    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (activo && (evento === "PASSWORD_RECOVERY" || (evento === "SIGNED_IN" && sesion))) {
        setEnlace("valido");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (activo && session) setEnlace("valido");
    });

    const limite = setTimeout(() => {
      if (activo) setEnlace((actual) => (actual === "verificando" ? "invalido" : actual));
    }, ESPERA_ENLACE_MS);

    return () => {
      activo = false;
      clearTimeout(limite);
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nueva.length < LONGITUD_MINIMA) {
      setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    try {
      const { error: errorSupabase } = await supabase.auth.updateUser({ password: nueva });
      if (errorSupabase) {
        setError(
          /same|different from the old/i.test(errorSupabase.message)
            ? "La nueva contraseña debe ser distinta a la anterior."
            : errorSupabase.message || "No se pudo actualizar la contraseña."
        );
        return;
      }

      setListo(true);
      // Cierra la sesión de recuperación para que el usuario entre con su clave nueva
      await supabase.auth.signOut({ scope: "local" });
      setTimeout(() => router.push("/iniciar-sesion"), 2000);
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex flex-row items-center justify-center gap-2.5 font-medium">
          <div className="flex size-9 items-center justify-center rounded-none bg-primary text-primary-foreground">
            <Icon icon={Book02Icon} className="size-4" />
          </div>
          <span className="font-serif text-2xl font-normal text-foreground">LaBiblioteca</span>
        </div>
        <h1 className="font-serif text-2xl font-normal tracking-[-0.02em] text-foreground mt-1">Nueva contraseña</h1>
      </div>

      {listo ? (
        <div role="status" className="p-3.5 rounded-none bg-secondary border border-border text-foreground text-xs flex items-center gap-2 font-medium">
          <Icon icon={CheckmarkCircle02Icon} className="size-4 shrink-0 text-primary" />
          <span>Contraseña actualizada. Te llevamos al inicio de sesión...</span>
        </div>
      ) : enlace === "verificando" ? (
        <p className="text-center text-xs text-muted-foreground">Verificando el enlace...</p>
      ) : enlace === "invalido" ? (
        <div className="flex flex-col gap-4 text-center">
          <div role="alert" className="p-3 rounded-none bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            El enlace no es válido o ya venció. Solicita uno nuevo.
          </div>
          <Button asChild className="w-full h-10 font-semibold rounded-none">
            <Link href="/recuperar-contrasena">Solicitar un enlace nuevo</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {error && (
            <div role="alert" className="p-3 rounded-none bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
              <Icon icon={AlertCircleIcon} className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="nueva" className="text-xs font-semibold">Nueva contraseña</Label>
            <Input
              id="nueva"
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              disabled={cargando}
              className="h-10 text-sm rounded-none"
            />
            <p className="text-[11px] text-muted-foreground">Mínimo {LONGITUD_MINIMA} caracteres.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmar" className="text-xs font-semibold">Confirmar contraseña</Label>
            <Input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              disabled={cargando}
              className="h-10 text-sm rounded-none"
            />
          </div>
          <Button type="submit" disabled={cargando} className="w-full h-10 font-semibold rounded-none">
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      )}
    </div>
  );
}
