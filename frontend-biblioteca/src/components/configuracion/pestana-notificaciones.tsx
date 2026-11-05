"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Notification01Icon,
  RotateLeftIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { PaginacionTabla } from "@/components/admin/paginacion-tabla";
import { notificacionesService } from "@/services/notificaciones.service";
import { formatearFechaCorta } from "@/lib/fechas";

interface Notificacion {
  id_notificacion: number | string;
  titulo_notificacion: string;
  mensaje_notificacion?: string | null;
  tipo_notificacion?: string | null;
  /** Estado: 'NO_LEIDA' | 'LEIDA' */
  codigo_estado?: string;
  nombre_estado?: string;
  fechacreacion_notificacion?: string;
}

const POR_PAGINA = 10;

export function PestanaNotificaciones() {
  const { usuario, estaAutenticado, cargando: cargandoAuth } = useAutenticacion();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [sinLeer, setSinLeer] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarNotificaciones = useCallback(async () => {
    if (cargandoAuth) return;
    if (!estaAutenticado || !usuario?.id) {
      setNotificaciones([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const [resultado, cantidadSinLeer] = await Promise.all([
        notificacionesService.getPagina({ page: pagina, limit: POR_PAGINA }),
        notificacionesService.contarNoLeidas(),
      ]);
      setNotificaciones(resultado.data);
      setTotal(resultado.total);
      setTotalPaginas(resultado.totalPages);
      setSinLeer(cantidadSinLeer);
      // Si se eliminó la última de la página, se retrocede a la anterior
      if (resultado.data.length === 0 && resultado.total > 0 && pagina > 1) setPagina(resultado.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones.");
      setNotificaciones([]);
    } finally {
      setCargando(false);
    }
  }, [cargandoAuth, estaAutenticado, usuario?.id, pagina]);

  const [procesando, setProcesando] = useState<string | number | null>(null);

  const ejecutar = async (clave: string | number, accion: () => Promise<unknown>) => {
    setProcesando(clave);
    setError(null);
    try {
      await accion();
      await cargarNotificaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la notificación.");
    } finally {
      setProcesando(null);
    }
  };

  useEffect(() => {
    let cancelado = false;
    void Promise.resolve().then(() => {
      if (!cancelado) {
        void cargarNotificaciones();
      }
    });
    return () => {
      cancelado = true;
    };
  }, [cargarNotificaciones]);

  if (cargandoAuth || cargando) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <Icon icon={Notification01Icon} className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <EstadoVacio
          tipo="general"
          titulo="Inicia sesión para ver notificaciones"
          descripcion="Necesitas iniciar sesión para ver tus notificaciones."
          enlaceBoton="/iniciar-sesion"
          textoBoton="Iniciar sesión"
        />
      </div>
    );
  }


  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="text-xs text-muted-foreground">
          Avisos del sistema sobre préstamos, devoluciones y multas.
        </p>
        <div className="flex items-center gap-2">
          {sinLeer > 0 && (
            <Badge variant="destructive" className="text-[10px] uppercase font-semibold rounded-none">
              {sinLeer} sin leer
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] uppercase font-semibold rounded-none">
            {total} {total === 1 ? "notificación" : "notificaciones"}
          </Badge>
          {sinLeer > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={procesando !== null}
              onClick={() => void ejecutar("todas", () => notificacionesService.marcarTodasLeidas())}
              className="h-7 rounded-none text-[10px] font-semibold uppercase"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 rounded-none shadow-none">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-destructive font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void cargarNotificaciones()}
              className="gap-2 rounded-none"
            >
              <Icon icon={RotateLeftIcon} className="size-4" /> Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && notificaciones.length === 0 ? (
        <EstadoVacio
          tipo="general"
          titulo="Sin notificaciones"
          descripcion="No tienes notificaciones por ahora."
          enlaceBoton="/libros"
          textoBoton="Explorar catálogo"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notificaciones.map((n) => {
            const leida = n.codigo_estado === "LEIDA";
            return (
              <Card
                key={n.id_notificacion}
                className={`border rounded-none shadow-none transition-colors ${
                  leida ? "border-border bg-card" : "border-primary/30 bg-primary/5"
                }`}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-none border ${
                      leida
                        ? "border-border bg-secondary text-muted-foreground"
                        : "border-primary/30 bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon icon={leida ? CheckmarkCircle02Icon : Notification01Icon} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-sans text-sm font-semibold text-foreground leading-tight">
                        {n.titulo_notificacion}
                      </h3>
                      <Badge
                        variant={leida ? "secondary" : "default"}
                        className="shrink-0 text-[10px] uppercase font-semibold rounded-none"
                      >
                        {n.nombre_estado ?? (leida ? "Leída" : "No leída")}
                      </Badge>
                    </div>
                    {n.mensaje_notificacion && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.mensaje_notificacion}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Icon icon={Clock01Icon} className="size-3" />
                        {formatearFechaCorta(n.fechacreacion_notificacion)}
                      </div>
                      <div className="flex items-center gap-2">
                        {!leida && (
                          <button
                            type="button"
                            disabled={procesando !== null}
                            onClick={() => void ejecutar(n.id_notificacion, () => notificacionesService.marcarLeida(n.id_notificacion))}
                            className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline disabled:opacity-50"
                          >
                            Marcar leída
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={procesando !== null}
                          onClick={() => void ejecutar(n.id_notificacion, () => notificacionesService.eliminar(n.id_notificacion))}
                          className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:underline disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PaginacionTabla pagina={pagina} totalPaginas={totalPaginas} total={total} limite={POR_PAGINA} onCambiar={setPagina} />
    </div>
  );
}
