"use client";

import { Suspense, useEffect, useState } from "react";
import { RotateLeftIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginacionTabla } from "@/components/admin/paginacion-tabla";
import { auditoriasService, usuariosService, type Auditoria, type UsuarioBackend } from "@/services/api";
import { useBusquedaDiferida, useFiltrosUrl } from "@/hooks/use-filtros-url";
import { useListadoPaginado } from "@/hooks/use-listado-paginado";
import { formatearFechaHora } from "@/lib/fechas";

const POR_PAGINA = 25;
const FILTROS_INICIALES = { tabla: "", idUsuario: "", busqueda: "" };

/** Tablas sobre las que el sistema registra auditoría. */
const TABLAS_AUDITADAS = [
  "Autores",
  "Bibliotecas",
  "Categorias_Libros",
  "Configuraciones",
  "Editoriales",
  "Ejemplares",
  "Libros",
  "Libros_Autores",
  "Multas",
  "Prestamos",
  "Solicitudes",
  "Ubicaciones",
  "Usuarios",
];

function ContenidoAuditoria() {
  const { filtros, pagina, actualizar } = useFiltrosUrl(FILTROS_INICIALES);
  const [textoBusqueda, setTextoBusqueda] = useBusquedaDiferida(filtros.busqueda, (valor) => actualizar({ busqueda: valor }));
  const [personal, setPersonal] = useState<UsuarioBackend[]>([]);
  const [detalle, setDetalle] = useState<number | null>(null);

  // Quienes pueden generar auditoría son el personal; se listan para filtrar por responsable
  useEffect(() => {
    let activo = true;
    usuariosService
      .getPagina({ personal: true, limit: 100 })
      .then((resultado) => {
        if (activo) setPersonal(resultado.data);
      })
      .catch(() => {
        if (activo) setPersonal([]);
      });
    return () => {
      activo = false;
    };
  }, []);

  const listado = useListadoPaginado<Auditoria>(
    () => auditoriasService.getPagina({ tabla: filtros.tabla, idUsuario: filtros.idUsuario, busqueda: filtros.busqueda, page: pagina, limit: POR_PAGINA }),
    [filtros.tabla, filtros.idUsuario, filtros.busqueda, pagina],
    { pagina, alPaginaVacia: (ultima) => actualizar({ pagina: ultima }), mensajeError: "No se pudo cargar la auditoría." }
  );

  const hayFiltros = Boolean(filtros.tabla || filtros.idUsuario || filtros.busqueda);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">Auditoría</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Registro de las acciones realizadas por el personal, de la más reciente a la más antigua.</p>
        </div>
        <Button variant="outline" onClick={listado.recargar} disabled={listado.cargando} className="h-10 self-start rounded-none border-border px-4 sm:self-auto" aria-label="Actualizar">
          <Icon icon={RotateLeftIcon} className={`size-4 ${listado.cargando ? "animate-spin text-primary" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <Icon icon={Search01Icon} className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input type="search" value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} placeholder="Buscar por acción o usuario" className="h-10 rounded-none border-border bg-background pl-9 text-xs" />
        </div>
        <SelectNativo value={filtros.tabla} onChange={(e) => actualizar({ tabla: e.target.value })} aria-label="Filtrar por tabla">
          <option value="">Todas las tablas</option>
          {TABLAS_AUDITADAS.map((tabla) => (
            <option key={tabla} value={tabla}>{tabla.replace(/_/g, " ")}</option>
          ))}
        </SelectNativo>
        <SelectNativo value={filtros.idUsuario} onChange={(e) => actualizar({ idUsuario: e.target.value })} aria-label="Filtrar por responsable">
          <option value="">Todo el personal</option>
          {personal.map((u) => (
            <option key={u.id_usuario} value={u.id_usuario}>{u.nombrecompleto_usuario}</option>
          ))}
        </SelectNativo>
      </div>

      {listado.error && <div role="alert" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">{listado.error}</div>}

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardContent className="p-3 sm:p-5">
          {listado.cargando ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full rounded-none" />)}</div>
          ) : listado.datos.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">{hayFiltros ? "Ningún registro coincide con los filtros." : "No hay registros de auditoría."}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Usuario</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Acción</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Tabla</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Registro</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listado.datos.map((r) => (
                    <TableRow key={r.id_auditoria}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{formatearFechaHora(r.fecha_auditoria)}</TableCell>
                      <TableCell className="text-xs">
                        <span className="block font-semibold text-foreground">{r.nombrecompleto_usuario}</span>
                        <span className="text-muted-foreground">{r.correo_usuario}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.accion_auditoria}</TableCell>
                      <TableCell className="text-xs">{r.tablaafectada_auditoria}</TableCell>
                      <TableCell className="font-mono text-xs">{r.idregistro_auditoria ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDetalle(detalle === r.id_auditoria ? null : r.id_auditoria)} className="h-7 rounded-none text-xs font-semibold">
                          {detalle === r.id_auditoria ? "Ocultar" : "Ver"}
                        </Button>
                        {detalle === r.id_auditoria && (
                          <pre className="mt-2 max-h-56 max-w-md overflow-auto whitespace-pre-wrap break-words border border-border bg-muted p-2 text-left text-[10px]">
                            {JSON.stringify({ antes: r.datosanteriores_auditoria, despues: r.datosnuevos_auditoria }, null, 2)}
                          </pre>
                        )}
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
    </div>
  );
}

export default function PaginaAdminAuditoria() {
  return (
    <Suspense fallback={null}>
      <ContenidoAuditoria />
    </Suspense>
  );
}
