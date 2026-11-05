"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Add01Icon, RotateLeftIcon, Search01Icon } from "@hugeicons/core-free-icons";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginacionTabla } from "@/components/admin/paginacion-tabla";
import { SelectorBuscable } from "@/components/admin/selector-buscable";
import {
  ejemplaresService,
  estadosService,
  prestamosService,
  solicitudesService,
  usuariosService,
  type Prestamo,
  type Solicitud,
} from "@/services/api";
import { useBusquedaDiferida, useFiltrosUrl } from "@/hooks/use-filtros-url";
import { useListadoPaginado } from "@/hooks/use-listado-paginado";
import { finDelDiaISO, formatearFecha, hoyISO } from "@/lib/fechas";
import { getMensajeError } from "@/lib/errores";

type Pestana = "atender" | "historial" | "prestamos";

const POR_PAGINA = 20;
const FILTROS_INICIALES = { pestana: "atender", busqueda: "", abiertos: "1" };

const varianteEstado = (codigo?: string) =>
  codigo === "ACTIVO" || codigo === "APROBADA" ? "default" : codigo === "VENCIDO" || codigo === "RECHAZADA" ? "destructive" : "secondary";

const CabeceraTabla = ({ children }: { children: string }) => (
  <TableHead className="text-xs font-semibold uppercase tracking-wider">{children}</TableHead>
);

