"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Book02Icon,
  Layers01Icon,
  UserGroupIcon,
  Building01Icon,
  NewsIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
  RotateLeftIcon,
  Coins01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { InformeLookerStudio } from "@/components/admin/informe-looker-studio";
import {
  autoresService,
  bibliotecasService,
  categoriasService,
  ejemplaresService,
  estadosService,
  librosService,
  multasService,
  prestamosService,
  solicitudesService,
  ubicacionesService,
  usuariosService,
  type Autor,
  type Biblioteca,
  type CategoriaLibro,
  type Prestamo,
  type Solicitud,
  type Ubicacion,
} from "@/services/api";
import type { Libro } from "@/services/libros.service";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { formatearFecha } from "@/lib/fechas";

type Datos = {
  /** Total de títulos (viene del servidor, no se cargan todos) */
  libros: number | null;
  ejemplares: number | null;
  ejemplaresDisponibles: number;
  prestamosActivos: number;
  prestamosVencidos: number;
  /** Últimos préstamos registrados (solo la primera página, no toda la tabla) */
  prestamosRecientes: Prestamo[] | null;
  solicitudesPendientes: number | null;
  /** Primeras solicitudes pendientes (las más recientes) para la lista del panel */
  solicitudesRecientes: Solicitud[];
  multasPendientes: number | null;
  saldoPendiente: number;
  autores: Autor[] | null;
  categorias: CategoriaLibro[] | null;
  sedes: Biblioteca[] | null;
  ubicaciones: Ubicacion[] | null;
  usuarios: number | null;
};

const datosVacios: Datos = {
  libros: null,
  ejemplares: null,
  ejemplaresDisponibles: 0,
  prestamosActivos: 0,
  prestamosVencidos: 0,
  prestamosRecientes: null,
  solicitudesPendientes: null,
  solicitudesRecientes: [],
  multasPendientes: null,
  saldoPendiente: 0,
  autores: null,
  categorias: null,
  sedes: null,
  ubicaciones: null,
  usuarios: null,
};

const formatearNumero = (valor: number) => valor.toLocaleString("es-CO");

const formatearMoneda = (valor: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);

