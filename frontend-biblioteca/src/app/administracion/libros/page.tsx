"use client";

import { Suspense, useEffect, useState } from "react";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  librosService,
  categoriasService,
  editorialesService,
  autoresService,
  estadosService,
  type CategoriaLibro,
  type Editorial,
  type Autor,
  type Estado,
} from "@/services/api";
import type { LibroPayload } from "@/services/libros.service";
import { getMensajeError } from "@/lib/errores";
import { useBusquedaDiferida, useFiltrosUrl } from "@/hooks/use-filtros-url";
import {
  formularioInicial,
  validarFormularioLibro,
  type ErroresFormularioLibro,
  type FormularioLibro,
  type Libro,
} from "@/components/admin-libros/tipos";
import { FormularioLibroDialog } from "@/components/admin-libros/formulario-libro";
import { ConfirmarEliminarDialog } from "@/components/admin-libros/confirmar-eliminar-dialog";
import { TablaLibros } from "@/components/admin-libros/tabla-libros";

const FILTROS_INICIALES = { busqueda: "" };

function ContenidoAdminLibros() {
  // Búsqueda y página viven en la URL: se conservan al recargar y al volver desde otra pantalla
  const { filtros, pagina: paginaActual, actualizar } = useFiltrosUrl(FILTROS_INICIALES);
  const busquedaAplicada = filtros.busqueda;
  const [busqueda, setBusqueda] = useBusquedaDiferida(busquedaAplicada, (valor) => actualizar({ busqueda: valor }));
  const setPaginaActual = (siguiente: (actual: number) => number) => actualizar({ pagina: siguiente(paginaActual) });
  const elementosPorPagina = 10;

  const [libros, setLibros] = useState<Libro[]>([]);
  const [totalLibros, setTotalLibros] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const [categorias, setCategorias] = useState<CategoriaLibro[]>([]);
  const [editoriales, setEditoriales] = useState<Editorial[]>([]);
  const [autores, setAutores] = useState<Autor[]>([]);
  const [estadosLibro, setEstadosLibro] = useState<Estado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorOperacion, setErrorOperacion] = useState("");
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [libroEditado, setLibroEditado] = useState<Libro | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [formulario, setFormulario] = useState<FormularioLibro>(formularioInicial);
  const [erroresFormulario, setErroresFormulario] = useState<ErroresFormularioLibro>({});
  const [guardando, setGuardando] = useState(false);

  const [libroParaEliminar, setLibroParaEliminar] = useState<Libro | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | string | null>(null);

  /** Vuelve a pedir la página actual al servidor (tras crear, editar o eliminar). */
  const cargarDatos = async () => setRecarga((n) => n + 1);

  // Catálogos para el formulario: se cargan una sola vez
  useEffect(() => {
    let activo = true;
    Promise.all([
      categoriasService.getAll(),
      editorialesService.getAll(),
      autoresService.getAll(),
      estadosService.getAll("libro"),
    ])
      .then(([categoriasData, editorialesData, autoresData, estadosData]) => {
        if (!activo) return;
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        setEditoriales(Array.isArray(editorialesData) ? editorialesData : []);
        setAutores(Array.isArray(autoresData) ? autoresData : []);
        setEstadosLibro(Array.isArray(estadosData) ? estadosData : []);
      })
      .catch((error) => {
        if (activo) setErrorCarga(getMensajeError(error, "No se pudieron cargar los catálogos del formulario."));
      });
    return () => {
      activo = false;
    };
  }, []);

  // Solo se descarga la página visible
  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      setErrorCarga("");
      try {
        const pagina = await librosService.getPagina({ busqueda: busquedaAplicada, page: paginaActual, limit: elementosPorPagina });
        if (!activo) return;
        setLibros(pagina.libros);
        setTotalLibros(pagina.total);
        // Si al eliminar quedó vacía la última página, se retrocede una
        if (pagina.libros.length === 0 && pagina.total > 0 && paginaActual > 1) {
          actualizar({ pagina: Math.ceil(pagina.total / elementosPorPagina) });
        }
      } catch (error) {
        if (!activo) return;
        setErrorCarga(getMensajeError(error, "No se pudieron cargar los libros."));
        setLibros([]);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
    // `actualizar` solo se usa para corregir una página vacía
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaAplicada, paginaActual, recarga]);

  const abrirFormulario = async (libro?: Libro) => {
    setErrorOperacion("");
    setErrorModal(null);
    setErroresFormulario({});

    if (!libro) {
      setLibroEditado(null);
      setFormulario({ ...formularioInicial });
      setModalAbierto(true);
      return;
    }

    setLibroEditado(libro);
    setModalAbierto(true);
    setCargandoDetalle(true);
    try {
      // El listado no trae los autores como lista; el detalle sí
      const detalle = await librosService.getById(libro.id_libro);
      setFormulario({
        titulo: detalle.titulo_libro ?? "",
        idCategoria: detalle.id_categoria != null ? Number(detalle.id_categoria) : null,
        idEditorial: detalle.id_editorial != null ? Number(detalle.id_editorial) : null,
        editorialNueva: "",
        // Solo "Descatalogado" es una elección manual; Disponible y Agotado los calcula el sistema
        idEstado:
          estadosLibro.find((e) => Number(e.id_estado) === Number(detalle.id_estado_libro))?.codigo_estado === "DESCATALOGADO"
            ? Number(detalle.id_estado_libro)
            : null,
        isbn: detalle.isbn_libro ?? "",
        descripcion: detalle.descripcion_libro ?? "",
        portada: detalle.portada_libro ?? "",
        numPaginas: detalle.numpaginas_libro != null ? String(detalle.numpaginas_libro) : "",
        idioma: detalle.idioma_libro ?? "Español",
        fechaPublicacion: detalle.fechapublicacion_libro ? String(detalle.fechapublicacion_libro).slice(0, 10) : "",
        autoresIds: (detalle.autores ?? []).map((a) => Number(a.id_autor)),
      });
    } catch (error) {
      setErrorModal(getMensajeError(error, "No se pudieron cargar los datos del libro."));
    } finally {
      setCargandoDetalle(false);
    }
  };

  const actualizarCampo = <K extends keyof FormularioLibro>(campo: K, valor: FormularioLibro[K]) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setErroresFormulario((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
    if (campo === "isbn" && errorModal?.toLowerCase().includes("isbn")) setErrorModal(null);
  };

  const handleGuardar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errores = validarFormularioLibro(formulario);
    setErroresFormulario(errores);
    if (Object.keys(errores).length > 0) return;

    const datos: LibroPayload = {
      titulo: formulario.titulo.trim(),
      idCategoria: Number(formulario.idCategoria),
      idEditorial: formulario.idEditorial,
      editorial: formulario.idEditorial ? null : formulario.editorialNueva.trim(),
      // Al volver a "Automático" se envía Disponible y la BD lo recalcula según los ejemplares
      idEstado:
        formulario.idEstado ??
        (libroEditado ? Number(estadosLibro.find((e) => e.codigo_estado === "DISPONIBLE")?.id_estado) || null : null),
      isbn: formulario.isbn.trim() || null,
      descripcion: formulario.descripcion.trim() || null,
      portada: formulario.portada || null,
      numPaginas: formulario.numPaginas.trim() ? Number(formulario.numPaginas) : null,
      idioma: formulario.idioma.trim() || "Español",
      fechaPublicacion: formulario.fechaPublicacion || null,
      autoresIds: formulario.autoresIds,
    };

    setGuardando(true);
    setErrorModal(null);
    setErrorOperacion("");
    try {
      if (libroEditado) {
        await librosService.update(libroEditado.id_libro, datos);
      } else {
        await librosService.create(datos);
      }
      setModalAbierto(false);
      await cargarDatos();
    } catch (error) {
      const mensaje = getMensajeError(error, "No se pudo guardar el libro.");
      setErrorModal(mensaje);
      if (mensaje.toLowerCase().includes("isbn")) {
        setErroresFormulario((prev) => ({ ...prev, isbn: mensaje }));
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!libroParaEliminar) return;
    const id = libroParaEliminar.id_libro;

    setEliminandoId(id);
    setErrorOperacion("");
    try {
      await librosService.delete(id);
      setLibroParaEliminar(null);
      await cargarDatos();
    } catch (error) {
      setLibroParaEliminar(null);
      setErrorOperacion(getMensajeError(error, "No se pudo eliminar el libro."));
    } finally {
      setEliminandoId(null);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(totalLibros / elementosPorPagina));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 @2xl:flex-row @2xl:items-center">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-foreground">
            Libros
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gestiona los títulos del catálogo: datos bibliográficos, autores, portada y estado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-64">
            <Icon icon={Search01Icon} className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar por título, autor, ISBN, editorial..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-10 rounded-none border-border bg-background pl-9 text-xs"
            />
          </div>
          <Button
            onClick={() => void abrirFormulario()}
            className="h-10 rounded-none bg-foreground px-5 text-xs font-semibold text-background hover:bg-foreground/90 gap-2"
          >
            <Icon icon={Add01Icon} className="size-4" /> Nuevo libro
          </Button>
        </div>
      </div>

      {errorOperacion && (
        <div role="alert" className="rounded-none border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {errorOperacion}
        </div>
      )}

      <TablaLibros
        cargando={cargando}
        errorCarga={errorCarga}
        libros={libros}
        total={totalLibros}
        hayBusqueda={busquedaAplicada.trim() !== ""}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
        elementosPorPagina={elementosPorPagina}
        eliminandoId={eliminandoId}
        onReintentar={() => void cargarDatos()}
        onNuevo={() => void abrirFormulario()}
        onEditar={(libro) => void abrirFormulario(libro)}
        onEliminar={setLibroParaEliminar}
      />

      <FormularioLibroDialog
        abierto={modalAbierto}
        setAbierto={setModalAbierto}
        libroEditado={libroEditado}
        formulario={formulario}
        erroresFormulario={erroresFormulario}
        errorServidor={errorModal}
        cargandoDetalle={cargandoDetalle}
        guardando={guardando}
        categorias={categorias}
        editoriales={editoriales}
        autores={autores}
        estados={estadosLibro}
        onCambiarCampo={actualizarCampo}
        onAutorCreado={(autor) => setAutores((actuales) => [...actuales, autor])}
        onSubmit={handleGuardar}
      />

      <ConfirmarEliminarDialog
        libro={libroParaEliminar}
        eliminandoId={eliminandoId}
        onCancelar={() => setLibroParaEliminar(null)}
        onConfirmar={() => void handleEliminar()}
      />
    </div>
  );
}

export default function PaginaAdminLibros() {
  return (
    <Suspense fallback={null}>
      <ContenidoAdminLibros />
    </Suspense>
  );
}
