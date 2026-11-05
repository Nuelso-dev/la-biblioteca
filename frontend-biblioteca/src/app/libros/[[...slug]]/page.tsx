"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { LayoutConSidebar } from "@/components/layout/layout-con-sidebar";
import { TarjetaLibro, TarjetaLibroSkeleton } from "@/components/libros/tarjeta-libro";
import { SidebarFiltrosCatalogo, type FiltroExtra } from "@/components/libros/sidebar-filtros-catalogo";
import { PaginacionCatalogo } from "@/components/libros/paginacion-catalogo";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Book02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { autoresService, bibliotecasService, categoriasService, editorialesService, librosService, type Autor, type Biblioteca, type CategoriaLibro, type Editorial } from "@/services/api";
import { useTituloPagina } from "@/hooks/use-titulo-pagina";
import type { Libro } from "@/services/libros.service";

const ELEMENTOS_POR_PAGINA = 12;
const RETRASO_BUSQUEDA_MS = 350;

function parsearParametrosRuta(slugArray?: string[]) {
  if (!slugArray || slugArray.length === 0) {
    return { pagina: 1, busqueda: "" };
  }

  const primerSegmento = slugArray[0];
  const numPagina = parseInt(primerSegmento, 10);

  if (!isNaN(numPagina) && numPagina > 0) {
    const busquedaSegmento = slugArray[1]
      ? decodeURIComponent(slugArray[1]).replace(/-/g, " ")
      : "";
    return { pagina: numPagina, busqueda: busquedaSegmento };
  }

  const busquedaSegmento = decodeURIComponent(primerSegmento).replace(/-/g, " ");
  return { pagina: 1, busqueda: busquedaSegmento };
}

