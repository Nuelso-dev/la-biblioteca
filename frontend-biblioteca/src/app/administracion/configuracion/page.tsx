"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateLeftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { configService, estadosService, type Configuracion, type Estado } from "@/services/api";
import { getMensajeError } from "@/lib/errores";

/** Parámetros que el backend aplica realmente al prestar, devolver y responder solicitudes. */
const PARAMETROS = [
  {
    clave: "DIAS_MAX_PRESTAMO",
    titulo: "Días de préstamo",
    descripcion: "Plazo por defecto de un préstamo nuevo cuando no se indica fecha de vencimiento.",
    unidad: "días",
    porDefecto: "14",
  },
  {
    clave: "MAX_PRESTAMOS_USUARIO",
    titulo: "Máximo de préstamos por lector",
    descripcion: "Cantidad de préstamos abiertos (activos o vencidos) que puede tener un lector a la vez.",
    unidad: "préstamos",
    porDefecto: "3",
  },
  {
    clave: "TARIFA_MULTA_DIARIA",
    titulo: "Tarifa de multa diaria",
    descripcion: "Valor por cada día de retraso al registrar una devolución fuera de plazo.",
    unidad: "COP / día",
    porDefecto: "2000",
  },
  {
    clave: "DIAS_VENCIMIENTO_SOLICITUD",
    titulo: "Vencimiento de solicitudes",
    descripcion: "Días tras los cuales una solicitud sin respuesta se cancela automáticamente.",
    unidad: "días",
    porDefecto: "3",
  },
] as const;

export default function PaginaAdminConfiguracion() {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [originales, setOriginales] = useState<Record<string, string>>({});
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [configs, listaEstados] = await Promise.all([configService.getAll(), estadosService.getAll()]);
      const mapa: Record<string, string> = {};
      configs.forEach((c: Configuracion) => {
        mapa[c.clave_configuracion] = c.valor_configuracion ?? "";
      });
      setValores(mapa);
      setOriginales(mapa);
      setEstados(listaEstados);
    } catch (err) {
      setError(getMensajeError(err, "No se pudo cargar la configuración."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const guardar = async (parametro: (typeof PARAMETROS)[number]) => {
    const valor = (valores[parametro.clave] ?? "").trim();
    const numero = Number(valor);
    if (!valor || !Number.isFinite(numero) || numero <= 0) {
      setErrores((e) => ({ ...e, [parametro.clave]: "Ingresa un número mayor que cero." }));
      return;
    }
    setErrores((e) => ({ ...e, [parametro.clave]: "" }));
    setGuardando(parametro.clave);
    setError(null);
    setAviso(null);
    try {
      await configService.set(parametro.clave, String(numero), parametro.descripcion);
      setOriginales((o) => ({ ...o, [parametro.clave]: String(numero) }));
      setValores((v) => ({ ...v, [parametro.clave]: String(numero) }));
      setAviso(`"${parametro.titulo}" actualizado.`);
    } catch (err) {
      setError(getMensajeError(err, "No se pudo guardar el parámetro."));
    } finally {
      setGuardando(null);
    }
  };

  const entidades = Array.from(new Set(estados.map((e) => e.entidad_estado))).sort();

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">Configuración</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Reglas de préstamo, multas y solicitudes que aplica el sistema.</p>
        </div>
        <Button variant="outline" onClick={() => void cargar()} disabled={cargando} className="h-10 rounded-none border-border px-4 gap-2 font-semibold self-start sm:self-auto">
          <Icon icon={RotateLeftIcon} className={`size-4 ${cargando ? "animate-spin text-primary" : ""}`} /> Recargar
        </Button>
      </div>

      {error && <div role="alert" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</div>}
      {aviso && <div role="status" className="border border-primary/40 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">{aviso}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cargando
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-40 w-full rounded-none" />)
          : PARAMETROS.map((parametro) => {
              const modificado = (valores[parametro.clave] ?? "") !== (originales[parametro.clave] ?? "");
              return (
                <Card key={parametro.clave} className="border-border bg-card rounded-none shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-serif text-xl font-normal">{parametro.titulo}</CardTitle>
                    <CardDescription className="text-xs">{parametro.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Label htmlFor={parametro.clave} className="text-xs font-semibold">
                      Valor <span className="font-normal text-muted-foreground">({parametro.unidad})</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={parametro.clave}
                        type="number"
                        min={1}
                        value={valores[parametro.clave] ?? ""}
                        placeholder={parametro.porDefecto}
                        onChange={(e) => setValores((v) => ({ ...v, [parametro.clave]: e.target.value }))}
                        aria-invalid={Boolean(errores[parametro.clave])}
                        className="h-10 rounded-none border-border bg-background font-mono text-xs"
                      />
                      <Button disabled={!modificado || guardando === parametro.clave} onClick={() => void guardar(parametro)} className="h-10 rounded-none text-xs font-semibold">
                        {guardando === parametro.clave ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                    {errores[parametro.clave] && <p role="alert" className="text-[11px] text-destructive">{errores[parametro.clave]}</p>}
                    {originales[parametro.clave] === undefined && (
                      <p className="text-[11px] text-muted-foreground">Aún no configurado: se usa {parametro.porDefecto} por defecto.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-xl font-normal">Estados del sistema</CardTitle>
          <CardDescription className="text-xs">Catálogo de estados por entidad (solo lectura). Los estados los usa el sistema para controlar el flujo de préstamos.</CardDescription>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <Skeleton className="h-24 w-full rounded-none" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entidades.map((entidad) => (
                <div key={entidad} className="border border-border p-3">
                  <h3 className="font-sans mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{entidad.replace(/_/g, " ")}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {estados
                      .filter((e) => e.entidad_estado === entidad)
                      .map((e) => (
                        <Badge key={e.id_estado} variant={e.activo_estado ? "secondary" : "outline"} className="rounded-none text-[10px] font-semibold">
                          {e.nombre_estado}
                        </Badge>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