export default function PaginaDashboardAdmin() {
  const { rol } = useAutenticacion();
  const esAdmin = rol === "administrador";
  const [datos, setDatos] = useState<Datos>(datosVacios);
  const [fallos, setFallos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      // Solo se piden conteos y las primeras filas: el panel no descarga tablas completas
      const idDe = async (entidad: string, codigo: string) =>
        (await estadosService.getAll(entidad)).find((e) => e.codigo_estado === codigo)?.id_estado;

      const conteoEjemplares = async (codigo?: string) =>
        (await ejemplaresService.getPagina({ idEstado: codigo ? await idDe("ejemplar", codigo) : undefined, limit: 1 })).total;
      const conteoPrestamos = async (codigo: string) =>
        (await prestamosService.getPagina({ idEstado: await idDe("prestamo", codigo), limit: 1 })).total;

      const solicitudes = [
        ["libros", librosService.getPagina({ limit: 1 })],
        ["ejemplares", conteoEjemplares()],
        ["ejemplares disponibles", conteoEjemplares("DISPONIBLE")],
        ["préstamos activos", conteoPrestamos("ACTIVO")],
        ["préstamos vencidos", conteoPrestamos("VENCIDO")],
        ["préstamos recientes", prestamosService.getPagina({ limit: 5 })],
        ["solicitudes", solicitudesService.getPagina({ idEstado: await idDe("solicitud", "PENDIENTE"), limit: 5 })],
        ["multas", multasService.getResumen()],
        ["autores", autoresService.getAll()],
        ["categorías", categoriasService.getAll()],
        ["sedes", bibliotecasService.getAll()],
        ["ubicaciones", ubicacionesService.getAll()],
        ...(esAdmin ? [["usuarios", usuariosService.getPagina({ limit: 1 })] as const] : []),
      ] as const;

      const resultados = await Promise.allSettled(solicitudes.map(([, promesa]) => promesa));
      if (!activo) return;

      const siguiente: Datos = { ...datosVacios };
      const errores: string[] = [];
      resultados.forEach((resultado, indice) => {
        const nombre = solicitudes[indice][0];
        if (resultado.status === "rejected") {
          errores.push(nombre);
          return;
        }
        const valor = resultado.value as never;
        switch (nombre) {
          case "libros": siguiente.libros = (valor as { total: number }).total; break;
          case "ejemplares": siguiente.ejemplares = valor as number; break;
          case "ejemplares disponibles": siguiente.ejemplaresDisponibles = valor as number; break;
          case "préstamos activos": siguiente.prestamosActivos = valor as number; break;
          case "préstamos vencidos": siguiente.prestamosVencidos = valor as number; break;
          case "préstamos recientes": siguiente.prestamosRecientes = (valor as { data: Prestamo[] }).data; break;
          case "solicitudes": {
            const pagina = valor as { total: number; data: Solicitud[] };
            siguiente.solicitudesPendientes = pagina.total;
            siguiente.solicitudesRecientes = pagina.data;
            break;
          }
          case "multas": {
            const resumen = valor as { pendientes: number; saldoPendiente: number };
            siguiente.multasPendientes = resumen.pendientes;
            siguiente.saldoPendiente = resumen.saldoPendiente;
            break;
          }
          case "autores": siguiente.autores = valor as Autor[]; break;
          case "categorías": siguiente.categorias = valor as CategoriaLibro[]; break;
          case "sedes": siguiente.sedes = valor as Biblioteca[]; break;
          case "ubicaciones": siguiente.ubicaciones = valor as Ubicacion[]; break;
          case "usuarios": siguiente.usuarios = (valor as { total: number }).total; break;
        }
      });

      setDatos(siguiente);
      setFallos(errores);
      setCargando(false);
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, [intento, esAdmin]);

  const sedesActivas = (datos.sedes ?? []).filter((s) => s.codigo_estado !== "INACTIVA").length;

  const kpis: {
    titulo: string;
    valor: string | null;
    detalle: string;
    icono: typeof Book02Icon;
    href: string;
    alerta?: boolean;
  }[] = [
    {
      titulo: "Libros",
      valor: datos.libros !== null ? datos.libros.toLocaleString("es-CO") : null,
      detalle: "títulos en el catálogo",
      icono: Book02Icon,
      href: "/administracion/libros",
    },
    {
      titulo: "Ejemplares",
      valor: datos.ejemplares !== null ? datos.ejemplares.toLocaleString("es-CO") : null,
      detalle: `${formatearNumero(datos.ejemplaresDisponibles)} disponibles`,
      icono: Layers01Icon,
      href: "/administracion/ejemplares",
    },
    {
      titulo: "Solicitudes pendientes",
      valor: datos.solicitudesPendientes !== null ? formatearNumero(datos.solicitudesPendientes) : null,
      detalle: "esperan respuesta",
      icono: NewsIcon,
      href: "/administracion/prestamos",
      alerta: (datos.solicitudesPendientes ?? 0) > 0,
    },
    {
      titulo: "Préstamos activos",
      valor: datos.prestamosRecientes ? formatearNumero(datos.prestamosActivos + datos.prestamosVencidos) : null,
      detalle: `${formatearNumero(datos.prestamosVencidos)} vencidos`,
      icono: NewsIcon,
      href: "/administracion/prestamos",
      alerta: datos.prestamosVencidos > 0,
    },
    {
      titulo: "Multas pendientes",
      valor: datos.multasPendientes !== null ? formatearNumero(datos.multasPendientes) : null,
      detalle: formatearMoneda(datos.saldoPendiente),
      icono: Coins01Icon,
      href: "/administracion/multas",
      alerta: (datos.multasPendientes ?? 0) > 0,
    },
    {
      titulo: "Sedes activas",
      valor: datos.sedes ? String(sedesActivas) : null,
      detalle: `${datos.ubicaciones?.length ?? 0} ubicaciones`,
      icono: Building01Icon,
      href: "/administracion/sedes",
    },
    {
      titulo: "Autores",
      valor: datos.autores ? datos.autores.length.toLocaleString("es-CO") : null,
      detalle: "registrados",
      icono: UserIcon,
      href: "/administracion/autores",
    },
    ...(esAdmin
      ? [
          {
            titulo: "Usuarios",
            valor: datos.usuarios !== null ? datos.usuarios.toLocaleString("es-CO") : null,
            detalle: "cuentas registradas",
            icono: UserGroupIcon,
            href: "/administracion/usuarios",
          },
        ]
      : []),
  ];

  // Guía para una base de datos vacía: qué falta para poder prestar libros
  const pasos = [
    { texto: "Registrar una sede", hecho: (datos.sedes?.length ?? 0) > 0, href: "/administracion/sedes", cargado: datos.sedes !== null },
    { texto: "Crear una ubicación (sección o estantería) dentro de la sede", hecho: (datos.ubicaciones?.length ?? 0) > 0, href: "/administracion/sedes", cargado: datos.ubicaciones !== null },
    { texto: "Crear al menos una categoría de libros", hecho: (datos.categorias?.length ?? 0) > 0, href: "/administracion/categorias", cargado: datos.categorias !== null },
    { texto: "Registrar autores", hecho: (datos.autores?.length ?? 0) > 0, href: "/administracion/autores", cargado: datos.autores !== null },
    { texto: "Registrar libros", hecho: (datos.libros ?? 0) > 0, href: "/administracion/libros", cargado: datos.libros !== null },
    { texto: "Registrar los ejemplares de cada libro", hecho: (datos.ejemplares ?? 0) > 0, href: "/administracion/ejemplares", cargado: datos.ejemplares !== null },
  ];
  const setupCompleto = pasos.every((p) => !p.cargado || p.hecho);

  const prestamosRecientes = datos.prestamosRecientes ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-foreground tracking-[-0.02em]">
            Panel de control
          </h1>
          <p className="text-xs text-muted-foreground">
            Resumen en tiempo real del catálogo, la circulación de ejemplares y las multas de la red de bibliotecas.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIntento((n) => n + 1)}
          disabled={cargando}
          className="rounded-none gap-2 font-semibold border-border h-9 px-4 self-start sm:self-auto"
        >
          <Icon icon={RotateLeftIcon} className={`size-4 ${cargando ? "animate-spin text-primary" : ""}`} /> Actualizar
        </Button>
      </div>

      {fallos.length > 0 && (
        <Card role="alert" className="border-destructive/40 bg-destructive/5 rounded-none shadow-none">
          <CardContent className="flex items-start gap-3 p-4 text-xs">
            <Icon icon={AlertCircleIcon} className="size-5 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">No se pudieron cargar algunos datos</span>
              <span className="text-muted-foreground">Fallaron: {fallos.join(", ")}. Verifica que el backend esté en línea y vuelve a intentarlo.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!cargando && !setupCompleto && (
        <Card className="border-border bg-secondary rounded-none shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-xl font-normal">Primeros pasos</CardTitle>
            <CardDescription className="text-xs">Completa esta lista para que los lectores puedan solicitar libros.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2 text-xs">
              {pasos.map((paso, indice) => (
                <li key={paso.texto} className="flex items-center gap-3">
                  <span
                    className={`inline-flex size-5 shrink-0 items-center justify-center border text-[10px] font-bold ${
                      paso.hecho ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {paso.hecho ? "✓" : indice + 1}
                  </span>
                  {paso.hecho ? (
                    <span className="text-muted-foreground line-through">{paso.texto}</span>
                  ) : (
                    <Link href={paso.href} className="font-semibold text-foreground underline-offset-2 hover:text-primary hover:underline">
                      {paso.texto}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 divide-border [&>*]:border-border sm:[&>*:nth-child(n+3)]:border-t lg:[&>*:nth-child(n+3)]:border-t-0 lg:[&>*:nth-child(n+5)]:border-t">
        {kpis.map((kpi) => (
          <Link key={kpi.titulo} href={kpi.href} className="p-5 flex flex-col justify-between gap-3 hover:bg-accent/30 transition-colors lg:border-l lg:first:border-l-0 lg:[&:nth-child(4n+1)]:border-l-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.titulo}</span>
              <Icon icon={kpi.icono} className={`size-4 ${kpi.alerta ? "text-destructive" : "text-primary"}`} />
            </div>
            {cargando ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-20 rounded-none" />
                <Skeleton className="h-4 w-28 rounded-none" />
              </div>
            ) : kpi.valor === null ? (
              <div className="text-xs text-muted-foreground">No disponible</div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className={`font-serif text-3xl font-normal ${kpi.alerta ? "text-destructive" : "text-foreground"}`}>{kpi.valor}</div>
                <div className="text-[11px] text-muted-foreground">{kpi.detalle}</div>
              </div>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border border-border bg-card rounded-none shadow-none">
          <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="font-serif text-xl font-normal">Solicitudes por atender</CardTitle>
              <CardDescription className="text-xs">Solicitudes de lectores pendientes de aprobación.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs font-semibold text-primary rounded-none">
              <Link href="/administracion/prestamos">Gestionar <Icon icon={ArrowRight01Icon} className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {cargando ? (
              <div className="flex flex-col gap-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-none" />)}</div>
            ) : datos.solicitudesRecientes.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No hay solicitudes pendientes.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border border border-border">
                {datos.solicitudesRecientes.map((s) => (
                  <li key={s.id_solicitud} className="flex flex-col gap-0.5 p-3 text-xs">
                    <span className="font-serif text-base text-foreground">{s.titulo_libro}</span>
                    <span className="text-muted-foreground">
                      {s.nombrecompleto_usuario} · {s.nombre_biblioteca} · {formatearFecha(s.fechasolicitud_solicitud)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-none shadow-none">
          <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="font-serif text-xl font-normal">Últimos préstamos</CardTitle>
              <CardDescription className="text-xs">Movimientos recientes de ejemplares.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs font-semibold text-primary rounded-none">
              <Link href="/administracion/prestamos">Ver todos <Icon icon={ArrowRight01Icon} className="size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {cargando ? (
              <div className="flex flex-col gap-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-none" />)}</div>
            ) : prestamosRecientes.length === 0 ? (
              <EstadoVacio
                tipo="prestamos"
                titulo="Aún no hay préstamos registrados"
                descripcion="Cuando se registre un préstamo, aparecerá aquí."
                textoBoton="Ir a préstamos"
                enlaceBoton="/administracion/prestamos"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Libro</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Lector</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Vence</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prestamosRecientes.map((p) => (
                      <TableRow key={p.id_prestamo}>
                        <TableCell className="font-serif text-base text-foreground">{p.titulo_libro}</TableCell>
                        <TableCell className="text-xs">{p.nombrecompleto_usuario}</TableCell>
                        <TableCell className="font-mono text-xs">{formatearFecha(p.fechadevolucion_prestamo ?? p.fechavencimiento_prestamo)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={p.codigo_estado === "ACTIVO" ? "default" : p.codigo_estado === "VENCIDO" ? "destructive" : "secondary"}
                            className="rounded-none text-[10px] font-semibold uppercase tracking-wider"
                          >
                            {p.nombre_estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InformeLookerStudio mostrarEnlaceSeccion={true} />
    </div>
  );
}
