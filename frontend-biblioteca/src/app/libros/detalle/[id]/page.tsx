"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { ContenedorPagina } from "@/components/ui/contenedor-pagina";
import { FichaLibroCard } from "@/components/libros/ficha-libro-card";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Skeleton } from "@/components/ui/skeleton";
import { librosService, solicitudesService } from "@/services/api";
import type { Libro } from "@/services/libros.service";
import { useFavoritos } from "@/context/contexto-favoritos";
import { useTituloPagina } from "@/hooks/use-titulo-pagina";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { getMensajeError } from "@/lib/errores";
import { idDesdeParametroLibro } from "@/lib/libros-utils";

export default function PaginaDetalleLibro() {
  const params = useParams();
  const router = useRouter();
  const { usuario, estaAutenticado } = useAutenticacion();
  // La URL es "7-cien-anos-de-soledad"; el backend solo necesita el número inicial
  const idLibro = idDesdeParametroLibro(params.id as string) ?? "";

  const [libro, setLibro] = useState<Libro | null>(null);
  useTituloPagina(libro?.titulo_libro);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const { esFavorito: marcadoComoFavorito, alternar } = useFavoritos();
  const [errorFavorito, setErrorFavorito] = useState<string | null>(null);
  const [reservaExito, setReservaExito] = useState(false);
  const [ejemplarSeleccionadoId, setEjemplarSeleccionadoId] = useState<number | string | null>(null);

  useEffect(() => {
    async function cargarDetalle() {
      if (!idLibro) {
        setError("La dirección del libro no es válida.");
        setCargando(false);
        return;
      }
      try {
        setCargando(true);
        setError(null);
        const data = await librosService.getById(idLibro);
        setLibro(data);

        // Seleccionar automáticamente el primer ejemplar disponible si existe
        const primerDisponible = data?.ejemplares?.find((e) =>
          e.codigo_estado?.toUpperCase() === "DISPONIBLE"
        );
        if (primerDisponible) {
          setEjemplarSeleccionadoId(primerDisponible.id_ejemplar);
        } else if (data?.id_ejemplar) {
          setEjemplarSeleccionadoId(data.id_ejemplar);
        } else if (data?.ejemplares?.[0]) {
          setEjemplarSeleccionadoId(data.ejemplares[0].id_ejemplar);
        }

      } catch (err: unknown) {
        console.error("Error al cargar detalle del libro:", err);
        setError(getMensajeError(err, "No se encontró el libro solicitado."));
      } finally {
        setCargando(false);
      }
    }

    cargarDetalle();
  }, [idLibro]);

  const esFavorito = marcadoComoFavorito(libro?.id_libro ?? idLibro);

  const manejarGuardarFavorito = async () => {
    if (!estaAutenticado) {
      router.push(`/iniciar-sesion?redirect=${encodeURIComponent(`/libros/detalle/${idLibro}`)}`);
      return;
    }
    setErrorFavorito(null);
    try {
      await alternar(libro?.id_libro ?? idLibro);
    } catch (err: unknown) {
      setErrorFavorito(getMensajeError(err, "No se pudo actualizar tus favoritos."));
    }
  };

  const solicitarReservaDirecta = async () => {
    if (!estaAutenticado) {
      router.push(`/iniciar-sesion?redirect=${encodeURIComponent(`/libros/detalle/${idLibro}`)}`);
      return;
    }

    if (!usuario?.id) {
      setErrorReserva("No se pudo identificar tu sesión. Inicia sesión de nuevo.");
      return;
    }

    const idEjemplarTarget = ejemplarSeleccionadoId || libro?.id_ejemplar;
    if (!idEjemplarTarget) {
      setErrorReserva("Este libro no tiene ejemplares disponibles para préstamo.");
      return;
    }

    try {
      setSolicitando(true);
      setErrorReserva(null);
      await solicitudesService.crear({ id_ejemplar: idEjemplarTarget });
      setReservaExito(true);
      setTimeout(() => setReservaExito(false), 5000);
    } catch (err: unknown) {
      setErrorReserva(getMensajeError(err, "No se pudo enviar la solicitud."));
    } finally {
      setSolicitando(false);
    }
  };

  if (cargando) {
    return (
      <LayoutPublico>
        <ContenedorPagina maxAnchoClass="max-w-7xl">
          <Skeleton className="h-6 w-44 rounded-none mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 flex flex-col items-center">
              <Skeleton className="aspect-[3/4] w-full max-w-[300px] rounded-none mb-6" />
              <div className="w-full max-w-[300px] flex flex-col gap-3">
                <Skeleton className="h-11 w-full rounded-none" />
                <Skeleton className="h-11 w-full rounded-none" />
              </div>
            </div>
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-32 rounded-none" />
                <Skeleton className="h-10 w-3/4 rounded-none" />
                <Skeleton className="h-5 w-1/2 rounded-none" />
              </div>
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Skeleton className="h-16 w-full rounded-none" />
                <Skeleton className="h-16 w-full rounded-none" />
                <Skeleton className="h-16 w-full rounded-none" />
                <Skeleton className="h-16 w-full rounded-none" />
              </div>
            </div>
          </div>
        </ContenedorPagina>
      </LayoutPublico>
    );
  }

  if (error || !libro) {
    return (
      <LayoutPublico>
        <ContenedorPagina maxAnchoClass="max-w-7xl">
          <EstadoVacio
            tipo="busqueda"
            titulo="Libro no encontrado"
            descripcion={error || "El libro consultado no existe o fue retirado del catálogo."}
            onAccion={() => router.push("/libros")}
            textoBoton="Volver al catálogo"
          />
        </ContenedorPagina>
      </LayoutPublico>
    );
  }

  const ejemplarSeleccionado = libro?.ejemplares?.find(
    (e) => String(e.id_ejemplar) === String(ejemplarSeleccionadoId)
  );
  const reservaDisponible = Boolean(
    ejemplarSeleccionado
      ? ejemplarSeleccionado.codigo_estado?.toUpperCase() === "DISPONIBLE"
      : libro.id_ejemplar
  );

  const tituloMostrar = libro.titulo_libro || libro.titulo_libro || "Detalle del libro";

  return (
    <LayoutPublico>
      <ContenedorPagina maxAnchoClass="max-w-7xl">
        <nav aria-label="Ruta de navegación" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <span className="text-border">/</span>
          <Link href="/libros" className="hover:text-primary transition-colors">Catálogo</Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{tituloMostrar}</span>
        </nav>

        <FichaLibroCard
          libro={libro}
          esFavorito={esFavorito}
          onGuardarFavorito={() => void manejarGuardarFavorito()}
          solicitando={solicitando}
          reservaDisponible={reservaDisponible}
          errorReserva={errorReserva ?? errorFavorito}
          reservaExito={reservaExito}
          ejemplarSeleccionadoId={ejemplarSeleccionadoId}
          onSeleccionarEjemplar={(idEj) => setEjemplarSeleccionadoId(idEj)}
          onSolicitarReserva={() => void solicitarReservaDirecta()}
        />
      </ContenedorPagina>
    </LayoutPublico>
  );
}
