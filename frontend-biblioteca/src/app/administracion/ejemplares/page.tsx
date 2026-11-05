"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Add01Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginacionTabla } from "@/components/admin/paginacion-tabla";
import { SelectorBuscable } from "@/components/admin/selector-buscable";
import { useBusquedaDiferida, useFiltrosUrl } from "@/hooks/use-filtros-url";
import { useListadoPaginado } from "@/hooks/use-listado-paginado";
import { formatearDiaCalendario } from "@/lib/fechas";
import {
  ejemplaresService,
  librosService,
  ubicacionesService,
  estadosService,
  type Ejemplar,
  type Estado,
  type Ubicacion,
} from "@/services/api";
import { getMensajeError } from "@/lib/errores";

type FormEjemplar = {
  cantidad: string;
  idLibro: string;
  idUbicacion: string;
  idEstado: string;
  codigoInterno: string;
  fechaAdquisicion: string;
  observacion: string;
};

const POR_PAGINA = 20;
const FILTROS_INICIALES = { libro: "", estado: "", codigo: "" };
const MAX_LOTE = 100;

const formVacio: FormEjemplar = {
  cantidad: "1",
  idLibro: "",
  idUbicacion: "",
  idEstado: "",
  codigoInterno: "",
  fechaAdquisicion: "",
  observacion: "",
};

const Obligatorio = () => <span className="text-destructive" aria-hidden="true"> *</span>;

