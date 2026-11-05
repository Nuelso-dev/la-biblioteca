"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft01Icon, CallIcon, Clock01Icon, Edit02Icon, Location01Icon, RotateLeftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormularioSede } from "@/components/admin-sedes/formulario-sede";
import { UbicacionesDeSede } from "@/components/admin-catalogos/catalogos";
import { MapaSedes } from "@/components/mapa/mapa-sedes";
import { urlComoLlegar } from "@/components/mapa/mapa-base";
import { bibliotecasService, coordenadasDeSede, type Biblioteca } from "@/services/bibliotecas.service";
import { useTituloPagina } from "@/hooks/use-titulo-pagina";
import { getMensajeError } from "@/lib/errores";

/** Detalle de una sede: sus datos, dónde queda en el mapa y las ubicaciones internas donde se guardan los ejemplares. */
export default function PaginaDetalleSede() {
  const { id } = useParams<{ id: string }>();
  const [sede, setSede] = useState<Biblioteca | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setSede(await bibliotecasService.getById(id));
    } catch (err) {
      setError(getMensajeError(err, "No se pudo cargar la sede."));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  useTituloPagina(sede?.nombre_biblioteca ? `${sede.nombre_biblioteca} · Sede` : null);

  const coordenadas = sede ? coordenadasDeSede(sede) : null;
  const ruta = sede ? urlComoLlegar({ lat: coordenadas?.lat, lng: coordenadas?.lng, direccion: sede.direccion_biblioteca }) : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/administracion/sedes" className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline underline-offset-4">
        <Icon icon={ArrowLeft01Icon} className="size-3.5" /> Volver a sedes
      </Link>

      {cargando ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-1/3 rounded-none" />
          <Skeleton className="h-72 w-full rounded-none" />
        </div>
      ) : error || !sede ? (
        <Card className="border-destructive/30 bg-destructive/5 rounded-none shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p role="alert" className="max-w-md text-xs text-destructive">{error ?? "No se encontró la sede."}</p>
            <Button variant="outline" size="sm" onClick={() => void cargar()} className="gap-2 font-semibold rounded-none"><Icon icon={RotateLeftIcon} className="size-4" /> Reintentar</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <header className="flex flex-col @2xl:flex-row @2xl:items-start justify-between gap-4 border-b border-border pb-6">
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">{sede.nombre_biblioteca}</h1>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <p className="flex items-start gap-2"><Icon icon={Location01Icon} className="size-4 shrink-0 text-primary" /> {sede.direccion_biblioteca || "Dirección no registrada"}</p>
                <p className="flex items-center gap-2"><Icon icon={CallIcon} className="size-4 shrink-0 text-primary" /> {sede.telefono_biblioteca || "Teléfono no registrado"}</p>
                {sede.descripcion_biblioteca && <p className="flex items-start gap-2"><Icon icon={Clock01Icon} className="size-4 shrink-0 text-primary" /> {sede.descripcion_biblioteca}</p>}
              </div>
            </div>
            <Button onClick={() => setEditando(true)} variant="outline" size="sm" className="h-9 self-start rounded-none border-border px-4 text-xs font-semibold gap-2">
              <Icon icon={Edit02Icon} className="size-4" /> Editar sede
            </Button>
          </header>

          <section aria-labelledby="titulo-mapa" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-mapa" className="font-serif text-2xl font-normal text-foreground">Ubicación en el mapa</h2>
              {ruta && (
                <Button variant="outline" size="sm" asChild className="h-8 rounded-none border-border text-xs font-semibold">
                  <a href={ruta} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
                </Button>
              )}
            </div>
            {coordenadas ? (
              <MapaSedes sedes={[{ id: sede.id_biblioteca, nombre: sede.nombre_biblioteca ?? "", direccion: sede.direccion_biblioteca, ...coordenadas }]} altoClass="h-72" />
            ) : (
              <p className="border border-border bg-secondary p-4 text-xs text-muted-foreground">
                Esta sede aún no está ubicada en el mapa. Usa <strong className="text-foreground">Editar sede</strong> para marcar dónde queda.
              </p>
            )}
          </section>

          <section aria-labelledby="titulo-ubicaciones" className="flex flex-col gap-3">
            <h2 id="titulo-ubicaciones" className="font-serif text-2xl font-normal text-foreground">Ubicaciones dentro de la sede</h2>
            <UbicacionesDeSede idBiblioteca={Number(sede.id_biblioteca)} nombreSede={sede.nombre_biblioteca ?? ""} />
          </section>

          <FormularioSede
            abierto={editando}
            sede={sede}
            onCerrar={() => setEditando(false)}
            onGuardada={() => {
              setEditando(false);
              void cargar();
            }}
          />
        </>
      )}
    </div>
  );
}