function ContenidoCatalogoLibros() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams();

  const slugArray = routeParams.slug as string[] | undefined;
  const { pagina: paginaUrl, busqueda: busquedaSlug } = parsearParametrosRuta(slugArray);

  const qParam = searchParams.get("q") || searchParams.get("busqueda") || "";
  const catParam = searchParams.get("cat") || searchParams.get("categoria") || "";
  const dispParam = searchParams.get("disp") === "true";
  const edParam = searchParams.get("ed") || "";
  const autParam = searchParams.get("aut") || "";
  const sedeParam = searchParams.get("sede") || "";

  const [libros, setLibros] = useState<Libro[]>([]);
  const [total, setTotal] = useState(0);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState<CategoriaLibro[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [busqueda, setBusqueda] = useState(qParam || busquedaSlug);
  // Se consulta al servidor con un pequeño retraso para no hacer una petición por tecla
  const [busquedaAplicada, setBusquedaAplicada] = useState(qParam || busquedaSlug);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(catParam || "Todas");
  const [soloDisponibles, setSoloDisponibles] = useState(dispParam);
  const [editorialSel, setEditorialSel] = useState(edParam);
  const [autorSel, setAutorSel] = useState(autParam);
  const [sedeSel, setSedeSel] = useState(sedeParam);
  const [editoriales, setEditoriales] = useState<Editorial[]>([]);
  const [autores, setAutores] = useState<Autor[]>([]);
  const [sedes, setSedes] = useState<Biblioteca[]>([]);

  // Al cambiar un filtro se vuelve a la página 1; si el usuario navega por la paginación manda la URL
  const [paginaForzada, setPaginaForzada] = useState<{ pagina: number; deUrl: number } | null>(null);
  const paginaActual = paginaForzada && paginaForzada.deUrl === paginaUrl ? paginaForzada.pagina : paginaUrl;
  const volverAPrimeraPagina = () => setPaginaForzada({ pagina: 1, deUrl: paginaUrl });

  const idCategoria =
    categoriaSeleccionada !== "Todas"
      ? categoriasCatalogo?.find(
          (c) => c.nombre_categlib.toLowerCase() === categoriaSeleccionada.toLowerCase()
        )?.id_categorias_libros
      : undefined;
  const categoriasListas = categoriasCatalogo !== null;

  useEffect(() => {
    let activo = true;
    categoriasService
      .getAll()
      .then((lista) => {
        if (activo) setCategoriasCatalogo(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (activo) setCategoriasCatalogo([]);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Opciones de los filtros adicionales; si alguno falla, el filtro simplemente queda vacío
  useEffect(() => {
    let activo = true;
    editorialesService.getAll().then((l) => activo && setEditoriales(Array.isArray(l) ? l : [])).catch(() => undefined);
    autoresService.getAll().then((l) => activo && setAutores(Array.isArray(l) ? l : [])).catch(() => undefined);
    bibliotecasService.getActivas().then((l) => activo && setSedes(Array.isArray(l) ? l : [])).catch(() => undefined);
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaAplicada(busqueda), RETRASO_BUSQUEDA_MS);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    if (!categoriasListas) return;
    let activo = true;

    (async () => {
      try {
        setCargando(true);
        setError(null);
        const pagina = await librosService.getPagina({
          busqueda: busquedaAplicada,
          idCategoria,
          disponible: soloDisponibles,
          idEditorial: editorialSel || undefined,
          idAutor: autorSel || undefined,
          idBiblioteca: sedeSel || undefined,
          catalogo: true,
          page: paginaActual,
          limit: ELEMENTOS_POR_PAGINA,
        });
        if (!activo) return;
        setLibros(pagina.libros);
        setTotal(pagina.total);
      } catch (err: unknown) {
        console.error("Error al cargar catálogo de libros:", err);
        if (activo) setError("No se pudo conectar con el catálogo de libros.");
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [categoriasListas, busquedaAplicada, idCategoria, soloDisponibles, editorialSel, autorSel, sedeSel, paginaActual, intento]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const queryParams = new URLSearchParams();
      if (categoriaSeleccionada && categoriaSeleccionada !== "Todas") {
        queryParams.set("cat", categoriaSeleccionada);
      }
      if (soloDisponibles) {
        queryParams.set("disp", "true");
      }
      if (editorialSel) queryParams.set("ed", editorialSel);
      if (autorSel) queryParams.set("aut", autorSel);
      if (sedeSel) queryParams.set("sede", sedeSel);

      const queryPart = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const slugBusqueda = busqueda.trim()
        ? `/${encodeURIComponent(busqueda.trim().toLowerCase().replace(/\s+/g, "-"))}`
        : "";

      const targetPath = `/libros/${paginaActual}${slugBusqueda}${queryPart}`;

      if (typeof window !== "undefined") {
        const actualPath = window.location.pathname + window.location.search;
        if (actualPath !== targetPath) {
          window.history.replaceState(null, "", targetPath);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [busqueda, categoriaSeleccionada, soloDisponibles, editorialSel, autorSel, sedeSel, paginaActual]);

  const totalPaginas = Math.max(1, Math.ceil(total / ELEMENTOS_POR_PAGINA));

  // Si la URL pide una página que ya no existe (por ejemplo tras filtrar), se lleva a la última
  useEffect(() => {
    if (!cargando && !error && total > 0 && paginaActual > totalPaginas) {
      router.replace(`/libros/${totalPaginas}`, { scroll: false });
    }
  }, [cargando, error, total, paginaActual, totalPaginas, router]);

  const construirUrlPagina = (numPagina: number) => {
    const queryParams = new URLSearchParams();
    if (categoriaSeleccionada && categoriaSeleccionada !== "Todas") queryParams.set("cat", categoriaSeleccionada);
    if (soloDisponibles) queryParams.set("disp", "true");
    if (editorialSel) queryParams.set("ed", editorialSel);
    if (autorSel) queryParams.set("aut", autorSel);
    if (sedeSel) queryParams.set("sede", sedeSel);

    const queryPart = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const slugBusqueda = busqueda.trim()
      ? `/${encodeURIComponent(busqueda.trim().toLowerCase().replace(/\s+/g, "-"))}`
      : "";

    return `/libros/${numPagina}${slugBusqueda}${queryPart}`;
  };

  const categorias = ["Todas", ...(categoriasCatalogo ?? []).map((c) => c.nombre_categlib)];

  const hayFiltrosActivos =
    categoriaSeleccionada !== "Todas" || soloDisponibles || busqueda.trim() !== "" || Boolean(editorialSel || autorSel || sedeSel);

  const limpiarFiltros = () => {
    setBusqueda("");
    setBusquedaAplicada("");
    setCategoriaSeleccionada("Todas");
    setSoloDisponibles(false);
    setEditorialSel("");
    setAutorSel("");
    setSedeSel("");
    router.push("/libros/1", { scroll: false });
  };

  const cambiarFiltro = (setter: (valor: string) => void) => (valor: string) => {
    setter(valor);
    volverAPrimeraPagina();
  };

  const filtrosExtra: FiltroExtra[] = [
    {
      id: "editorial",
      etiqueta: "Editorial",
      todas: "Todas las editoriales",
      valor: editorialSel,
      opciones: editoriales.map((e) => ({ valor: String(e.id_editorial), etiqueta: e.nombre_editorial ?? "" })),
      onChange: cambiarFiltro(setEditorialSel),
    },
    {
      id: "autor",
      etiqueta: "Autor",
      todas: "Todos los autores",
      valor: autorSel,
      opciones: autores.map((a) => ({ valor: String(a.id_autor), etiqueta: a.nombrecompleto_autor ?? "" })),
      onChange: cambiarFiltro(setAutorSel),
    },
    {
      id: "sede",
      etiqueta: "Sede",
      todas: "Todas las sedes",
      valor: sedeSel,
      opciones: sedes.map((b) => ({ valor: String(b.id_biblioteca), etiqueta: b.nombre_biblioteca ?? "" })),
      onChange: cambiarFiltro(setSedeSel),
    },
  ];

  // Título de la pestaña según lo que se está viendo: búsqueda o categoría
  const partesTitulo = [busquedaAplicada.trim() ? `“${busquedaAplicada.trim()}”` : "", categoriaSeleccionada !== "Todas" ? categoriaSeleccionada : ""].filter(Boolean);
  useTituloPagina(partesTitulo.length > 0 ? `${partesTitulo.join(" · ")} · Catálogo` : "Catálogo de libros");

  return (
    <LayoutConSidebar
      titulo="Catálogo"
      subtitulo={
        cargando && total === 0
          ? "Libros y ejemplares disponibles en la red de bibliotecas."
          : `Libros y ejemplares disponibles en la red de bibliotecas (${total} ${total === 1 ? "título" : "títulos"}${hayFiltrosActivos ? " con los filtros aplicados" : ""}).`
      }
      sidebar={
        <SidebarFiltrosCatalogo
          busqueda={busqueda}
          setBusqueda={(valor) => {
            setBusqueda(valor);
            volverAPrimeraPagina();
          }}
          categoriaSeleccionada={categoriaSeleccionada}
          setCategoriaSeleccionada={(valor) => {
            setCategoriaSeleccionada(valor);
            volverAPrimeraPagina();
          }}
          soloDisponibles={soloDisponibles}
          setSoloDisponibles={(valor) => {
            setSoloDisponibles(valor);
            volverAPrimeraPagina();
          }}
          categorias={categorias}
          filtrosExtra={filtrosExtra}
          hayFiltrosActivos={hayFiltrosActivos}
          resultadosCount={total}
          onLimpiarFiltros={limpiarFiltros}
        />
      }
    >
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <TarjetaLibroSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <EstadoVacio
          tipo="busqueda"
          titulo="No se pudieron cargar los libros"
          descripcion={error}
          onAccion={() => setIntento((n) => n + 1)}
          textoBoton="Reintentar"
        />
      ) : libros.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {libros.map((libro) => (
              <TarjetaLibro key={libro.id_libro} {...libro} />
            ))}
          </div>

          <PaginacionCatalogo
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            elementosPorPagina={ELEMENTOS_POR_PAGINA}
            totalResultados={total}
            construirUrlPagina={construirUrlPagina}
          />
        </>
      ) : (
        <EstadoVacio
          tipo="busqueda"
          titulo="No se encontraron libros"
          descripcion={
            busquedaAplicada
              ? `No existen libros en el catálogo que coincidan con "${busquedaAplicada}".`
              : "Cambia la búsqueda o quita algún filtro."
          }
          onAccion={limpiarFiltros}
          textoBoton="Restablecer filtros"
        />
      )}
    </LayoutConSidebar>
  );
}

export default function PaginaCatalogoLibros() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <Icon icon={Book02Icon} className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ContenidoCatalogoLibros />
    </Suspense>
  );
}
