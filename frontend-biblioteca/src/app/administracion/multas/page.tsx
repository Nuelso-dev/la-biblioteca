"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Coins01Icon, AlertCircleIcon, RotateLeftIcon, CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginacionTabla } from "@/components/admin/paginacion-tabla";
import { multasService, type Multa, type ResumenMultas } from "@/services/multas.service";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { useBusquedaDiferida, useFiltrosUrl } from "@/hooks/use-filtros-url";
import { useListadoPaginado } from "@/hooks/use-listado-paginado";
import { formatearFecha } from "@/lib/fechas";
import { getMensajeError } from "@/lib/errores";

const formatearMonto = (monto?: number | string | null) => {
  const valor = Number(monto);
  return Number.isFinite(valor)
    ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor)
    : "Monto no disponible";
};

const POR_PAGINA = 20;
const FILTROS_INICIALES = { estado: "PENDIENTE", busqueda: "" };

const OPCIONES_ESTADO = [
  { valor: "PENDIENTE", etiqueta: "Pendientes" },
  { valor: "PAGADA", etiqueta: "Pagadas" },
  { valor: "CANCELADA", etiqueta: "Exoneradas" },
  { valor: "TODAS", etiqueta: "Historial completo" },
];

function ContenidoMultas() {
  const { rol } = useAutenticacion();
  const { filtros, pagina, actualizar } = useFiltrosUrl(FILTROS_INICIALES);
  const [textoBusqueda, setTextoBusqueda] = useBusquedaDiferida(filtros.busqueda, (valor) => actualizar({ busqueda: valor }));
  const [resumen, setResumen] = useState<ResumenMultas | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | number | null>(null);
  const [errorOperacion, setErrorOperacion] = useState("");

  const listado = useListadoPaginado<Multa>(
    () =>
      multasService.getPagina({
        estado: filtros.estado === "TODAS" ? undefined : filtros.estado,
        busqueda: filtros.busqueda,
        page: pagina,
        limit: POR_PAGINA,
      }),
    [filtros.estado, filtros.busqueda, pagina],
    { pagina, alPaginaVacia: (ultima) => actualizar({ pagina: ultima }), mensajeError: "No se pudieron cargar las multas." }
  );

  const cargarResumen = useCallback(async () => {
    try {
      setResumen(await multasService.getResumen());
    } catch {
      setResumen(null);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(cargarResumen);
  }, [cargarResumen]);

  const recargarTodo = () => {
    listado.recargar();
    void cargarResumen();
  };

  const ejecutar = async (multa: Multa, accion: () => Promise<unknown>, mensajeError: string) => {
    setProcesandoId(multa.id_multa);
    setErrorOperacion("");
    try {
      await accion();
      recargarTodo();
    } catch (operationError) {
      setErrorOperacion(getMensajeError(operationError, mensajeError));
    } finally {
      setProcesandoId(null);
    }
  };

  const registrarPago = (multa: Multa) =>
    ejecutar(multa, () => multasService.registrarPago(multa.id_multa), "No se pudo registrar el pago.");

  const exonerar = (multa: Multa) => {
    if (!window.confirm(`¿Exonerar la multa #${multa.id_multa}? Esta acción no se puede deshacer.`)) return;
    return ejecutar(multa, () => multasService.cancelar(multa.id_multa, "Exonerada por administración"), "No se pudo exonerar la multa.");
  };

  const { datos: multas, cargando, error } = listado;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-foreground tracking-[-0.02em]">Multas</h1>
          <p className="text-xs text-muted-foreground">Las multas se generan al registrar devoluciones con retraso. Aquí puedes cobrarlas o exonerarlas.</p>
        </div>
        <div className="hidden sm:flex size-10 rounded-none bg-secondary text-primary items-center justify-center border border-border">
          <Icon icon={Coins01Icon} className="size-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 border border-border bg-card">
        <div className="border-r border-border p-4 sm:p-5">
          <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Multas pendientes</div>
          <div className="mt-1.5 font-serif text-2xl sm:text-3xl leading-none text-primary">{resumen ? resumen.pendientes : "..."}</div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Saldo pendiente</div>
          <div className="mt-1.5 font-serif text-2xl sm:text-3xl leading-none text-foreground">{resumen ? formatearMonto(resumen.saldoPendiente) : "..."}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {OPCIONES_ESTADO.map((opcion) => (
            <Button
              key={opcion.valor}
              size="sm"
              variant={filtros.estado === opcion.valor ? "default" : "outline"}
              onClick={() => actualizar({ estado: opcion.valor })}
              className="rounded-none text-xs font-semibold"
            >
              {opcion.etiqueta}
            </Button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Icon icon={Search01Icon} className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input type="search" value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} placeholder="Buscar por lector, libro o código" className="h-10 rounded-none border-border bg-background pl-9 text-xs" />
        </div>
      </div>

      {errorOperacion && (
        <p role="alert" className="rounded-none border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {errorOperacion}
        </p>
      )}

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardContent className="p-5">
          {cargando ? (
            <div className="flex flex-col gap-3" role="status" aria-label="Cargando multas">
              {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full rounded-none" />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Icon icon={AlertCircleIcon} className="size-8 text-destructive" />
              <p role="alert" className="text-xs text-destructive font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={recargarTodo} className="gap-2 font-semibold rounded-none">
                <Icon icon={RotateLeftIcon} className="size-4" /> Reintentar
              </Button>
            </div>
          ) : multas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <Icon icon={CheckmarkCircle02Icon} className="size-8 text-primary" />
              <h2 className="font-serif text-2xl font-normal text-foreground">
                {filtros.busqueda ? "Ninguna multa coincide con la búsqueda" : filtros.estado === "PENDIENTE" ? "No hay multas pendientes" : "No hay multas para mostrar"}
              </h2>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">ID</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Lector</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Libro</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Motivo</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Generada</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Monto</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Estado</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multas.map((multa) => {
                    const procesando = procesandoId === multa.id_multa;
                    const pendiente = multa.codigo_estado === "PENDIENTE";
                    return (
                      <TableRow key={multa.id_multa}>
                        <TableCell className="font-mono text-xs font-semibold">{multa.id_multa}</TableCell>
                        <TableCell className="text-xs">
                          <span className="block font-semibold text-foreground">{multa.nombrecompleto_usuario || "Lector no disponible"}</span>
                          <span className="text-muted-foreground">{multa.correo_usuario}</span>
                        </TableCell>
                        <TableCell className="font-serif font-normal text-foreground text-base">
                          {multa.titulo_libro || "Libro no disponible"}
                          {multa.codinterno_ejemplar && <span className="block font-mono text-[10px] text-muted-foreground">{multa.codinterno_ejemplar}</span>}
                        </TableCell>
                        <TableCell className="max-w-xs text-xs text-muted-foreground">
                          {multa.motivo_multa || "Sin descripción"}
                          {multa.diasretraso_multa != null && <span className="block">{multa.diasretraso_multa} días de retraso</span>}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{formatearFecha(multa.fechageneracion_multa)}</TableCell>
                        <TableCell className="font-serif font-normal text-base text-primary">{formatearMonto(multa.valor_multa)}</TableCell>
                        <TableCell>
                          <Badge variant={pendiente ? "destructive" : "secondary"} className="font-semibold text-[10px] uppercase tracking-wider rounded-none">
                            {multa.nombre_estado || "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {pendiente && (
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button size="sm" variant="outline" disabled={procesando} onClick={() => void registrarPago(multa)} className="rounded-none font-semibold text-xs border-border h-8">
                                {procesando ? "Procesando..." : "Registrar pago"}
                              </Button>
                              {rol === "administrador" && (
                                <Button size="sm" variant="ghost" disabled={procesando} onClick={() => void exonerar(multa)} className="rounded-none font-semibold text-xs h-8">
                                  Exonerar
                                </Button>
                              )}
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

          {!cargando && !error && (
            <PaginacionTabla pagina={pagina} totalPaginas={listado.totalPaginas} total={listado.total} limite={POR_PAGINA} onCambiar={(p) => actualizar({ pagina: p })} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaginaAdminMultas() {
  return (
    <Suspense fallback={null}>
      <ContenidoMultas />
    </Suspense>
  );
}
