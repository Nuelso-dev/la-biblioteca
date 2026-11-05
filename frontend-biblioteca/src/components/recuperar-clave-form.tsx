"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book02Icon, AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { fetchAPI } from "@/services/api-client";
import { getMensajeError } from "@/lib/errores";

export function RecuperarClaveForm() {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const correo = email.trim();
    if (!correo) {
      setError("Ingresa el correo con el que te registraste.");
      return;
    }

    setCargando(true);
    try {
      // La solicitud pasa por el backend, que limita los intentos por IP antes de llegar a Supabase
      await fetchAPI("/auth/recuperar-contrasena", {
        method: "POST",
        body: JSON.stringify({ email: correo, redirectTo: `${window.location.origin}/nueva-contrasena` }),
      });

      // Mensaje neutro: no revela si el correo está registrado
      setEnviado(true);
    } catch (err) {
      setError(getMensajeError(err, "No se pudo enviar el correo de recuperación. Inténtalo de nuevo más tarde."));
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
        <h1 className="font-serif text-2xl font-normal tracking-[-0.02em] text-foreground mt-1">Recuperar contraseña</h1>
        <p className="text-xs text-muted-foreground">
          Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
        </p>
      </div>

      {enviado ? (
        <div role="status" className="p-3.5 rounded-none bg-secondary border border-border text-foreground text-xs flex items-start gap-2 font-medium">
          <Icon icon={CheckmarkCircle02Icon} className="size-4 shrink-0 text-primary mt-0.5" />
          <span>
            Si el correo <strong>{email.trim()}</strong> está registrado, recibirás un enlace en unos minutos. Revisa también la carpeta de spam.
          </span>
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
            <Label htmlFor="email" className="text-xs font-semibold">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="usuario@correo.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={cargando}
              className="h-10 text-sm rounded-none"
            />
          </div>
          <Button type="submit" disabled={cargando} className="w-full h-10 font-semibold rounded-none">
            {cargando ? "Enviando..." : "Enviar enlace de recuperación"}
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-muted-foreground">
        <Link href="/iniciar-sesion" className="underline underline-offset-4 font-semibold text-primary hover:text-primary/80">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
