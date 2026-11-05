"use client";

import React, { useEffect, useState } from "react";
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { autoresService } from "@/services/api";
import type { Autor } from "@/services/autores.service";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PaginaAdminAutores() {
  const [autores, setAutores] = useState<Autor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [autorEnEdicion, setAutorEnEdicion] = useState<Autor | null>(null);
  const [autorAEliminar, setAutorAEliminar] = useState<Autor | null>(null);
  const [nombre, setNombre] = useState("");
  const [biografia, setBiografia] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const cargarAutores = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await autoresService.getAll();
      setAutores(data || []);
    } catch {
      setError("No se pudo cargar la lista de autores. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;
    autoresService.getAll()
      .then((data) => {
        if (activo) {
          setAutores(data || []);
          setError(null);
        }
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar la lista de autores. Inténtalo de nuevo.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const validarNombre = (valor: string) => {
    const nombreLimpio = valor.trim();
    const mensaje = !nombreLimpio
      ? "El nombre del autor es obligatorio."
      : nombreLimpio.length < 2
        ? "El nombre debe tener al menos 2 caracteres."
        : "";
    setErrorNombre(mensaje);
    return !mensaje;
  };

  const abrirFormulario = (autor?: Autor) => {
    setAutorEnEdicion(autor || null);
    setNombre(autor?.nombrecompleto_autor || autor?.nombrecompleto_autor || "");
    setBiografia(autor?.biografia_autor || "");
    setFechaNacimiento(autor?.fechanacimiento_autor ? autor.fechanacimiento_autor.slice(0, 10) : "");
    setErrorNombre("");
    setErrorAccion(null);
    setModal(true);
  };

  const cerrarFormulario = () => {
    if (!guardando) setModal(false);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarNombre(nombre)) return;

    try {
      setGuardando(true);
      setErrorAccion(null);
      if (autorEnEdicion) {
        const actualizado = await autoresService.update(autorEnEdicion.id_autor, {
          nombre: nombre.trim(),
          biografia: biografia.trim() || undefined,
          fechaNacimiento: fechaNacimiento || undefined,
        });
        setAutores((actuales) => actuales.map((autor) => autor.id_autor === autorEnEdicion.id_autor ? { ...autor, ...actualizado } : autor));
      } else {
        const creado = await autoresService.create({
          nombre: nombre.trim(),
          biografia: biografia.trim() || undefined,
          fechaNacimiento: fechaNacimiento || undefined,
        });
        setAutores((actuales) => [...actuales, creado]);
      }
      setModal(false);
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo guardar el autor.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!autorAEliminar) return;
    try {
      setEliminando(true);
      setErrorAccion(null);
      await autoresService.delete(autorAEliminar.id_autor);
      setAutores((actuales) => actuales.filter((autor) => autor.id_autor !== autorAEliminar.id_autor));
      setAutorAEliminar(null);
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo eliminar el autor.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4 border-b border-border pb-5 sm:pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-foreground tracking-[-0.02em]">Autores</h1>
          <p className="text-xs text-muted-foreground">Registra y edita la información de autores en el catálogo.</p>
        </div>
        <Button size="sm" onClick={() => abrirFormulario()} className="rounded-none gap-2 font-semibold h-10 sm:h-9 px-4 text-xs uppercase tracking-wider w-full sm:w-auto shrink-0">
          <Icon icon={Add01Icon} className="size-4" /> Agregar Autor
        </Button>
      </div>

      {/* 2 Métricas Estadísticas con bordes de 1px */}
      <div className="grid grid-cols-2 border border-border bg-card">
        <div className="border-r border-border p-4 sm:p-5">
          <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Total Autores
          </div>
          <div className="mt-1.5 font-serif text-2xl sm:text-3xl leading-none text-foreground">
            {cargando ? "..." : autores.length}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Autores Activos
          </div>
          <div className="mt-1.5 font-serif text-2xl sm:text-3xl leading-none text-foreground">
            {cargando ? "..." : autores.filter((a) => (a.libros_count || 0) > 0).length || autores.length}
          </div>
        </div>
      </div>

      {errorAccion && (
        <div role="alert" className="flex items-start justify-between gap-4 rounded-none border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          <span>{errorAccion}</span>
          <Button variant="ghost" size="xs" onClick={() => setErrorAccion(null)} className="rounded-none">Cerrar</Button>
        </div>
      )}

      {cargando ? (
        <Card className="border-border bg-card rounded-none shadow-none">
          <CardContent className="flex flex-col gap-4 p-5">
            <Skeleton className="h-10 w-full rounded-none" />
            <Skeleton className="h-10 w-full rounded-none" />
            <Skeleton className="h-10 w-full rounded-none" />
          </CardContent>
        </Card>
      ) : error ? (
        <EstadoVacio tipo="general" titulo="No se pudieron cargar los autores" descripcion={error} textoBoton="Reintentar" onAccion={cargarAutores} />
      ) : autores.length === 0 ? (
        <EstadoVacio tipo="general" titulo="Aún no hay autores" descripcion="Registra el primer autor para comenzar a construir el catálogo." textoBoton="Nuevo autor" onAccion={() => abrirFormulario()} />
      ) : (
      <Card className="border-border bg-card rounded-none shadow-none">
        <CardContent className="p-3 sm:p-5">
          {/* Vista Móvil: Fichas (< sm) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {autores.map((a) => (
              <div key={a.id_autor} className="p-3.5 border border-border bg-background flex flex-col gap-3 rounded-none">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-mono text-xs text-muted-foreground">ID #{a.id_autor}</span>
                  <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider rounded-none">
                    {a.libros_count || 0} Libros
                  </Badge>
                </div>

                <div className="font-serif text-base text-foreground">{a.nombrecompleto_autor}</div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirFormulario(a)}
                    className="rounded-none h-8 px-3 text-xs font-semibold gap-1 border-border"
                  >
                    <Icon icon={Edit02Icon} className="size-3.5" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setAutorAEliminar(a); setErrorAccion(null); }}
                    className="rounded-none h-8 px-3 text-xs font-semibold gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <Icon icon={Delete02Icon} className="size-3.5" /> Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Desktop: Tabla (>= sm) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">ID</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Nombre del autor</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Libros vinculados</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autores.map((a) => (
                  <TableRow key={a.id_autor}>
                    <TableCell className="font-mono text-xs font-semibold">{a.id_autor}</TableCell>
                    <TableCell className="font-serif font-normal text-foreground text-base">{a.nombrecompleto_autor}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider rounded-none">
                        {a.libros_count || 0} Libros
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon-xs" variant="ghost" onClick={() => abrirFormulario(a)} aria-label={`Editar a ${a.nombrecompleto_autor}`} className="rounded-none">
                          <Icon icon={Edit02Icon} className="size-4" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => { setAutorAEliminar(a); setErrorAccion(null); }}
                          aria-label={`Eliminar a ${a.nombrecompleto_autor}`}
                          className="rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Icon icon={Delete02Icon} className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      <Dialog open={modal} onOpenChange={cerrarFormulario}>
        <DialogContent className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleGuardar} noValidate className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-normal">{autorEnEdicion ? "Editar autor" : "Nuevo autor"}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {autorEnEdicion ? "Actualiza los datos que aparecen en el catálogo." : "Registra un autor para asociar sus obras literarias."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre" className="text-xs font-semibold">Nombre completo</Label>
              <Input
                id="nombre"
                placeholder="Ej. Mario Vargas Llosa"
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); if (errorNombre) validarNombre(e.target.value); }}
                onBlur={() => validarNombre(nombre)}
                aria-invalid={Boolean(errorNombre)}
                aria-describedby={errorNombre ? "nombre-error" : undefined}
                className="h-10 text-xs rounded-none border-border bg-background"
              />
              {errorNombre && <p id="nombre-error" className="text-[11px] text-destructive" role="alert">{errorNombre}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fechaNacimiento" className="text-xs font-semibold">Fecha de nacimiento</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="h-10 text-xs rounded-none border-border bg-background"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="biografia" className="text-xs font-semibold">Biografía</Label>
              <Textarea
                id="biografia"
                rows={4}
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                className="text-xs rounded-none border-border bg-background"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" size="sm" type="button" onClick={cerrarFormulario} disabled={guardando} className="rounded-none font-semibold">
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={guardando} className="rounded-none font-semibold">
                {guardando && <Icon icon={Clock01Icon} className="size-4 animate-spin" />}
                {autorEnEdicion ? "Guardar cambios" : "Crear autor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(autorAEliminar)} onOpenChange={(open) => !open && !eliminando && setAutorAEliminar(null)}>
        <DialogContent role="alertdialog" className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">¿Eliminar autor?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se eliminará <strong className="text-foreground">{autorAEliminar?.nombrecompleto_autor}</strong>. Solo es posible eliminar autores sin libros vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setAutorAEliminar(null)} disabled={eliminando} className="rounded-none font-semibold">Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleEliminar} disabled={eliminando} className="rounded-none font-semibold">
              {eliminando ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