function ContenidoPrestamos() {
  const { filtros, pagina, actualizar } = useFiltrosUrl(FILTROS_INICIALES);
  const pestana = (["atender", "historial", "prestamos"].includes(filtros.pestana) ? filtros.pestana : "atender") as Pestana;
  const soloAbiertos = filtros.abiertos !== "0";
  const [textoBusqueda, setTextoBusqueda] = useBusquedaDiferida(filtros.busqueda, (valor) => actualizar({ busqueda: valor }));

  const [conteos, setConteos] = useState<{ porAtender: number | null; abiertos: number | null }>({ porAtender: null, abiertos: null });
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  // Diálogo de rechazo / observaciones
  const [rechazando, setRechazando] = useState<Solicitud | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Diálogo de devolución
  const [devolviendo, setDevolviendo] = useState<Prestamo | null>(null);
  const [observacionDevolucion, setObservacionDevolucion] = useState("");

  // Diálogo de préstamo directo (sin solicitud previa)
  const [directoAbierto, setDirectoAbierto] = useState(false);
  const [idEstadoDisponible, setIdEstadoDisponible] = useState<number | string | null>(null);
  const [formDirecto, setFormDirecto] = useState({ idUsuario: "", idEjemplar: "", fechaVencimiento: "", observaciones: "" });
  const [errorDirecto, setErrorDirecto] = useState<string | null>(null);
  const [guardandoDirecto, setGuardandoDirecto] = useState(false);

  const listado = useListadoPaginado<Solicitud | Prestamo>(
    async () => {
      const comunes = { busqueda: filtros.busqueda, page: pagina, limit: POR_PAGINA };
      if (pestana === "prestamos") return prestamosService.getPagina({ ...comunes, abiertos: soloAbiertos });
      return solicitudesService.getPagina({ ...comunes, vista: pestana === "atender" ? "porAtender" : "historial" });
    },
    [pestana, filtros.busqueda, soloAbiertos, pagina],
    { pagina, alPaginaVacia: (ultima) => actualizar({ pagina: ultima }), mensajeError: "No se pudieron cargar las solicitudes y préstamos." }
  );

  const cargarConteos = useCallback(async () => {
    try {
      const [porAtender, abiertos] = await Promise.all([
        solicitudesService.getPagina({ vista: "porAtender", limit: 1 }),
        prestamosService.getPagina({ abiertos: true, limit: 1 }),
      ]);
      setConteos({ porAtender: porAtender.total, abiertos: abiertos.total });
    } catch {
      setConteos({ porAtender: null, abiertos: null });
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(cargarConteos);
  }, [cargarConteos]);

  const recargarTodo = () => {
    listado.recargar();
    void cargarConteos();
  };

  const ejecutar = async (clave: string, accion: () => Promise<unknown>, mensajeError: string, exito?: string) => {
    setProcesando(clave);
    setErrorAccion(null);
    setAviso(null);
    try {
      await accion();
      if (exito) setAviso(exito);
      recargarTodo();
      return true;
    } catch (err) {
      setErrorAccion(getMensajeError(err, mensajeError));
      return false;
    } finally {
      setProcesando(null);
    }
  };

  const aprobar = (s: Solicitud) =>
    ejecutar(
      `s-${s.id_solicitud}`,
      () => solicitudesService.aprobar(s.id_solicitud),
      "No se pudo aprobar la solicitud.",
      "Solicitud aprobada: el ejemplar quedó reservado. Registra el préstamo cuando el lector retire el libro."
    );

  const confirmarRechazo = async () => {
    if (!rechazando) return;
    const ok = await ejecutar(
      `s-${rechazando.id_solicitud}`,
      () => solicitudesService.rechazar(rechazando.id_solicitud, motivoRechazo.trim() || undefined),
      "No se pudo rechazar la solicitud.",
      "Solicitud rechazada; el lector recibió una notificación."
    );
    if (ok) {
      setRechazando(null);
      setMotivoRechazo("");
    }
  };

  const liberarReserva = (s: Solicitud) => {
    if (!window.confirm(`¿Cancelar la reserva de "${s.titulo_libro}"? El ejemplar volverá a estar disponible.`)) return;
    return ejecutar(`s-${s.id_solicitud}`, () => solicitudesService.cancelar(s.id_solicitud), "No se pudo cancelar la reserva.", "Reserva cancelada; el ejemplar está disponible de nuevo.");
  };

  const registrarPrestamo = (s: Solicitud) =>
    ejecutar(
      `s-${s.id_solicitud}`,
      () =>
        prestamosService.crear({
          id_usuario: String(s.id_usuario),
          id_ejemplar: s.id_ejemplar!,
          id_solicitud: s.id_solicitud,
        }),
      "No se pudo registrar el préstamo.",
      "Préstamo registrado."
    );

  const renovar = (p: Prestamo) =>
    ejecutar(`p-${p.id_prestamo}`, () => prestamosService.renovar(p.id_prestamo, 7), "No se pudo renovar el préstamo.", "Préstamo renovado por 7 días.");

  const confirmarDevolucion = async () => {
    if (!devolviendo) return;
    const ok = await ejecutar(
      `p-${devolviendo.id_prestamo}`,
      async () => {
        const resultado = await prestamosService.devolver(devolviendo.id_prestamo, observacionDevolucion.trim() || undefined);
        const multa = (resultado as { multa?: { valor_multa?: number | string } | null }).multa;
        setAviso(
          multa
            ? `Devolución registrada con retraso. Se generó una multa de $${Number(multa.valor_multa).toLocaleString("es-CO")}.`
            : "Devolución registrada sin multa."
        );
      },
      "No se pudo registrar la devolución."
    );
    if (ok) {
      setDevolviendo(null);
      setObservacionDevolucion("");
    }
  };

  const abrirDirecto = async () => {
    setDirectoAbierto(true);
    setErrorDirecto(null);
    setFormDirecto({ idUsuario: "", idEjemplar: "", fechaVencimiento: "", observaciones: "" });
    try {
      const estados = await estadosService.getAll("ejemplar");
      setIdEstadoDisponible(estados.find((e) => e.codigo_estado === "DISPONIBLE")?.id_estado ?? null);
    } catch (err) {
      setErrorDirecto(getMensajeError(err, "No se pudo cargar el estado de los ejemplares."));
    }
  };

  const buscarLectores = useCallback(async (texto: string) => {
    const pagina = await usuariosService.getPagina({ busqueda: texto, limit: 20 });
    return pagina.data
      .filter((u) => u.codigo_estado === "ACTIVO")
      .map((u) => ({ valor: u.id_usuario, etiqueta: `${u.nombrecompleto_usuario} — ${u.correo_usuario}` }));
  }, []);

  const buscarEjemplares = useCallback(
    async (texto: string) => {
      if (!idEstadoDisponible) return [];
      const pagina = await ejemplaresService.getPagina({ idEstado: idEstadoDisponible, codigo: texto, limit: 20 });
      return pagina.data.map((e) => ({ valor: String(e.id_ejemplar), etiqueta: `${e.titulo_libro} — ${e.codinterno_ejemplar} (${e.nombre_biblioteca})` }));
    },
    [idEstadoDisponible]
  );

  const guardarDirecto = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formDirecto.idUsuario || !formDirecto.idEjemplar) {
      setErrorDirecto("Selecciona el lector y el ejemplar a prestar.");
      return;
    }
    setGuardandoDirecto(true);
    setErrorDirecto(null);
    try {
      await prestamosService.crear({
        id_usuario: formDirecto.idUsuario,
        id_ejemplar: formDirecto.idEjemplar,
        observaciones: formDirecto.observaciones.trim() || undefined,
        fecha_vencimiento: formDirecto.fechaVencimiento ? finDelDiaISO(formDirecto.fechaVencimiento) : undefined,
      });
      setDirectoAbierto(false);
      setAviso("Préstamo registrado.");
      actualizar({ pestana: "prestamos" });
      recargarTodo();
    } catch (err) {
      setErrorDirecto(getMensajeError(err, "No se pudo registrar el préstamo."));
    } finally {
      setGuardandoDirecto(false);
    }
  };

  const cargandoFila = (clave: string) => procesando === clave;
  const etiquetaConteo = (valor: number | null) => (valor === null ? "…" : valor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">Solicitudes y préstamos</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Aprueba las solicitudes de los lectores, registra la entrega de los libros y recibe las devoluciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={recargarTodo} disabled={listado.cargando} className="h-10 rounded-none border-border px-4 gap-2 font-semibold">
            <Icon icon={RotateLeftIcon} className={`size-4 ${listado.cargando ? "animate-spin text-primary" : ""}`} /> Actualizar
          </Button>
          <Button onClick={() => void abrirDirecto()} className="h-10 rounded-none bg-foreground px-5 text-xs font-semibold text-background hover:bg-foreground/90 gap-2">
            <Icon icon={Add01Icon} className="size-4" /> Préstamo directo
          </Button>
        </div>
      </div>

      {(errorAccion || listado.error) && (
        <div role="alert" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">{errorAccion ?? listado.error}</div>
      )}
      {aviso && <div role="status" className="border border-primary/40 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">{aviso}</div>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button size="sm" variant={pestana === "atender" ? "default" : "outline"} onClick={() => actualizar({ pestana: "atender" })} className="max-w-full whitespace-normal rounded-none text-xs font-semibold">
            Por atender ({etiquetaConteo(conteos.porAtender)})
          </Button>
          <Button size="sm" variant={pestana === "historial" ? "default" : "outline"} onClick={() => actualizar({ pestana: "historial" })} className="max-w-full whitespace-normal rounded-none text-xs font-semibold">
            Historial de solicitudes
          </Button>
          <Button size="sm" variant={pestana === "prestamos" ? "default" : "outline"} onClick={() => actualizar({ pestana: "prestamos" })} className="max-w-full whitespace-normal rounded-none text-xs font-semibold">
            Préstamos ({etiquetaConteo(conteos.abiertos)} abiertos)
          </Button>
        </div>
        <div className="relative w-full lg:w-72">
          <Icon icon={Search01Icon} className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input type="search" value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} placeholder="Buscar por libro, lector o código" className="h-10 rounded-none border-border bg-background pl-9 text-xs" />
        </div>
      </div>

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardContent className="p-3 sm:p-5">
          {pestana === "prestamos" && (
            <div className="mb-3 flex justify-end">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={soloAbiertos} onChange={(e) => actualizar({ abiertos: e.target.checked ? "1" : "0" })} className="size-3.5 accent-primary" />
                Solo abiertos (activos y vencidos)
              </label>
            </div>
          )}

          {listado.cargando ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-none" />)}</div>
          ) : listado.datos.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {filtros.busqueda ? "Ningún resultado coincide con la búsqueda." : pestana === "atender" ? "No hay solicitudes por atender." : pestana === "historial" ? "Aún no hay solicitudes atendidas." : "No hay préstamos para mostrar."}
            </p>
          ) : pestana === "atender" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <CabeceraTabla>Libro</CabeceraTabla>
                    <CabeceraTabla>Lector</CabeceraTabla>
                    <CabeceraTabla>Sede</CabeceraTabla>
                    <CabeceraTabla>Solicitada</CabeceraTabla>
                    <CabeceraTabla>Estado</CabeceraTabla>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listado.datos as Solicitud[]).map((s) => (
                    <TableRow key={s.id_solicitud}>
                      <TableCell className="font-serif text-base text-foreground">
                        {s.titulo_libro}
                        {s.codinterno_ejemplar && <span className="block font-mono text-[10px] text-muted-foreground">{s.codinterno_ejemplar}</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="block font-semibold text-foreground">{s.nombrecompleto_usuario}</span>
                        <span className="text-muted-foreground">{s.correo_usuario}</span>
                      </TableCell>
                      <TableCell className="text-xs">{s.nombre_biblioteca}</TableCell>
                      <TableCell className="font-mono text-xs">{formatearFecha(s.fechasolicitud_solicitud)}</TableCell>
                      <TableCell>
                        <Badge variant={varianteEstado(s.codigo_estado)} className="rounded-none text-[10px] font-semibold uppercase tracking-wider">{s.nombre_estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {s.codigo_estado === "PENDIENTE" ? (
                            <>
                              <Button size="sm" disabled={cargandoFila(`s-${s.id_solicitud}`)} onClick={() => void aprobar(s)} className="h-8 rounded-none text-xs font-semibold">Aprobar</Button>
                              <Button size="sm" variant="outline" disabled={cargandoFila(`s-${s.id_solicitud}`)} onClick={() => setRechazando(s)} className="h-8 rounded-none border-border text-xs font-semibold">Rechazar</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" disabled={cargandoFila(`s-${s.id_solicitud}`)} onClick={() => void registrarPrestamo(s)} className="h-8 rounded-none text-xs font-semibold">
                                Registrar préstamo
                              </Button>
                              <Button size="sm" variant="ghost" disabled={cargandoFila(`s-${s.id_solicitud}`)} onClick={() => void liberarReserva(s)} className="h-8 rounded-none text-xs font-semibold">
                                Liberar reserva
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : pestana === "historial" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <CabeceraTabla>Libro</CabeceraTabla>
                    <CabeceraTabla>Lector</CabeceraTabla>
                    <CabeceraTabla>Respondida</CabeceraTabla>
                    <CabeceraTabla>Atendió</CabeceraTabla>
                    <CabeceraTabla>Estado</CabeceraTabla>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listado.datos as Solicitud[]).map((s) => (
                    <TableRow key={s.id_solicitud}>
                      <TableCell className="font-serif text-base text-foreground">{s.titulo_libro}</TableCell>
                      <TableCell className="text-xs">{s.nombrecompleto_usuario}</TableCell>
                      <TableCell className="font-mono text-xs">{formatearFecha(s.fecharespuesta_solicitud ?? s.fechasolicitud_solicitud)}</TableCell>
                      <TableCell className="text-xs">
                        {s.atendido_por_nombre ?? "—"}
                        {s.observaciones_solicitud && <span className="block text-muted-foreground">{s.observaciones_solicitud}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={varianteEstado(s.codigo_estado)} className="rounded-none text-[10px] font-semibold uppercase tracking-wider">{s.nombre_estado}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <CabeceraTabla>Libro</CabeceraTabla>
                    <CabeceraTabla>Lector</CabeceraTabla>
                    <CabeceraTabla>Sede</CabeceraTabla>
                    <CabeceraTabla>Prestado</CabeceraTabla>
                    <CabeceraTabla>Vence / devuelto</CabeceraTabla>
                    <CabeceraTabla>Estado</CabeceraTabla>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listado.datos as Prestamo[]).map((p) => {
                    const abierto = p.codigo_estado === "ACTIVO" || p.codigo_estado === "VENCIDO";
                    return (
                      <TableRow key={p.id_prestamo}>
                        <TableCell className="font-serif text-base text-foreground">
                          {p.titulo_libro}
                          {p.codinterno_ejemplar && <span className="block font-mono text-[10px] text-muted-foreground">{p.codinterno_ejemplar}</span>}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="block font-semibold text-foreground">{p.nombrecompleto_usuario}</span>
                          <span className="text-muted-foreground">{p.correo_usuario}</span>
                        </TableCell>
                        <TableCell className="text-xs">{p.nombre_biblioteca}</TableCell>
                        <TableCell className="font-mono text-xs">{formatearFecha(p.fechaprestamo_prestamo)}</TableCell>
                        <TableCell className="font-mono text-xs">{formatearFecha(p.fechadevolucion_prestamo ?? p.fechavencimiento_prestamo)}</TableCell>
                        <TableCell>
                          <Badge variant={varianteEstado(p.codigo_estado)} className="rounded-none text-[10px] font-semibold uppercase tracking-wider">{p.nombre_estado}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {abierto && (
                            <div className="flex flex-wrap justify-end gap-2">
                              {p.codigo_estado === "ACTIVO" && (
                                <Button size="sm" variant="outline" disabled={cargandoFila(`p-${p.id_prestamo}`)} onClick={() => void renovar(p)} className="h-8 rounded-none border-border text-xs font-semibold">
                                  Renovar +7d
                                </Button>
                              )}
                              <Button size="sm" disabled={cargandoFila(`p-${p.id_prestamo}`)} onClick={() => setDevolviendo(p)} className="h-8 rounded-none text-xs font-semibold">
                                Recibir devolución
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {!listado.cargando && (
            <PaginacionTabla pagina={pagina} totalPaginas={listado.totalPaginas} total={listado.total} limite={POR_PAGINA} onCambiar={(p) => actualizar({ pagina: p })} />
          )}
        </CardContent>
      </Card>

      {/* Rechazar solicitud */}
      <Dialog open={Boolean(rechazando)} onOpenChange={(abierto) => !abierto && setRechazando(null)}>
        <DialogContent className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Rechazar solicitud</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              El lector recibirá una notificación. Puedes indicar el motivo (opcional).
            </DialogDescription>
          </DialogHeader>
          <Textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Ej. El ejemplar está reservado para consulta en sala" className="min-h-20 rounded-none border-border bg-background text-xs" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechazando(null)} className="rounded-none font-semibold">Cancelar</Button>
            <Button variant="destructive" disabled={procesando !== null} onClick={() => void confirmarRechazo()} className="rounded-none font-semibold">Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recibir devolución */}
      <Dialog open={Boolean(devolviendo)} onOpenChange={(abierto) => !abierto && setDevolviendo(null)}>
        <DialogContent className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Recibir devolución</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              <strong className="text-foreground">{devolviendo?.titulo_libro}</strong> — {devolviendo?.nombrecompleto_usuario}. Si se entrega después del vencimiento se generará una multa automáticamente.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={observacionDevolucion} onChange={(e) => setObservacionDevolucion(e.target.value)} placeholder="Observaciones sobre el estado del libro (opcional)" className="min-h-20 rounded-none border-border bg-background text-xs" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevolviendo(null)} className="rounded-none font-semibold">Cancelar</Button>
            <Button disabled={procesando !== null} onClick={() => void confirmarDevolucion()} className="rounded-none font-semibold">Confirmar devolución</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Préstamo directo */}
      <Dialog open={directoAbierto} onOpenChange={(abierto) => !guardandoDirecto && setDirectoAbierto(abierto)}>
        <DialogContent className="admin-touch sm:max-w-lg rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Préstamo directo</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Para lectores que piden el libro en el mostrador. Los campos marcados con <span className="font-semibold text-destructive">*</span> son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={guardarDirecto} noValidate className="flex flex-col gap-4">
            {errorDirecto && <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{errorDirecto}</p>}
            <div className="flex flex-col gap-2">
              <Label htmlFor="pd-usuario" className="text-xs font-semibold">Lector<span className="text-destructive"> *</span></Label>
              <SelectorBuscable id="pd-usuario" valor={formDirecto.idUsuario} onChange={(idUsuario) => setFormDirecto((f) => ({ ...f, idUsuario }))} buscar={buscarLectores} placeholder="Buscar lector por nombre, correo o documento" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pd-ejemplar" className="text-xs font-semibold">Ejemplar disponible<span className="text-destructive"> *</span></Label>
              <SelectorBuscable id="pd-ejemplar" valor={formDirecto.idEjemplar} onChange={(idEjemplar) => setFormDirecto((f) => ({ ...f, idEjemplar }))} buscar={buscarEjemplares} placeholder="Buscar ejemplar por título o código" vacio="No hay ejemplares disponibles" />
            </div>
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="pd-fecha" className="text-xs font-semibold">Fecha de vencimiento</Label>
              <Input id="pd-fecha" type="date" min={hoyISO()} value={formDirecto.fechaVencimiento} onChange={(e) => setFormDirecto((f) => ({ ...f, fechaVencimiento: e.target.value }))} className="h-10 rounded-none border-border bg-background text-xs" />
              <p className="text-[11px] text-muted-foreground">Si se deja vacía se usan los días máximos de préstamo de la configuración.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pd-obs" className="text-xs font-semibold">Observaciones</Label>
              <Textarea id="pd-obs" value={formDirecto.observaciones} onChange={(e) => setFormDirecto((f) => ({ ...f, observaciones: e.target.value }))} className="min-h-16 rounded-none border-border bg-background text-xs" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDirectoAbierto(false)} disabled={guardandoDirecto} className="rounded-none font-semibold">Cancelar</Button>
              <Button type="submit" disabled={guardandoDirecto} className="rounded-none font-semibold">{guardandoDirecto ? "Registrando..." : "Registrar préstamo"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PaginaAdminPrestamos() {
  return (
    <Suspense fallback={null}>
      <ContenidoPrestamos />
    </Suspense>
  );
}
