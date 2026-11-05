"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  bibliotecasService,
  categoriasService,
  editorialesService,
  estadosService,
  ubicacionesService,
  type Estado,
} from "@/services/api";
import { getMensajeError } from "@/lib/errores";

type Fila = Record<string, unknown> & { codigo_estado?: string; nombre_estado?: string };
type Valores = Record<string, string>;

type Campo = {
  clave: string;
  etiqueta: string;
  obligatorio?: boolean;
  tipo?: "texto" | "area" | "select";
  opciones?: { valor: string; etiqueta: string }[];
  ayuda?: string;
};

type ConfigSeccion = {
  clave: string;
  titulo: string;
  singular: string;
  entidadEstado: string;
  descripcion: string;
  columnas: { titulo: string; render: (fila: Fila) => ReactNode }[];
  campos: Campo[];
  /** Vacío = crear con valores por defecto; con fila = valores actuales */
  valoresIniciales: (fila?: Fila) => Valores;
  cargar: () => Promise<Fila[]>;
  crear: (valores: Valores) => Promise<unknown>;
  actualizar: (fila: Fila, valores: Valores) => Promise<unknown>;
  eliminar: (fila: Fila) => Promise<unknown>;
  id: (fila: Fila) => number;
  nombre: (fila: Fila) => string;
};

const texto = (valor: unknown) => (valor == null || valor === "" ? "—" : String(valor));

