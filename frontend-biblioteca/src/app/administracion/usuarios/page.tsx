"use client";

import { Suspense, useEffect, useState } from "react";
import { RotateLeftIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginacionTabla } from "@/components/admin/paginacion-tabla";
import { estadosService, rolesService, usuariosService, type Estado, type Rol, type UsuarioBackend } from "@/services/api";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { useBusquedaDiferida, useFiltrosUrl } from "@/hooks/use-filtros-url";
import { useListadoPaginado } from "@/hooks/use-listado-paginado";
import { formatearFecha } from "@/lib/fechas";
import { getMensajeError } from "@/lib/errores";

type Cambio = { idRol?: number; idEstado?: number };

const POR_PAGINA = 20;
const FILTROS_INICIALES = { busqueda: "", rol: "", estado: "" };

function ContenidoUsuarios() {
  const { usuario: yo } = useAutenticacion();
  const { filtros, pagina, actualizar } = useFiltrosUrl(FILTROS_INICIALES);
  const [textoBusqueda, setTextoBusqueda] = useBusquedaDiferida(filtros.busqueda, (valor) => actualizar({ busqueda: valor }));
  const [roles, setRoles] = useState<Rol[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cambios, setCambios] = useState<Record<string, Cambio>>({});
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  // Roles y estados alimentan los filtros y los selectores de cada fila: son pocos y se cargan una vez
  useEffect(() => {
    let activo = true;
    Promise.all([rolesService.getAll(), estadosService.getAll("usuario")])
      .then(([listaRoles, listaEstados]) => {
        if (!activo) return;
        setRoles(listaRoles);
        setEstados(listaEstados);
      })
      .catch((err) => {
        if (activo) setErrorAccion(getMensajeError(err, "No se pudieron cargar los roles y estados."));
      });
    return () => {
      activo = false;
    };
  }, []);

  const listado = useListadoPaginado<UsuarioBackend>(
    () => usuariosService.getPagina({ busqueda: filtros.busqueda, idRol: filtros.rol, idEstado: filtros.estado, page: pagina, limit: POR_PAGINA }),
    [filtros.busqueda, filtros.rol, filtros.estado, pagina],
    { pagina, alPaginaVacia: (ultima) => actualizar({ pagina: ultima }), mensajeError: "No se pudo cargar el directorio de usuarios." }
  );

  const cambiar = (id: string, cambio: Cambio) => setCambios((actual) => ({ ...actual, [id]: { ...actual[id], ...cambio } }));

  const guardar = async (u: UsuarioBackend) => {
    const cambio = cambios[u.id_usuario];
    if (!cambio) return;
    setGuardandoId(u.id_usuario);
    setErrorAccion(null);
    setAviso(null);
    try {
      await usuariosService.updateRolEstado(u.id_usuario, cambio);
      setAviso(`Se actualizó a ${u.nombrecompleto_usuario}.`);
      setCambios(({ [u.id_usuario]: _guardado, ...resto }) => resto);
      listado.recargar();
    } catch (err) {
      setErrorAccion(getMensajeError(err, "No se pudo actualizar el usuario."));
    } finally {
      setGuardandoId(null);
    }
  };

  const hayFiltros = Boolean(filtros.busqueda || filtros.rol || filtros.estado);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">Usuarios</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Cuentas registradas. Cambia el rol (Lector, Bibliotecario, Administrador) o suspende una cuenta.
          </p>
        </div>
        <Button variant="outline" onClick={listado.recargar} disabled={listado.cargando} className="h-10 self-start rounded-none border-border px-4 gap-2 font-semibold sm:self-auto" aria-label="Actualizar">
          <Icon icon={RotateLeftIcon} className={`size-4 ${listado.cargando ? "animate-spin text-primary" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <Icon icon={Search01Icon} className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input type="search" value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} placeholder="Buscar por nombre, correo o documento" className="h-10 rounded-none border-border bg-background pl-9 text-xs" />
        </div>
        <SelectNativo value={filtros.rol} onChange={(e) => actualizar({ rol: e.target.value })} aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          {roles.map((rol) => (
            <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre_rol}</option>
          ))}
        </SelectNativo>
        <SelectNativo value={filtros.estado} onChange={(e) => actualizar({ estado: e.target.value })} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {estados.map((estado) => (
            <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre_estado}</option>
          ))}
        </SelectNativo>
      </div>

      {(errorAccion || listado.error) && <div role="alert" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">{errorAccion ?? listado.error}</div>}
      {aviso && <div role="status" className="border border-primary/40 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">{aviso}</div>}

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardContent className="p-3 sm:p-5">
          {listado.cargando ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-none" />)}</div>
          ) : listado.datos.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">{hayFiltros ? "No hay usuarios que coincidan." : "Aún no hay usuarios registrados."}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Usuario</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Documento / teléfono</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Registro</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Rol</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Estado</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listado.datos.map((u) => {
                    const cambio = cambios[u.id_usuario];
                    const soyYo = u.id_usuario === yo?.id;
                    return (
                      <TableRow key={u.id_usuario}>
                        <TableCell className="text-xs">
                          <span className="block font-semibold text-foreground">
                            {u.nombrecompleto_usuario} {soyYo && <Badge variant="outline" className="ml-1 rounded-none text-[9px] uppercase">Tú</Badge>}
                          </span>
                          <span className="text-muted-foreground">{u.correo_usuario}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {u.documento_usuario ?? "—"}
                          <span className="block text-muted-foreground">{u.telefono_usuario ?? "—"}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{formatearFecha(u.fecharegistro_usuario)}</TableCell>
                        <TableCell className="min-w-40">
                          <SelectNativo
                            aria-label={`Rol de ${u.nombrecompleto_usuario}`}
                            value={cambio?.idRol ?? u.id_rol ?? ""}
                            disabled={soyYo}
                            onChange={(e) => cambiar(u.id_usuario, { idRol: Number(e.target.value) })}
                            className="h-9"
                          >
                            {roles.map((rol) => (
                              <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre_rol}</option>
                            ))}
                          </SelectNativo>
                        </TableCell>
                        <TableCell className="min-w-36">
                          <SelectNativo
                            aria-label={`Estado de ${u.nombrecompleto_usuario}`}
                            value={cambio?.idEstado ?? u.id_estado_usuario ?? ""}
                            disabled={soyYo}
                            onChange={(e) => cambiar(u.id_usuario, { idEstado: Number(e.target.value) })}
                            className="h-9"
                          >
                            {estados.map((estado) => (
                              <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre_estado}</option>
                            ))}
                          </SelectNativo>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" disabled={!cambio || guardandoId === u.id_usuario} onClick={() => void guardar(u)} className="h-8 rounded-none text-xs font-semibold">
                            {guardandoId === u.id_usuario ? "Guardando..." : "Guardar"}
                          </Button>
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
    </div>
  );
}

export default function PaginaAdminUsuarios() {
  return (
    <Suspense fallback={null}>
      <ContenidoUsuarios />
    </Suspense>
  );
}
