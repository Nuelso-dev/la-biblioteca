"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDirectorio } from "@/components/layout/layout-directorio";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import {
  UserGroupIcon,
  Book02Icon,
  ArrowRight01Icon,
  Search01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { autoresService } from "@/services/api";
import type { Autor } from "@/services/autores.service";
import { coincideFuzzy } from "@/lib/fuzzy-search";
import { urlDetalleLibro } from "@/lib/libros-utils";
import { MostrarMas } from "@/components/ui/mostrar-mas";

const TAMANO_LOTE = 12;

export default function PaginaAutores() {
  const [autores, setAutores] = useState<Autor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [visibles, setVisibles] = useState(TAMANO_LOTE);
  const [perfil, setPerfil] = useState<Autor | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  const abrirPerfil = async (autor: Autor) => {
    setPerfil(autor);
    setErrorPerfil(null);
    setCargandoPerfil(true);
    try {
      setPerfil(await autoresService.getById(autor.id_autor));
    } catch {
      setErrorPerfil("No se pudo cargar el detalle del autor.");
    } finally {
      setCargandoPerfil(false);
    }
  };

  useEffect(() => {
    async function cargarAutores() {
      try {
        setCargando(true);
        setError(null);
        const data = await autoresService.getAll();
        setAutores(data || []);
      } catch (err: unknown) {
        console.error("Error al cargar autores:", err);
        setError("No se pudo obtener la lista de autores desde la base de datos.");
      } finally {
        setCargando(false);
      }
    }

    cargarAutores();
  }, []);

  const autoresFiltrados = autores.filter((a) =>
    coincideFuzzy(busqueda, a.nombrecompleto_autor ?? "")
  );

  return (
    <LayoutDirectorio
      titulo="Autores"
      subtitulo={`Autores registrados en el catálogo (${autores.length}).`}
      buscador={
        <div className="relative w-full sm:w-80">
          <Icon icon={Search01Icon} className="size-4 absolute left-3.5 top-3 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar autor por nombre..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setVisibles(TAMANO_LOTE); }}
            className="pl-9 pr-9 h-10 text-base sm:text-xs rounded-none border-border bg-background focus-visible:ring-primary"
          />
          {busqueda && (
            <Button variant="unstyled" size={null}
              onClick={() => { setBusqueda(""); setVisibles(TAMANO_LOTE); }}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <Icon icon={Cancel01Icon} className="size-4" />
            </Button>
          )}
        </div>
      }
    >

        {/* Estado de Carga Pulido */}
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="p-6 flex flex-col justify-between border-border rounded-none bg-card shadow-none">
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="size-12 rounded-none" />
                    <Skeleton className="h-6 w-24 rounded-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-3/4 rounded-none" />
                    <Skeleton className="h-4 w-full rounded-none" />
                  </div>
                </CardContent>
                <div className="pt-4 border-t border-border mt-4">
                  <Skeleton className="h-9 w-full rounded-none" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <EstadoVacio
            tipo="busqueda"
            titulo="No se pudieron cargar los autores"
            descripcion={error}
            onAccion={() => window.location.reload()}
            textoBoton="Reintentar"
          />
        ) : autoresFiltrados.length > 0 ? (
          <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {autoresFiltrados.slice(0, visibles).map((autor) => (
              <Card
                key={autor.id_autor}
                className="group hover:border-primary transition-colors duration-200 p-6 flex flex-col justify-between border-border bg-card rounded-none shadow-none"
              >
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="size-12 rounded-full bg-secondary text-foreground flex items-center justify-center font-serif font-normal text-xl shrink-0 border border-border">
                      {(autor.nombrecompleto_autor ?? "A").charAt(0).toUpperCase()}
                    </div>
                    <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider shrink-0 rounded-none">
                      {autor.libros_count ? `${autor.libros_count} Obras` : "Catálogo"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-normal text-foreground group-hover:text-primary transition-colors">
                      {autor.nombrecompleto_autor}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                      {autor.biografia_autor || "Autor registrado en el catálogo."}
                    </p>
                  </div>
                </CardContent>

                <div className="pt-4 border-t border-border mt-4 flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void abrirPerfil(autor)}
                    className="w-full justify-between text-xs font-semibold text-foreground hover:bg-muted rounded-none"
                  >
                    <span>Ver perfil y obras</span>
                    <Icon icon={ArrowRight01Icon} className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="w-full justify-between text-xs font-semibold text-primary hover:text-primary hover:bg-muted rounded-none"
                  >
                    <Link href={`/libros?q=${encodeURIComponent(autor.nombrecompleto_autor ?? "")}`}>
                      <span className="flex items-center gap-1.5">
                        <Icon icon={Book02Icon} className="size-4" /> Ver libros en catálogo
                      </span>
                      <Icon icon={ArrowRight01Icon} className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <MostrarMas visibles={visibles} total={autoresFiltrados.length} etiqueta="autores" onMostrarMas={() => setVisibles((v) => v + TAMANO_LOTE)} />
          </div>
        ) : (
          <div className="col-span-full">
            <EstadoVacio
              tipo="busqueda"
              titulo="No encontramos autores"
              descripcion={`No hay autores registrados que coincidan con "${busqueda}".`}
              onAccion={() => { setBusqueda(""); setVisibles(TAMANO_LOTE); }}
              textoBoton="Mostrar todos los autores"
            />
          </div>
        )}
      <Dialog open={Boolean(perfil)} onOpenChange={(abierto) => !abierto && setPerfil(null)}>
        <DialogContent className="sm:max-w-lg rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">{perfil?.nombrecompleto_autor}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {perfil?.fechanacimiento_autor
                ? `Nacimiento: ${new Date(perfil.fechanacimiento_autor).toLocaleDateString("es-CO", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })}`
                : "Fecha de nacimiento no registrada"}
            </DialogDescription>
          </DialogHeader>

          {perfil?.biografia_autor && <p className="text-sm leading-relaxed text-muted-foreground">{perfil.biografia_autor}</p>}

          <div>
            <h3 className="mb-2 font-serif text-lg font-normal text-foreground">Obras en el catálogo</h3>
            {cargandoPerfil ? (
              <p className="text-xs text-muted-foreground">Cargando obras...</p>
            ) : errorPerfil ? (
              <p role="alert" className="text-xs text-destructive">{errorPerfil}</p>
            ) : !perfil?.libros || perfil.libros.length === 0 ? (
              <p className="text-xs text-muted-foreground">Este autor aún no tiene libros en el catálogo.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border border border-border">
                {perfil.libros.map((libro) => (
                  <li key={libro.id_libro}>
                    <Link href={urlDetalleLibro(libro.id_libro, libro.titulo)} className="block p-3 text-sm text-foreground hover:bg-accent/40 hover:text-primary">
                      {libro.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </LayoutDirectorio>
  );
}
