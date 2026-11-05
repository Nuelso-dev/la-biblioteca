"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircleIcon,
  RotateLeftIcon,
  CheckmarkCircle02Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { multasService, type Multa } from "@/services/multas.service";
import { formatearFecha as formatearFechaLib } from "@/lib/fechas";

const formatearFecha = (valor?: string) => formatearFechaLib(valor, "Fecha no registrada");

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(monto || 0);
};

export function PestanaMultas() {
  const { usuario, estaAutenticado, cargando: cargandoAutenticacion } = useAutenticacion();
  const [multas, setMultas] = useState<Multa[]>([]);
  const [cargandoMultas, setCargandoMultas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMultas = useCallback(async () => {
    if (cargandoAutenticacion) return;

    if (!estaAutenticado || !usuario?.id) {
      setMultas([]);
      setCargandoMultas(false);
      setError(null);
      return;
    }

    setCargandoMultas(true);
    setError(null);

    try {
      const respuesta = await multasService.getByUsuario(usuario.id);
      if (!Array.isArray(respuesta)) {
        throw new Error("La respuesta de multas no tiene un formato válido.");
      }
      setMultas(respuesta.filter((m) => m.id_multa != null));
    } catch (err) {
      setMultas([]);
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus multas.");
    } finally {
      setCargandoMultas(false);
    }
  }, [cargandoAutenticacion, estaAutenticado, usuario]);

  useEffect(() => {
    let cancelado = false;
    void Promise.resolve().then(() => {
      if (!cancelado) {
        void cargarMultas();
      }
    });
    return () => {
      cancelado = true;
    };
  }, [cargarMultas]);

  if (cargandoAutenticacion || cargandoMultas) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <Icon icon={Invoice01Icon} className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Cargando tus multas...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <EstadoVacio
          tipo="general"
          titulo="Inicia sesión para consultar tus multas"
          descripcion="Necesitas iniciar sesión para consultar tus multas."
          enlaceBoton="/iniciar-sesion"
          textoBoton="Iniciar sesión"
        />
      </div>
    );
  }

  const multasPendientes = multas.filter(
    (m) => (m.codigo_estado ?? "").toUpperCase() === "PENDIENTE" || (m.nombre_estado ?? "").toLowerCase() === "pendiente"
  );
  const totalPendiente = multasPendientes.reduce((acc, m) => acc + Number(m.valor_multa ?? 0), 0);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="text-xs text-muted-foreground">Multas por retrasos en la devolución de ejemplares.</p>
        <div className="flex items-center gap-2">
          {totalPendiente > 0 && (
            <Badge variant="destructive" className="text-[10px] uppercase font-semibold rounded-none">
              Por pagar: {formatearMoneda(totalPendiente)}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] uppercase font-semibold rounded-none">
            {multas.length} {multas.length === 1 ? "registro" : "registros"}
          </Badge>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 rounded-none shadow-none">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Icon icon={AlertCircleIcon} className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <h3 className="font-sans font-semibold text-foreground">No se pudieron cargar tus multas</h3>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void cargarMultas()} className="gap-2 rounded-none">
              <Icon icon={RotateLeftIcon} className="size-4" /> Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && multas.length === 0 ? (
        <EstadoVacio
          tipo="general"
          titulo="Estás al día"
          descripcion="No tienes multas registradas."
          enlaceBoton="/libros"
          textoBoton="Explorar catálogo"
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {multas.map((multa) => {
              const estaPagada =
                (multa.codigo_estado ?? "").toUpperCase() === "PAGADA" ||
                (multa.nombre_estado ?? "").toLowerCase() === "pagada";

              return (
                <Card
                  key={multa.id_multa}
                  className={`border shadow-none rounded-none transition-colors ${
                    estaPagada ? "border-border bg-card" : "border-destructive/40 bg-destructive/5"
                  }`}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-none border ${
                          estaPagada
                            ? "border-border bg-secondary text-muted-foreground"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}
                      >
                        <Icon icon={estaPagada ? CheckmarkCircle02Icon : AlertCircleIcon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <h3 className="truncate font-serif text-lg font-normal text-foreground">
                          {multa.titulo_libro ?? "Préstamo general"}
                        </h3>
                        <p className="text-xs font-mono font-bold text-foreground">
                          {formatearMoneda(Number(multa.valor_multa ?? 0))}
                        </p>
                      </div>
                    </div>

                    {multa.motivo_multa && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {multa.motivo_multa}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {estaPagada ? "Pagado el" : "Fecha préstamo"}
                        </span>
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {formatearFecha(estaPagada
                            ? multa.fechapago_multa
                            : multa.fechageneracion_multa
                          )}
                        </span>
                      </div>
                      <Badge
                        variant={estaPagada ? "secondary" : "destructive"}
                        className="font-semibold text-[10px] uppercase tracking-wider rounded-none"
                      >
                        {multa.nombre_estado ?? "Pendiente"}
                      </Badge>
                    </div>

                    {!estaPagada && (
                      <div className="p-2.5 bg-background border border-border text-[11px] text-muted-foreground">
                        Para saldar esta multa, acércate al mostrador de atención o comunícate con el administrador.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="rounded-none bg-secondary p-4 text-xs leading-relaxed text-muted-foreground border border-border">
            Las multas se generan automáticamente por entregas tardías de ejemplares prestados conforme al reglamento de la red de bibliotecas.
          </p>
        </div>
      )}
    </div>
  );
}
