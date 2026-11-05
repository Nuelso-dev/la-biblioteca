"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Book02Icon,
  AlertCircleIcon,
  RotateLeftIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { prestamosService, solicitudesService } from "@/services/api";
import type { Prestamo } from "@/services/prestamos.service";
import type { Solicitud } from "@/services/solicitudes.service";
import { formatearFecha as formatearFechaLib } from "@/lib/fechas";

const formatearFecha = (valor?: string | null) => formatearFechaLib(valor, "Sin fecha");

export function PestanaPrestamos() {
  const { estaAutenticado, cargando: cargandoAutenticacion } = useAutenticacion();
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [exitoAccion, setExitoAccion] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (cargandoAutenticacion) return;

    if (!estaAutenticado) {
      setPrestamos([]);
      setSolicitudes([]);
      setCargandoDatos(false);
      setError(null);
      return;
    }

    setCargandoDatos(true);
    setError(null);

    try {
      const [listaPrestamos, listaSolicitudes] = await Promise.all([
        prestamosService.getMios(),
        solicitudesService.getMias(),
      ]);
      setPrestamos(listaPrestamos);
      setSolicitudes(listaSolicitudes);
    } catch (err) {
      setPrestamos([]);
      setSolicitudes([]);
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus préstamos.");
    } finally {
      setCargandoDatos(false);
    }
  }, [cargandoAutenticacion, estaAutenticado]);

  useEffect(() => {
    let cancelado = false;
    void Promise.resolve().then(() => {
      if (!cancelado) void cargarDatos();
    });
    return () => {
      cancelado = true;
    };
  }, [cargarDatos]);

  const ejecutarAccion = async (clave: string, accion: () => Promise<unknown>, mensajeExito: string, mensajeError: string) => {
    setProcesandoId(clave);
    setErrorAccion(null);
    setExitoAccion(null);
    try {
      await accion();
      setExitoAccion(mensajeExito);
      await cargarDatos();
      setTimeout(() => setExitoAccion(null), 5000);
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : mensajeError);
    } finally {
      setProcesandoId(null);
    }
  };

  const renovarPrestamo = (prestamo: Prestamo) =>
    ejecutarAccion(
      `prestamo-${prestamo.id_prestamo}`,
      () => prestamosService.renovar(prestamo.id_prestamo, 7),
      `Préstamo renovado por 7 días más para "${prestamo.titulo_libro || "el libro"}".`,
      "No se pudo renovar el préstamo."
    );

  const cancelarSolicitud = (solicitud: Solicitud) =>
    ejecutarAccion(
      `solicitud-${solicitud.id_solicitud}`,
      () => solicitudesService.cancelar(solicitud.id_solicitud),
      `Se canceló tu solicitud de "${solicitud.titulo_libro || "el libro"}".`,
      "No se pudo cancelar la solicitud."
    );

  if (cargandoAutenticacion || cargandoDatos) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <Icon icon={Book02Icon} className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Cargando tus préstamos...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <EstadoVacio
          tipo="general"
          titulo="Inicia sesión para ver tus préstamos"
          descripcion="Necesitas iniciar sesión para ver tus préstamos."
          enlaceBoton="/iniciar-sesion"
          textoBoton="Iniciar sesión"
        />
      </div>
    );
  }

  const solicitudesPendientes = solicitudes.filter((s) => s.codigo_estado === "PENDIENTE");
  const solicitudesHistorial = solicitudes.filter((s) => s.codigo_estado !== "PENDIENTE");

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <p className="text-xs text-muted-foreground">Solicitudes y préstamos de tu cuenta.</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] uppercase font-semibold rounded-none">
            {solicitudesPendientes.length} {solicitudesPendientes.length === 1 ? "solicitud pendiente" : "solicitudes pendientes"}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase font-semibold rounded-none">
            {prestamos.length} {prestamos.length === 1 ? "préstamo" : "préstamos"}
          </Badge>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 rounded-none shadow-none">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Icon icon={AlertCircleIcon} className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <h3 className="font-sans font-semibold text-foreground">No se pudieron cargar tus préstamos</h3>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void cargarDatos()} className="gap-2 rounded-none">
              <Icon icon={RotateLeftIcon} className="size-4" /> Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {errorAccion && (
        <div role="alert" className="rounded-none border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
          {errorAccion}
        </div>
      )}

      {exitoAccion && (
        <div role="status" className="rounded-none border border-primary/40 bg-primary/5 p-4 text-xs font-semibold text-primary">
          {exitoAccion}
        </div>
      )}

      {!error && prestamos.length === 0 && solicitudes.length === 0 ? (
        <EstadoVacio
          tipo="prestamos"
          titulo="Aún no tienes solicitudes ni préstamos"
          descripcion="Cuando solicites un libro, aquí verás si la biblioteca lo aprobó y cuándo debes devolverlo."
          enlaceBoton="/libros"
          textoBoton="Explorar catálogo"
        />
      ) : (
        <div className="flex flex-col gap-8">
          {solicitudesPendientes.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-serif text-lg font-normal text-foreground">Solicitudes pendientes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {solicitudesPendientes.map((solicitud) => (
                  <Card key={solicitud.id_solicitud} className="border-border bg-card shadow-none rounded-none">
                    <CardContent className="p-5 flex flex-col gap-4">
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <h4 className="truncate font-serif text-lg font-normal text-foreground">{solicitud.titulo_libro || "Título no disponible"}</h4>
                        {solicitud.nombre_biblioteca && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Icon icon={Location01Icon} className="size-3.5 text-primary shrink-0" /> {solicitud.nombre_biblioteca}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Solicitada</span>
                          <span className="text-xs font-mono font-semibold text-foreground">{formatearFecha(solicitud.fechasolicitud_solicitud)}</span>
                        </div>
                        <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider rounded-none">
                          {solicitud.nombre_estado}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void cancelarSolicitud(solicitud)}
                        disabled={procesandoId === `solicitud-${solicitud.id_solicitud}`}
                        className="w-full rounded-none text-xs font-semibold h-9"
                      >
                        {procesandoId === `solicitud-${solicitud.id_solicitud}` ? "Cancelando..." : "Cancelar solicitud"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {prestamos.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-serif text-lg font-normal text-foreground">Préstamos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {prestamos.map((prestamo) => {
                  const activo = prestamo.codigo_estado === "ACTIVO";
                  const clave = `prestamo-${prestamo.id_prestamo}`;
                  return (
                    <Card key={prestamo.id_prestamo} className="border-border bg-card shadow-none rounded-none transition-colors hover:border-primary">
                      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-none border border-border bg-secondary text-primary">
                            <Icon icon={Book02Icon} className="size-5" />
                          </div>
                          <div className="min-w-0 flex flex-col gap-0.5">
                            <h4 className="truncate font-serif text-lg font-normal text-foreground">{prestamo.titulo_libro || "Título no disponible"}</h4>
                            {prestamo.nombre_biblioteca && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Icon icon={Location01Icon} className="size-3.5 text-primary shrink-0" /> {prestamo.nombre_biblioteca}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                          <div>
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {prestamo.fechadevolucion_prestamo ? "Devuelto el" : "Debes devolver antes del"}
                            </span>
                            <span className="text-xs font-mono font-semibold text-foreground">
                              {formatearFecha(prestamo.fechadevolucion_prestamo ?? prestamo.fechavencimiento_prestamo)}
                            </span>
                          </div>
                          <Badge variant={activo ? "default" : "secondary"} className="font-semibold text-[10px] uppercase tracking-wider rounded-none">
                            {prestamo.nombre_estado || "Sin estado"}
                          </Badge>
                        </div>

                        {activo && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void renovarPrestamo(prestamo)}
                            disabled={procesandoId === clave}
                            className="w-full gap-2 rounded-none text-xs font-semibold h-9"
                          >
                            <Icon icon={RotateLeftIcon} className="size-3.5" />
                            {procesandoId === clave ? "Renovando..." : "Renovar plazo (+7 días)"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <p className="rounded-none bg-secondary p-4 text-xs leading-relaxed text-muted-foreground border border-border">
                Las devoluciones las registra el personal de la biblioteca al recibir el libro. Puedes renovar un préstamo activo antes de su vencimiento.
              </p>
            </section>
          )}

          {solicitudesHistorial.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-serif text-lg font-normal text-foreground">Historial de solicitudes</h3>
              <div className="flex flex-col border border-border divide-y divide-border">
                {solicitudesHistorial.map((solicitud) => (
                  <div key={solicitud.id_solicitud} className="flex flex-col gap-1 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground">{solicitud.titulo_libro}</span>
                      {solicitud.observaciones_solicitud && (
                        <p className="text-muted-foreground">{solicitud.observaciones_solicitud}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">{formatearFecha(solicitud.fecharespuesta_solicitud ?? solicitud.fechasolicitud_solicitud)}</span>
                      <Badge variant={solicitud.codigo_estado === "APROBADA" ? "default" : "secondary"} className="font-semibold text-[10px] uppercase tracking-wider rounded-none">
                        {solicitud.nombre_estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