export function SeccionCatalogo({ config, sedes, idBibliotecaFija }: { config: ConfigSeccion; sedes: { valor: string; etiqueta: string }[]; idBibliotecaFija?: number }) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Fila | null>(null);
  const [valores, setValores] = useState<Valores>({});
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<Fila | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datos, listaEstados] = await Promise.all([config.cargar(), estadosService.getAll(config.entidadEstado)]);
      setFilas(datos);
      setEstados(listaEstados);
    } catch (err) {
      setError(getMensajeError(err, `No se pudo cargar ${config.titulo.toLowerCase()}.`));
    } finally {
      setCargando(false);
    }
  }, [config]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  // Dentro del detalle de una sede solo se ven las filas de esa sede y no se elige la sede en el formulario
  const filasVisibles = useMemo(
    () => (idBibliotecaFija ? filas.filter((f) => Number(f.id_biblioteca) === idBibliotecaFija) : filas),
    [filas, idBibliotecaFija]
  );
  const columnas = useMemo(
    () => config.columnas.filter((col) => !(idBibliotecaFija && col.titulo === "Sede")),
    [config.columnas, idBibliotecaFija]
  );
  const campos = useMemo<Campo[]>(
    () =>
      config.campos
        .filter((campo) => !(idBibliotecaFija && campo.clave === "idBiblioteca"))
        .map((campo) => (campo.clave === "idBiblioteca" ? { ...campo, opciones: sedes } : campo)),
    [config.campos, sedes, idBibliotecaFija]
  );

  const abrir = (fila?: Fila) => {
    setEditando(fila ?? null);
    setValores({ ...config.valoresIniciales(fila), ...(idBibliotecaFija ? { idBiblioteca: String(idBibliotecaFija) } : {}) });
    setErroresCampo({});
    setErrorServidor(null);
    setAbierto(true);
  };

  const guardar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errores: Record<string, string> = {};
    campos.forEach((campo) => {
      if (campo.obligatorio && !(valores[campo.clave] ?? "").trim()) errores[campo.clave] = `${campo.etiqueta} es obligatorio.`;
    });
    setErroresCampo(errores);
    if (Object.keys(errores).length > 0) return;

    setGuardando(true);
    setErrorServidor(null);
    try {
      if (editando) await config.actualizar(editando, valores);
      else await config.crear(valores);
      setAbierto(false);
      await cargar();
    } catch (err) {
      setErrorServidor(getMensajeError(err, `No se pudo guardar ${config.singular}.`));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    setError(null);
    try {
      await config.eliminar(porEliminar);
      setPorEliminar(null);
      await cargar();
    } catch (err) {
      setPorEliminar(null);
      setError(getMensajeError(err, `No se pudo eliminar ${config.singular}.`));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">{config.descripcion}</p>
        <Button onClick={() => abrir()} className="h-9 rounded-none bg-foreground px-4 text-xs font-semibold text-background hover:bg-foreground/90 gap-2 self-start sm:self-auto">
          <Icon icon={Add01Icon} className="size-4" /> Nueva {config.singular}
        </Button>
      </div>

      {error && <div role="alert" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</div>}

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardContent className="p-3 sm:p-5">
          {cargando ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full rounded-none" />)}</div>
          ) : filasVisibles.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">Aún no hay {config.titulo.toLowerCase()} registradas{idBibliotecaFija ? " en esta sede" : ""}.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnas.map((col) => (
                      <TableHead key={col.titulo} className="text-xs font-semibold uppercase tracking-wider">{col.titulo}</TableHead>
                    ))}
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Estado</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasVisibles.map((fila) => (
                    <TableRow key={config.id(fila)}>
                      {columnas.map((col) => (
                        <TableCell key={col.titulo} className="text-xs">{col.render(fila)}</TableCell>
                      ))}
                      <TableCell>
                        <Badge variant={fila.codigo_estado === "INACTIVA" ? "secondary" : "default"} className="rounded-none text-[10px] font-semibold uppercase tracking-wider">
                          {fila.nombre_estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button aria-label={`Editar ${config.nombre(fila)}`} variant="ghost" size="icon-xs" className="rounded-none" onClick={() => abrir(fila)}>
                            <Icon icon={Edit02Icon} className="size-4" />
                          </Button>
                          <Button aria-label={`Eliminar ${config.nombre(fila)}`} variant="ghost" size="icon-xs" className="rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setPorEliminar(fila)}>
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
        </CardContent>
      </Card>

      <Dialog open={abierto} onOpenChange={(v) => !guardando && setAbierto(v)}>
        <DialogContent className="admin-touch sm:max-w-lg rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">{editando ? `Editar ${config.singular}` : `Nueva ${config.singular}`}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Los campos marcados con <span className="font-semibold text-destructive">*</span> son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
            {errorServidor && <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{errorServidor}</p>}

            {campos.map((campo) => (
              <div key={campo.clave} className="flex flex-col gap-2">
                <Label htmlFor={`${config.clave}-${campo.clave}`} className="text-xs font-semibold">
                  {campo.etiqueta}
                  {campo.obligatorio && <span className="text-destructive"> *</span>}
                </Label>
                {campo.tipo === "select" ? (
                  <SelectNativo
                    id={`${config.clave}-${campo.clave}`}
                    value={valores[campo.clave] ?? ""}
                    disabled={guardando}
                    onChange={(e) => setValores((v) => ({ ...v, [campo.clave]: e.target.value }))}
                  >
                    <option value="">Seleccionar...</option>
                    {(campo.opciones ?? []).map((op) => (
                      <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                    ))}
                  </SelectNativo>
                ) : campo.tipo === "area" ? (
                  <Textarea
                    id={`${config.clave}-${campo.clave}`}
                    value={valores[campo.clave] ?? ""}
                    disabled={guardando}
                    onChange={(e) => setValores((v) => ({ ...v, [campo.clave]: e.target.value }))}
                    className="min-h-20 rounded-none border-border bg-background text-xs"
                  />
                ) : (
                  <Input
                    id={`${config.clave}-${campo.clave}`}
                    value={valores[campo.clave] ?? ""}
                    disabled={guardando}
                    aria-invalid={Boolean(erroresCampo[campo.clave])}
                    onChange={(e) => setValores((v) => ({ ...v, [campo.clave]: e.target.value }))}
                    className="h-10 rounded-none border-border bg-background text-xs"
                  />
                )}
                {campo.ayuda && <p className="text-[11px] text-muted-foreground">{campo.ayuda}</p>}
                {erroresCampo[campo.clave] && <p role="alert" className="text-[11px] text-destructive">{erroresCampo[campo.clave]}</p>}
              </div>
            ))}

            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor={`${config.clave}-estado`} className="text-xs font-semibold">Estado</Label>
              <SelectNativo
                id={`${config.clave}-estado`}
                value={valores.idEstado ?? ""}
                disabled={guardando}
                onChange={(e) => setValores((v) => ({ ...v, idEstado: e.target.value }))}
              >
                <option value="">Activa (por defecto)</option>
                {estados.map((estado) => (
                  <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre_estado}</option>
                ))}
              </SelectNativo>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAbierto(false)} disabled={guardando} className="rounded-none font-semibold">Cancelar</Button>
              <Button type="submit" disabled={guardando} className="rounded-none font-semibold">{guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(porEliminar)} onOpenChange={(v) => !v && !eliminando && setPorEliminar(null)}>
        <DialogContent role="alertdialog" className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">¿Eliminar {config.singular}?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se eliminará <strong className="text-foreground">{porEliminar ? config.nombre(porEliminar) : ""}</strong>. Si está en uso por libros o ejemplares, no se podrá eliminar: márcala como Inactiva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPorEliminar(null)} disabled={eliminando} className="rounded-none font-semibold">Cancelar</Button>
            <Button variant="destructive" onClick={() => void eliminar()} disabled={eliminando} className="rounded-none font-semibold">{eliminando ? "Eliminando..." : "Sí, eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const estadoOpcional = (v: Valores) => (v.idEstado ? { idEstado: Number(v.idEstado) } : {});

export const SECCIONES: ConfigSeccion[] = [
  {
    clave: "categorias",
    titulo: "Categorías",
    singular: "categoría",
    entidadEstado: "categoria_libro",
    descripcion: "Géneros o temas con los que se clasifican los libros. Cada libro necesita una categoría.",
    columnas: [
      { titulo: "Nombre", render: (f) => <span className="font-serif text-base text-foreground">{texto(f.nombre_categlib)}</span> },
      { titulo: "Descripción", render: (f) => texto(f.descripcion_categlib) },
    ],
    campos: [
      { clave: "nombre", etiqueta: "Nombre", obligatorio: true },
      { clave: "descripcion", etiqueta: "Descripción", tipo: "area" },
    ],
    valoresIniciales: (f) => ({
      nombre: String(f?.nombre_categlib ?? ""),
      descripcion: String(f?.descripcion_categlib ?? ""),
      idEstado: f ? String(f.id_estado_categlib ?? "") : "",
    }),
    cargar: () => categoriasService.getAll() as unknown as Promise<Fila[]>,
    crear: (v) => categoriasService.create({ nombre: v.nombre.trim(), descripcion: v.descripcion.trim() || undefined, ...estadoOpcional(v) }),
    actualizar: (f, v) => categoriasService.update(Number(f.id_categorias_libros), { nombre: v.nombre.trim(), descripcion: v.descripcion.trim(), ...estadoOpcional(v) } as never),
    eliminar: (f) => categoriasService.delete(Number(f.id_categorias_libros)),
    id: (f) => Number(f.id_categorias_libros),
    nombre: (f) => String(f.nombre_categlib),
  },
  {
    clave: "editoriales",
    titulo: "Editoriales",
    singular: "editorial",
    entidadEstado: "editorial",
    descripcion: "Casas editoriales de los libros. También puedes crear una al registrar un libro.",
    columnas: [
      { titulo: "Nombre", render: (f) => <span className="font-serif text-base text-foreground">{texto(f.nombre_editorial)}</span> },
      { titulo: "País", render: (f) => texto(f.pais_editorial) },
    ],
    campos: [
      { clave: "nombre", etiqueta: "Nombre", obligatorio: true },
      { clave: "pais", etiqueta: "País" },
    ],
    valoresIniciales: (f) => ({
      nombre: String(f?.nombre_editorial ?? ""),
      pais: String(f?.pais_editorial ?? ""),
      idEstado: f ? String(f.id_estado_editorial ?? "") : "",
    }),
    cargar: () => editorialesService.getAll() as unknown as Promise<Fila[]>,
    crear: (v) => editorialesService.create({ nombre: v.nombre.trim(), pais: v.pais.trim() || undefined, ...estadoOpcional(v) }),
    actualizar: (f, v) => editorialesService.update(Number(f.id_editorial), { nombre: v.nombre.trim(), pais: v.pais.trim(), ...estadoOpcional(v) } as never),
    eliminar: (f) => editorialesService.delete(Number(f.id_editorial)),
    id: (f) => Number(f.id_editorial),
    nombre: (f) => String(f.nombre_editorial),
  },
  {
    clave: "ubicaciones",
    titulo: "Ubicaciones",
    singular: "ubicación",
    entidadEstado: "ubicacion",
    descripcion: "Lugares físicos dentro de cada sede (sala, sección, estantería). Los ejemplares se asignan a una ubicación.",
    columnas: [
      { titulo: "Sede", render: (f) => <span className="font-semibold text-foreground">{texto(f.nombre_biblioteca)}</span> },
      { titulo: "Ubicación", render: (f) => <span className="font-serif text-base text-foreground">{texto(f.nombre_ubicacion)}</span> },
      { titulo: "Sección", render: (f) => texto(f.seccion_ubicacion) },
      { titulo: "Estantería", render: (f) => texto(f.estanteria_ubicacion) },
    ],
    campos: [
      { clave: "idBiblioteca", etiqueta: "Sede", obligatorio: true, tipo: "select" },
      { clave: "nombre", etiqueta: "Nombre de la ubicación", obligatorio: true },
      { clave: "seccion", etiqueta: "Sección" },
      { clave: "estanteria", etiqueta: "Estantería" },
      { clave: "descripcion", etiqueta: "Descripción", tipo: "area" },
    ],
    valoresIniciales: (f) => ({
      idBiblioteca: f ? String(f.id_biblioteca ?? "") : "",
      nombre: String(f?.nombre_ubicacion ?? ""),
      seccion: String(f?.seccion_ubicacion ?? ""),
      estanteria: String(f?.estanteria_ubicacion ?? ""),
      descripcion: String(f?.descripcion_ubicacion ?? ""),
      idEstado: f ? String(f.id_estado_ubicacion ?? "") : "",
    }),
    cargar: () => ubicacionesService.getAll() as unknown as Promise<Fila[]>,
    crear: (v) =>
      ubicacionesService.create({
        idBiblioteca: Number(v.idBiblioteca),
        nombre: v.nombre.trim(),
        seccion: v.seccion.trim() || undefined,
        estanteria: v.estanteria.trim() || undefined,
        descripcion: v.descripcion.trim() || undefined,
        ...estadoOpcional(v),
      }),
    actualizar: (f, v) =>
      ubicacionesService.update(Number(f.id_ubicacion), {
        idBiblioteca: Number(v.idBiblioteca),
        nombre: v.nombre.trim(),
        seccion: v.seccion.trim(),
        estanteria: v.estanteria.trim(),
        descripcion: v.descripcion.trim(),
        ...estadoOpcional(v),
      }),
    eliminar: (f) => ubicacionesService.delete(Number(f.id_ubicacion)),
    id: (f) => Number(f.id_ubicacion),
    nombre: (f) => `${f.nombre_biblioteca} — ${f.nombre_ubicacion}`,
  },
];

/** Página de una sección de catálogo (categorías, editoriales o ubicaciones) con su propio encabezado. */
export function PaginaCatalogo({ clave }: { clave: "categorias" | "editoriales" | "ubicaciones" }) {
  const config = SECCIONES.find((s) => s.clave === clave)!;
  const [sedes, setSedes] = useState<{ valor: string; etiqueta: string }[]>([]);

  useEffect(() => {
    if (clave !== "ubicaciones") return;
    bibliotecasService
      .getAll()
      .then((lista) => setSedes(lista.map((b) => ({ valor: String(b.id_biblioteca), etiqueta: b.nombre_biblioteca ?? "" }))))
      .catch(() => setSedes([]));
  }, [clave]);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">{config.titulo}</h1>
      </div>
      <SeccionCatalogo config={config} sedes={sedes} />
    </div>
  );
}

/** Ubicaciones (sala, sección, estantería) de una sede: se administran dentro del detalle de la sede. */
export function UbicacionesDeSede({ idBiblioteca, nombreSede }: { idBiblioteca: number; nombreSede: string }) {
  const config = SECCIONES.find((s) => s.clave === "ubicaciones")!;
  const sedes = [{ valor: String(idBiblioteca), etiqueta: nombreSede }];
  return <SeccionCatalogo config={config} sedes={sedes} idBibliotecaFija={idBiblioteca} />;
}
