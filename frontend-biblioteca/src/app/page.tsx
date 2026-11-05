"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { SeccionHero } from "@/components/inicio/seccion-hero";
import { SeccionCatalogoSemana } from "@/components/inicio/seccion-catalogo-semana";
import { SeccionComoFunciona } from "@/components/inicio/seccion-como-funciona";
import { bibliotecasService, librosService } from "@/services/api";
import type { Libro } from "@/services/libros.service";
import type { Biblioteca } from "@/services/bibliotecas.service";

export default function PaginaInicioLanding() {
  const router = useRouter();
  const [libros, setLibros] = useState<Libro[]>([]);
  const [totalLibros, setTotalLibros] = useState(0);
  const [sedes, setSedes] = useState<Biblioteca[]>([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");

  useEffect(() => {
    async function cargarDatosInicio() {
      setCargando(true);
      try {
        const [paginaLibros, dataSedes] = await Promise.all([
          librosService.getPagina({ catalogo: true, limit: 4 }).catch(() => ({ libros: [] as Libro[], total: 0 })),
          bibliotecasService.getActivas().catch(() => []),
        ]);

        setLibros(paginaLibros.libros);
        setTotalLibros(paginaLibros.total);
        setSedes(Array.isArray(dataSedes) ? dataSedes : []);
      } catch {
        setLibros([]);
      } finally {
        setCargando(false);
      }
    }

    cargarDatosInicio();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminoBusqueda.trim()) {
      router.push(`/libros?q=${encodeURIComponent(terminoBusqueda.trim())}`);
    } else {
      router.push("/libros");
    }
  };

  const libroDestacado = useMemo(() => {
    if (libros.length === 0) return null;
    return libros[0];
  }, [libros]);

  const librosCatalogo = useMemo(() => {
    if (libros.length === 0) return [];
    return libros.slice(0, 4);
  }, [libros]);

  const totalLibrosFormateado = useMemo(() => {
    return totalLibros.toLocaleString("es-CO");
  }, [totalLibros]);

  return (
    <LayoutPublico>
      <SeccionHero
        sedes={sedes}
        libroDestacado={libroDestacado}
        cargando={cargando}
        totalLibrosFormateado={totalLibrosFormateado}
        terminoBusqueda={terminoBusqueda}
        setTerminoBusqueda={setTerminoBusqueda}
        handleBuscar={handleBuscar}
      />
      <SeccionCatalogoSemana
        cargando={cargando}
        librosCatalogo={librosCatalogo}
        totalLibrosFormateado={totalLibrosFormateado}
      />
      <SeccionComoFunciona />
    </LayoutPublico>
  );
}
