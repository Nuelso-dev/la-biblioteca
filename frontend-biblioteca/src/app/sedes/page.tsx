"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDirectorio } from "@/components/layout/layout-directorio";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import {
  Building01Icon,
  Location01Icon,
  Clock01Icon,
  CallIcon,
  Search01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bibliotecasService } from "@/services/api";
import { coordenadasDeSede, type Biblioteca } from "@/services/bibliotecas.service";
import { MapaSedes } from "@/components/mapa/mapa-sedes";
import { MostrarMas } from "@/components/ui/mostrar-mas";
import { urlComoLlegar } from "@/components/mapa/mapa-base";
import { coincideFuzzy } from "@/lib/fuzzy-search";

const TAMANO_LOTE = 12;

export default function PaginaSedes() {
  const [sedes, setSedes] = useState<Biblioteca[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [sedeEnfocada, setSedeEnfocada] = useState<string | number | null>(null);
  const [visibles, setVisibles] = useState(TAMANO_LOTE);

  useEffect(() => {
    async function cargarSedes() {
      try {
        setCargando(true);
        setError(null);
        const data = await bibliotecasService.getActivas();
        setSedes(data || []);
      } catch (err: unknown) {
        console.error("Error al cargar sedes físicas:", err);
        setError("No se pudo conectar con la red de bibliotecas.");
      } finally {
        setCargando(false);
      }
    }

    cargarSedes();
  }, []);

  const sedesFiltradas = sedes.filter((s) => {
    const nombre = s.nombre_biblioteca ?? "";
    const direccion = s.direccion_biblioteca ?? "";
    const descripcion = s.descripcion_biblioteca ?? "";
    return (
      coincideFuzzy(busqueda, nombre) ||
      coincideFuzzy(busqueda, direccion) ||
      coincideFuzzy(busqueda, descripcion)
    );
  });

  const sedesEnMapa = sedesFiltradas.flatMap((s) => {
    const coordenadas = coordenadasDeSede(s);
    return coordenadas ? [{ id: s.id_biblioteca, nombre: s.nombre_biblioteca ?? "", direccion: s.direccion_biblioteca, ...coordenadas }] : [];
  });

  return (
    <LayoutDirectorio
      titulo="Sedes"
      subtitulo={`Sedes de la red de bibliotecas (${sedes.length}).`}
      buscador={
        <div className="relative w-full sm:w-80">
          <Icon icon={Search01Icon} className="size-4 absolute left-3.5 top-3 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por sede, ciudad o dirección..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setVisibles(TAMANO_LOTE); }}
            className="pl-9 h-10 text-base sm:text-xs rounded-none border-border bg-background focus-visible:ring-primary"
          />
        </div>
      }
    >

        {/* Estado de Carga Pulido */}
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-6 flex flex-col justify-between border-border rounded-none bg-card shadow-none">
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="size-12 rounded-none" />
                    <Skeleton className="h-6 w-28 rounded-none" />
                  </div>
                  <Skeleton className="h-7 w-3/4 rounded-none" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full rounded-none" />
                    <Skeleton className="h-4 w-5/6 rounded-none" />
                    <Skeleton className="h-4 w-2/3 rounded-none" />
                  </div>
                </CardContent>
                <div className="pt-3 border-t border-border mt-4">
                  <Skeleton className="h-9 w-full rounded-none" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <EstadoVacio
            tipo="busqueda"
            titulo="No se pudieron cargar las sedes"
            descripcion={error}
            onAccion={() => window.location.reload()}
            textoBoton="Reintentar"
          />
        ) : sedesFiltradas.length > 0 ? (
          <div className="flex flex-col gap-8">
          {sedesEnMapa.length > 0 && (
            <section aria-label="Mapa de sedes" id="mapa-sedes" className="scroll-mt-24">
              <MapaSedes sedes={sedesEnMapa} enfocarId={sedeEnfocada} />
            </section>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sedesFiltradas.slice(0, visibles).map((sede) => (
              <Card
                key={sede.id_biblioteca}
                className="group hover:border-primary transition-colors p-6 flex flex-col justify-between border border-border bg-card rounded-none shadow-none"
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="size-10 rounded-none bg-secondary text-primary flex items-center justify-center border border-border shrink-0">
                      <Icon icon={Building01Icon} className="size-5" />
                    </div>
                  </div>

                  <h3 className="font-serif text-xl font-normal text-foreground mb-3 group-hover:text-primary transition-colors">
                    {sede.nombre_biblioteca}
                  </h3>

                  <div className="flex flex-col gap-2.5 text-xs text-muted-foreground mb-5">
                    <p className="flex items-start gap-2">
                      <Icon icon={Location01Icon} className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{sede.direccion_biblioteca ?? "Dirección no registrada"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Icon icon={CallIcon} className="size-4 text-primary shrink-0" />
                      <span>{sede.telefono_biblioteca ?? "Teléfono no registrado"}</span>
                    </p>
                    {(sede.descripcion_biblioteca) && (
                      <p className="flex items-start gap-2">
                        <Icon icon={CheckmarkCircle02Icon} className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{sede.descripcion_biblioteca}</span>
                      </p>
                    )}
                  </div>
                </CardContent>

                <div className="pt-3 border-t border-border flex flex-col gap-2">
                  {(() => {
                    const coordenadas = coordenadasDeSede(sede);
                    const ruta = urlComoLlegar({ lat: coordenadas?.lat, lng: coordenadas?.lng, direccion: sede.direccion_biblioteca });
                    return (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!coordenadas}
                          onClick={() => {
                            setSedeEnfocada(sede.id_biblioteca);
                            document.getElementById("mapa-sedes")?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className="rounded-none text-xs font-semibold h-9"
                        >
                          Ver en el mapa
                        </Button>
                        {ruta ? (
                          <Button size="sm" asChild className="rounded-none text-xs font-semibold h-9">
                            <a href={ruta} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
                          </Button>
                        ) : (
                          <Button size="sm" disabled className="rounded-none text-xs font-semibold h-9">Cómo llegar</Button>
                        )}
                      </div>
                    );
                  })()}
                  <Button size="sm" variant="outline" asChild className="w-full rounded-none text-xs font-semibold gap-1 h-9">
                    <Link href={`/libros?q=${encodeURIComponent(sede.nombre_biblioteca ?? "")}`}>
                      Explorar libros de esta sede <Icon icon={ArrowRight01Icon} className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <MostrarMas visibles={visibles} total={sedesFiltradas.length} etiqueta="sedes" onMostrarMas={() => setVisibles((v) => v + TAMANO_LOTE)} />
          </div>
        ) : (
          <EstadoVacio
            tipo="busqueda"
            titulo="No se encontraron sedes"
            descripcion={`No existen sedes registradas que coincidan con "${busqueda}".`}
            onAccion={() => setBusqueda("")}
            textoBoton="Limpiar búsqueda"
          />
        )}
    </LayoutDirectorio>
  );
}

