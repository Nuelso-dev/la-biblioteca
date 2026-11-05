"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Book02Icon,
  AlertCircleIcon,
  ViewIcon,
  ViewOffIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { cn } from "@/lib/utils";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { iniciarSesion, rol } = useAutenticacion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const redirectUrl = searchParams.get("redirect");
  const accion = searchParams.get("accion");
  const libroId = searchParams.get("libroId");
  const tituloLibro = searchParams.get("titulo") || "Libro seleccionado";
  const esRegistradoNuevo = searchParams.get("registrado") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    if (!password || password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setCargando(true);

    try {
      const resultado = await iniciarSesion(email, password);

      if (resultado.exito) {
        const rolUsuario = resultado.usuario?.rol || rol;
        if (accion === "solicitar" && libroId) {
          router.push(`/libros/detalle/${libroId}`);
        } else if (rolUsuario === "administrador" || rolUsuario === "bibliotecario") {
          router.push("/administracion");
        } else {
          const destino = redirectUrl?.startsWith("/administracion") ? "/" : (redirectUrl || "/mi-cuenta?tab=prestamos");
          router.push(destino);
        }
      } else {

        setError(resultado.mensaje || "Correo o contraseña incorrectos. Inténtalo de nuevo.");
      }
    } catch (err) {
      setError("No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          
          {/* Header Consistente con LaBiblioteca */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex flex-row items-center justify-center gap-2.5 font-medium">
              <div className="flex size-9 items-center justify-center rounded-none bg-primary text-primary-foreground">
                <Icon icon={Book02Icon} className="size-4" />
              </div>
              <span className="font-serif text-2xl font-normal text-foreground">
                LaBiblioteca
              </span>
            </div>
            <h1 className="font-serif text-2xl font-normal tracking-[-0.02em] text-foreground mt-1">
              Bienvenido de nuevo
            </h1>
          </div>

          {accion === "solicitar" && (
            <div className="p-3 rounded-none bg-secondary border border-border text-foreground text-xs font-medium text-center">
               Inicia sesión para solicitar el préstamo de &quot;{tituloLibro}&quot;.
            </div>
          )}

          {esRegistradoNuevo && (
            <div className="p-3.5 rounded-none bg-secondary border border-border text-foreground text-xs flex items-center gap-2 font-medium">
              <Icon icon={CheckmarkCircle02Icon} className="size-4 shrink-0 text-primary" />
              <span>¡Cuenta creada con éxito! Ya puedes iniciar sesión con tus credenciales.</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-none bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
              <Icon icon={AlertCircleIcon} className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-semibold">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@correo.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-sm rounded-none"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">Contraseña</Label>
                <Link
                  href="/recuperar-contrasena"
                  className="ml-auto text-xs underline-offset-4 hover:underline text-muted-foreground hover:text-foreground font-medium"
                >
                  ¿Olvidaste tu clave?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-sm rounded-none pr-10"
                />
                <Button variant="unstyled" size={null}
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer"
                >
                  {mostrarPassword ? (
                    <Icon icon={ViewOffIcon} className="size-4" />
                  ) : (
                    <Icon icon={ViewIcon} className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 font-semibold rounded-none mt-2" disabled={cargando}>
              {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </div>

        </div>
      </form>
      
      {/* Términos y privacidad */}
      <div className="text-muted-foreground text-center text-[11px] text-balance leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        Al continuar, aceptas nuestros{" "}
        <Link href="/terminos-y-privacidad#terminos">términos de servicio</Link> y{" "}
        <Link href="/terminos-y-privacidad#privacidad">política de privacidad</Link>.
      </div>
    </div>
  );
}