function ContenidoEjemplares() {
  const { filtros, pagina, actualizar } = useFiltrosUrl(FILTROS_INICIALES);
  const [textoCodigo, setTextoCodigo] = useBusquedaDiferida(filtros.codigo, (valor) => actualizar({ codigo: valor }));
  const [tituloLibroFiltrado, setTituloFiltro] = useState("");

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Ejemplar | null>(null);
  const [form, setForm] = useState<FormEjemplar>(formVacio);
  const [tituloForm, setTituloForm] = useState<string | undefined>(undefined);
  const [erroresForm, setErroresForm] = useState<Partial<Record<keyof FormEjemplar, string>>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [copias, setCopias] = useState<{ total: number; enSede: number | null } | null>(null);

  const [porEliminar, setPorEliminar] = useState<Ejemplar | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const listado = useListadoPaginado<Ejemplar>(
    () => ejemplaresService.getPagina({ idLibro: filtros.libro, idEstado: filtros.estado, codigo: filtros.codigo, page: pagina, limit: POR_PAGINA }),
    [filtros.libro, filtros.estado, filtros.codigo, pagina],
    { pagina, alPaginaVacia: (ultima) => actualizar({ pagina: ultima }), mensajeError: "No se pudieron cargar los ejemplares." }
  );

  // Ubicaciones y estados son catálogos pequeños: se cargan una vez para los selectores
  useEffect(() => {
    let activo = true;
    Promise.all([ubicacionesService.getAll(), estadosService.getAll("ejemplar")])
      .then(([listaUbicaciones, listaEstados]) => {
        if (!activo) return;
        setUbicaciones(listaUbicaciones);
        setEstados(listaEstados);
      })
      .catch((err) => {
        if (activo) setError(getMensajeError(err, "No se pudieron cargar las ubicaciones y estados."));
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // El libro filtrado viene de la URL: se busca su título para mostrarlo en el selector
  useEffect(() => {
    if (!filtros.libro) return;
    let activo = true;
    librosService
      .getById(filtros.libro)
      .then((libro) => {
        if (activo) setTituloFiltro(libro.titulo_libro ?? "");
      })
      .catch(() => {
        if (activo) setTituloFiltro("");
      });
    return () => {
      activo = false;
    };
  }, [filtros.libro]);

  // El título solo aplica mientras haya un libro filtrado
  const tituloFiltro = filtros.libro ? tituloLibroFiltrado : "";

  const buscarLibros = useCallback(async (texto: string) => {
    const resultado = await librosService.getPagina({ busqueda: texto, limit: 20 });
    return resultado.libros.map((libro) => ({ valor: String(libro.id_libro), etiqueta: libro.titulo_libro ?? `Libro ${libro.id_libro}` }));
  }, []);

  // Prestado y Reservado los asignan los préstamos y las solicitudes, no la edición manual
  const estadosEditables = useMemo(() => estados.filter((e) => e.codigo_estado !== "PRESTADO" && e.codigo_estado !== "RESERVADO"), [estados]);
  const ubicacionesActivas = useMemo(
    () => ubicaciones.filter((u) => u.codigo_estado !== "INACTIVA"),
    [ubicaciones]
  );

  // Al elegir libro (y sede) se cuentan las copias que ya tiene, para no registrar dos veces el mismo lote
  const idBibliotecaForm = ubicaciones.find((u) => String(u.id_ubicacion) === form.idUbicacion)?.id_biblioteca;
  useEffect(() => {
    if (!formAbierto || editando || !form.idLibro) return;
    let activo = true;
    Promise.all([
      ejemplaresService.getPagina({ idLibro: form.idLibro, limit: 1 }),
      idBibliotecaForm ? ejemplaresService.getPagina({ idLibro: form.idLibro, idBiblioteca: idBibliotecaForm, limit: 1 }) : Promise.resolve(null),
    ])
      .then(([todas, sede]) => {
        if (activo) setCopias({ total: todas.total, enSede: sede ? sede.total : null });
      })
      .catch(() => {
        if (activo) setCopias(null);
      });
    return () => {
      activo = false;
    };
  }, [formAbierto, editando, form.idLibro, idBibliotecaForm]);
  const copiasVisibles = formAbierto && !editando && form.idLibro ? copias : null;
  const nombreSedeForm = ubicaciones.find((u) => String(u.id_ubicacion) === form.idUbicacion)?.nombre_biblioteca;

  const abrirFormulario = (ejemplar?: Ejemplar) => {
    setCopias(null);
    setErrorServidor(null);
    setErroresForm({});
    setEditando(ejemplar ?? null);
    setTituloForm(ejemplar ? ejemplar.titulo_libro : tituloFiltro || undefined);
    setForm(
      ejemplar
        ? {
            cantidad: "1",
            idLibro: String(ejemplar.id_libro),
            idUbicacion: String(ejemplar.id_ubicacion),
            idEstado: String(ejemplar.id_estado_ejemplar),
            codigoInterno: ejemplar.codinterno_ejemplar,
            fechaAdquisicion: ejemplar.fechaadquisicion_ejemplar ? ejemplar.fechaadquisicion_ejemplar.slice(0, 10) : "",
            observacion: ejemplar.observacion_ejemplar ?? "",
          }
        : { ...formVacio, idLibro: filtros.libro }
    );
    setFormAbierto(true);
  };

  const cambiar = <K extends keyof FormEjemplar>(campo: K, valor: FormEjemplar[K]) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setErroresForm((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
  };

  const guardar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errores: Partial<Record<keyof FormEjemplar, string>> = {};
    if (!form.idLibro) errores.idLibro = "Selecciona el libro.";
    if (!form.idUbicacion) errores.idUbicacion = "Selecciona la ubicación física del ejemplar.";
    const cantidad = Number(form.cantidad);
    if (!editando && (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_LOTE)) {
      errores.cantidad = `Indica un número entero entre 1 y ${MAX_LOTE}.`;
    }
    setErroresForm(errores);
    if (Object.keys(errores).length > 0) return;

    setGuardando(true);
    setErrorServidor(null);
    try {
      if (editando) {
        await ejemplaresService.update(editando.id_ejemplar, {
          idUbicacion: Number(form.idUbicacion),
          ...(form.idEstado ? { idEstado: Number(form.idEstado) } : {}),
          ...(form.codigoInterno.trim() ? { codigoInterno: form.codigoInterno.trim() } : {}),
          ...(form.fechaAdquisicion ? { fechaAdquisicion: form.fechaAdquisicion } : {}),
          observacion: form.observacion.trim(),
        });
      } else if (cantidad > 1) {
        await ejemplaresService.createLote({
          cantidad,
          idLibro: Number(form.idLibro),
          idUbicacion: Number(form.idUbicacion),
          ...(form.idEstado ? { idEstado: Number(form.idEstado) } : {}),
          ...(form.fechaAdquisicion ? { fechaAdquisicion: form.fechaAdquisicion } : {}),
          ...(form.observacion.trim() ? { observacion: form.observacion.trim() } : {}),
        });
        setAviso(`Se registraron ${cantidad} ejemplares.`);
      } else {
        await ejemplaresService.create({
          idLibro: Number(form.idLibro),
          idUbicacion: Number(form.idUbicacion),
          ...(form.idEstado ? { idEstado: Number(form.idEstado) } : {}),
          ...(form.codigoInterno.trim() ? { codigoInterno: form.codigoInterno.trim() } : {}),
          ...(form.fechaAdquisicion ? { fechaAdquisicion: form.fechaAdquisicion } : {}),
          ...(form.observacion.trim() ? { observacion: form.observacion.trim() } : {}),
        });
      }
      setFormAbierto(false);
      listado.recargar();
    } catch (err) {
      setErrorServidor(getMensajeError(err, "No se pudo guardar el ejemplar."));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    setError(null);
    try {
      await ejemplaresService.delete(porEliminar.id_ejemplar);
      setPorEliminar(null);
      listado.recargar();
    } catch (err) {
      setPorEliminar(null);
      setError(getMensajeError(err, "No se pudo eliminar el ejemplar."));
    } finally {
      setEliminando(false);
    }
  };

  const enPrestamo = editando?.codigo_estado === "PRESTADO";
  const sinUbicaciones = !cargandoCatalogos && ubicacionesActivas.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">Ejemplares</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Copias físicas de cada libro: dónde están y en qué estado se encuentran.
          </p>
        </div>
        <Button
          onClick={() => abrirFormulario()}
          disabled={cargandoCatalogos || sinUbicaciones}
          className="h-10 rounded-none bg-foreground px-5 text-xs font-semibold text-background hover:bg-foreground/90 gap-2"
        >
          <Icon icon={Add01Icon} className="size-4" /> Nuevo ejemplar
        </Button>
      </div>

      {sinUbicaciones && (
        <div role="status" className="border border-border bg-secondary p-4 text-xs text-muted-foreground">
          Antes de registrar ejemplares necesitas al menos una sede con una ubicación (sección o estantería) activa.{" "}
          <Link href="/administracion/sedes" className="font-semibold text-primary underline-offset-2 hover:underline">
            Ir a Sedes y ubicaciones
          </Link>
        </div>
      )}

      {(error || listado.error) && (
        <div role="alert" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error ?? listado.error}</div>
      )}

      {aviso && <div role="status" className="border border-primary/40 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">{aviso}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <SelectorBuscable
            key={`filtro-${filtros.libro}-${tituloFiltro}`}
            id="filtro-libro"
            valor={filtros.libro}
            etiquetaInicial={tituloFiltro || undefined}
            onChange={(valor) => actualizar({ libro: valor })}
            buscar={buscarLibros}
            placeholder="Filtrar por libro (escribe el título)"
            vacio="Todos los libros"
          />
          {filtros.libro && (
            <button type="button" onClick={() => actualizar({ libro: "" })} className="self-start text-[11px] font-semibold text-primary underline-offset-2 hover:underline">
              Quitar filtro de libro
            </button>
          )}
        </div>
        <SelectNativo value={filtros.estado} onChange={(e) => actualizar({ estado: e.target.value })} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {estados.map((estado) => (
            <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre_estado}</option>
          ))}
        </SelectNativo>
        <Input
          type="search"
          value={textoCodigo}
          onChange={(e) => setTextoCodigo(e.target.value)}
          placeholder="Buscar por código interno..."
          className="h-10 rounded-none border-border bg-background text-xs"
        />
      </div>

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardContent className="p-3 sm:p-5">
          {listado.cargando ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-none" />)}
            </div>
          ) : listado.datos.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              {filtros.libro || filtros.estado || filtros.codigo ? "Ningún ejemplar coincide con los filtros." : "Aún no hay ejemplares registrados."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Código</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Libro</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Sede / ubicación</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Estado</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Adquisición</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listado.datos.map((ejemplar) => (
                    <TableRow key={ejemplar.id_ejemplar}>
                      <TableCell className="font-mono text-xs font-semibold">{ejemplar.codinterno_ejemplar}</TableCell>
                      <TableCell className="font-serif text-base text-foreground">{ejemplar.titulo_libro}</TableCell>
                      <TableCell className="text-xs">
                        <span className="block font-semibold text-foreground">{ejemplar.nombre_biblioteca}</span>
                        <span className="text-muted-foreground">
                          {[ejemplar.nombre_ubicacion, ejemplar.seccion_ubicacion, ejemplar.estanteria_ubicacion].filter(Boolean).join(" · ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ejemplar.codigo_estado === "DISPONIBLE" ? "default" : "secondary"}
                          className="rounded-none text-[10px] font-semibold uppercase tracking-wider"
                        >
                          {ejemplar.nombre_estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatearDiaCalendario(ejemplar.fechaadquisicion_ejemplar)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button aria-label={`Editar ${ejemplar.codinterno_ejemplar}`} variant="ghost" size="icon-xs" className="rounded-none" onClick={() => abrirFormulario(ejemplar)}>
                            <Icon icon={Edit02Icon} className="size-4" />
                          </Button>
                          <Button
                            aria-label={`Eliminar ${ejemplar.codinterno_ejemplar}`}
                            variant="ghost"
                            size="icon-xs"
                            className="rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setPorEliminar(ejemplar)}
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
          )}

          {!listado.cargando && (
            <PaginacionTabla pagina={pagina} totalPaginas={listado.totalPaginas} total={listado.total} limite={POR_PAGINA} onCambiar={(p) => actualizar({ pagina: p })} />
          )}
        </CardContent>
      </Card>

      <Dialog open={formAbierto} onOpenChange={(abierto) => !guardando && setFormAbierto(abierto)}>
        <DialogContent className="admin-touch sm:max-w-lg rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">{editando ? "Editar ejemplar" : "Nuevo ejemplar"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Los campos marcados con <span className="text-destructive font-semibold">*</span> son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
            {errorServidor && (
              <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{errorServidor}</p>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="ej-libro" className="text-xs font-semibold">Libro<Obligatorio /></Label>
              <SelectorBuscable
                id="ej-libro"
                valor={form.idLibro}
                etiquetaInicial={tituloForm}
                disabled={Boolean(editando) || guardando}
                onChange={(valor) => cambiar("idLibro", valor)}
                buscar={buscarLibros}
                placeholder="Buscar libro por título, autor o ISBN"
              />
              {copiasVisibles && (
                <p role="status" className="border border-border bg-secondary px-3 py-2 text-[11px] text-muted-foreground">
                  {copiasVisibles.total === 0
                    ? "Este libro aún no tiene ejemplares registrados."
                    : `Este libro ya tiene ${copiasVisibles.total} ${copiasVisibles.total === 1 ? "ejemplar" : "ejemplares"}`}
                  {copiasVisibles.total > 0 && copiasVisibles.enSede !== null && ` (${copiasVisibles.enSede} en ${nombreSedeForm ?? "la sede elegida"})`}
                  {copiasVisibles.total > 0 && ". Revisa que no sean las mismas unidades antes de guardar."}
                </p>
              )}
              {erroresForm.idLibro && <p role="alert" className="text-[11px] text-destructive">{erroresForm.idLibro}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ej-ubicacion" className="text-xs font-semibold">Sede y ubicación<Obligatorio /></Label>
              <SelectNativo
                id="ej-ubicacion"
                value={form.idUbicacion}
                disabled={guardando}
                onChange={(e) => cambiar("idUbicacion", e.target.value)}
                aria-invalid={Boolean(erroresForm.idUbicacion)}
              >
                <option value="">Seleccionar ubicación...</option>
                {ubicacionesActivas.map((u) => (
                  <option key={u.id_ubicacion} value={u.id_ubicacion}>
                    {u.nombre_biblioteca} — {u.nombre_ubicacion}
                    {[u.seccion_ubicacion, u.estanteria_ubicacion].filter(Boolean).length > 0
                      ? ` (${[u.seccion_ubicacion, u.estanteria_ubicacion].filter(Boolean).join(" · ")})`
                      : ""}
                  </option>
                ))}
              </SelectNativo>
              {erroresForm.idUbicacion && <p role="alert" className="text-[11px] text-destructive">{erroresForm.idUbicacion}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {!editando && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ej-cantidad" className="text-xs font-semibold">Cantidad de copias<Obligatorio /></Label>
                  <Input
                    id="ej-cantidad"
                    type="number"
                    min={1}
                    max={MAX_LOTE}
                    value={form.cantidad}
                    disabled={guardando}
                    onChange={(e) => cambiar("cantidad", e.target.value)}
                    aria-invalid={Boolean(erroresForm.cantidad)}
                    className="h-10 rounded-none border-border bg-background text-xs"
                  />
                  {erroresForm.cantidad ? (
                    <p role="alert" className="text-[11px] text-destructive">{erroresForm.cantidad}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Registra varias copias iguales de una vez (máx. {MAX_LOTE}).</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="ej-codigo" className="text-xs font-semibold">Código interno</Label>
                <Input
                  id="ej-codigo"
                  value={!editando && Number(form.cantidad) > 1 ? "" : form.codigoInterno}
                  disabled={guardando || (!editando && Number(form.cantidad) > 1)}
                  onChange={(e) => cambiar("codigoInterno", e.target.value)}
                  placeholder="Se genera automáticamente"
                  className="h-10 rounded-none border-border bg-background font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  {!editando && Number(form.cantidad) > 1 ? "Con varias copias cada código se genera solo." : "Opcional. Debe ser único."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="ej-fecha" className="text-xs font-semibold">Fecha de adquisición</Label>
                <Input
                  id="ej-fecha"
                  type="date"
                  value={form.fechaAdquisicion}
                  disabled={guardando}
                  onChange={(e) => cambiar("fechaAdquisicion", e.target.value)}
                  className="h-10 rounded-none border-border bg-background text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="ej-estado" className="text-xs font-semibold">Estado</Label>
              <SelectNativo
                id="ej-estado"
                value={form.idEstado}
                disabled={guardando || enPrestamo}
                onChange={(e) => cambiar("idEstado", e.target.value)}
              >
                <option value="">Disponible (por defecto)</option>
                {estadosEditables.map((estado) => (
                  <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre_estado}</option>
                ))}
              </SelectNativo>
              {enPrestamo ? (
                <p className="text-[11px] text-muted-foreground">Está prestado: el estado cambia al registrar la devolución.</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Si aún estás catalogando o revisando las copias, márcalas en Mantenimiento y pásalas a Disponible cuando estén listas para prestar.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ej-obs" className="text-xs font-semibold">Observaciones</Label>
              <Textarea
                id="ej-obs"
                value={form.observacion}
                disabled={guardando}
                onChange={(e) => cambiar("observacion", e.target.value)}
                placeholder="Ej. Cubierta con desgaste leve"
                className="min-h-20 rounded-none border-border bg-background text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setFormAbierto(false)} disabled={guardando} className="rounded-none font-semibold">
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="rounded-none font-semibold">
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : Number(form.cantidad) > 1 ? `Crear ${form.cantidad} ejemplares` : "Crear ejemplar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(porEliminar)} onOpenChange={(abierto) => !abierto && !eliminando && setPorEliminar(null)}>
        <DialogContent role="alertdialog" className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">¿Eliminar ejemplar?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se eliminará el ejemplar <strong className="text-foreground">{porEliminar?.codinterno_ejemplar}</strong> de{" "}
              <strong className="text-foreground">{porEliminar?.titulo_libro}</strong>. Si solo tiene solicitudes rechazadas o canceladas, se borran junto con él. Si tiene préstamos o solicitudes pendientes, no se puede eliminar: márcalo como Perdido o En mantenimiento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPorEliminar(null)} disabled={eliminando} className="rounded-none font-semibold">Cancelar</Button>
            <Button variant="destructive" onClick={() => void eliminar()} disabled={eliminando} className="rounded-none font-semibold">
              {eliminando ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PaginaAdminEjemplares() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-xs text-muted-foreground">Cargando ejemplares...</p>}>
      <ContenidoEjemplares />
    </Suspense>
  );
}
