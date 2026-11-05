"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Add01Icon, Building01Icon, Delete02Icon, Edit02Icon, Location01Icon, RotateLeftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { bibliotecasService, coordenadasDeSede, type Biblioteca } from "@/services/bibliotecas.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormularioSede } from "@/components/admin-sedes/formulario-sede";
import { getMensajeError } from "@/lib/errores";

export default function PaginaAdminSedes() {
  const [sedes, setSedes] = useState<Biblioteca[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Biblioteca | null>(null);
  const [porEliminar, setPorEliminar] = useState<Biblioteca | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      setSedes(await bibliotecasService.getAll());
    } catch (err) {
      setErrorCarga(getMensajeError(err, "No se pudieron cargar las sedes."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const abrirFormulario = (sede: Biblioteca | null) => {
    setEditando(sede);
    setFormAbierto(true);
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await bibliotecasService.delete(porEliminar.id_biblioteca);
      setPorEliminar(null);
      await cargar();
    } catch (err) {
      setErrorEliminar(getMensajeError(err, "No se pudo eliminar la sede."));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4 border-b border-border pb-5 sm:pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-foreground tracking-[-0.02em]">Sedes</h1>
          <p className="text-xs text-muted-foreground">Cada sede tiene su ubicación en el mapa y sus propias ubicaciones internas (salas, secciones, estanterías).</p>
        </div>
        <Button onClick={() => abrirFormulario(null)} size="sm" className="w-full sm:w-auto rounded-none font-semibold h-10 sm:h-9 px-4 gap-2 text-xs uppercase tracking-wider shrink-0">
          <Icon icon={Add01Icon} className="size-4" /> Nueva sede
        </Button>
      </header>

      {cargando ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-none" />)}</div>
      ) : errorCarga ? (
        <Card className="border-destructive/30 bg-destructive/5 rounded-none shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p role="alert" className="max-w-md text-xs text-destructive">{errorCarga}</p>
            <Button variant="outline" size="sm" onClick={() => void cargar()} className="gap-2 font-semibold rounded-none"><Icon icon={RotateLeftIcon} className="size-4" /> Reintentar</Button>
          </CardContent>
        </Card>
      ) : sedes.length === 0 ? (
        <EstadoVacio tipo="general" titulo="No hay sedes registradas" descripcion="Crea la primera sede para comenzar a administrar la red física." textoBoton="Nueva sede" onAccion={() => abrirFormulario(null)} />
      ) : (
        <Card className="border-border bg-card rounded-none shadow-none">
          <CardContent className="p-3 sm:p-5">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Sede</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wider">Dirección</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-xs uppercase tracking-wider">Teléfono</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Mapa</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sedes.map((sede) => (
                    <TableRow key={sede.id_biblioteca}>
                      <TableCell className="min-w-44 font-serif text-base text-foreground">
                        <Link href={`/administracion/sedes/${sede.id_biblioteca}`} className="flex items-center gap-2 hover:text-primary hover:underline underline-offset-4">
                          <Icon icon={Building01Icon} className="size-4 shrink-0 text-primary" />
                          {sede.nombre_biblioteca}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden max-w-56 truncate md:table-cell text-xs">{sede.direccion_biblioteca || "No registrada"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs font-mono">{sede.telefono_biblioteca || "No registrado"}</TableCell>
                      <TableCell className="text-xs">
                        {coordenadasDeSede(sede) ? (
                          <span className="inline-flex items-center gap-1 text-foreground"><Icon icon={Location01Icon} className="size-3.5 text-primary" /> Ubicada</span>
                        ) : (
                          <span className="text-muted-foreground">Sin ubicar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" asChild className="h-8 rounded-none border-border text-xs font-semibold">
                            <Link href={`/administracion/sedes/${sede.id_biblioteca}`}>Ver detalle</Link>
                          </Button>
                          <Button aria-label={`Editar ${sede.nombre_biblioteca}`} title="Editar" variant="ghost" size="icon-xs" onClick={() => abrirFormulario(sede)} className="rounded-none">
                            <Icon icon={Edit02Icon} className="size-4" />
                          </Button>
                          <Button aria-label={`Eliminar ${sede.nombre_biblioteca}`} title="Eliminar" variant="ghost" size="icon-xs" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-none" onClick={() => { setErrorEliminar(null); setPorEliminar(sede); }}>
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

      <FormularioSede
        abierto={formAbierto}
        sede={editando}
        onCerrar={() => setFormAbierto(false)}
        onGuardada={() => {
          setFormAbierto(false);
          void cargar();
        }}
      />

      <Dialog open={Boolean(porEliminar)} onOpenChange={(abierto) => !abierto && !eliminando && setPorEliminar(null)}>
        <DialogContent role="alertdialog" className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Eliminar sede</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Esta acción eliminará permanentemente <strong className="text-foreground">{porEliminar?.nombre_biblioteca}</strong>. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          {errorEliminar && <p role="alert" className="text-xs text-destructive">{errorEliminar}</p>}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setPorEliminar(null)} disabled={eliminando} className="rounded-none font-semibold">Cancelar</Button>
            <Button variant="destructive" onClick={() => void eliminar()} disabled={eliminando} className="rounded-none font-semibold">
              {eliminando ? "Eliminando..." : "Eliminar sede"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
