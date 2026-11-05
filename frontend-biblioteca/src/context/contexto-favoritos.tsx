"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAutenticacion } from "@/context/contexto-autenticacion";
import { favoritosService } from "@/services/favoritos.service";

/** Clave con la que las versiones anteriores guardaban favoritos solo en el navegador. */
const CLAVE_LOCAL_ANTERIOR = "labiblioteca_favoritos";

interface ContextoFavoritosTipo {
  /** Cantidad de libros favoritos de la cuenta */
  total: number;
  cargando: boolean;
  error: string | null;
  esFavorito: (idLibro: number | string) => boolean;
  /** Agrega o quita el libro de los favoritos de la cuenta. Lanza si no hay sesión o falla el servidor. */
  alternar: (idLibro: number | string) => Promise<void>;
}

const ContextoFavoritos = createContext<ContextoFavoritosTipo | undefined>(undefined);

/** Migra a la cuenta los favoritos que existían solo en este navegador y limpia el almacenamiento local. */
async function migrarFavoritosLocales() {
  try {
    const crudo = localStorage.getItem(CLAVE_LOCAL_ANTERIOR);
    if (!crudo) return;
    const locales: { id?: string | number }[] = JSON.parse(crudo);
    const ids = locales.map((f) => Number(f.id)).filter((id) => Number.isInteger(id) && id > 0);
    await Promise.allSettled(ids.map((id) => favoritosService.agregar(id)));
    localStorage.removeItem(CLAVE_LOCAL_ANTERIOR);
  } catch {
    // Si el navegador bloquea el almacenamiento no hay nada que migrar
  }
}

export function ProveedorFavoritos({ children }: { children: React.ReactNode }) {
  const { usuario, estaAutenticado } = useAutenticacion();
  const idUsuario = usuario?.id ?? null;
  // Solo se guardan los ids: la ficha completa se pide por páginas en la pestaña de favoritos
  const [idsFavoritos, setIdsFavoritos] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!estaAutenticado) {
      setIdsFavoritos([]);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      setIdsFavoritos((await favoritosService.getIds()).map(Number));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus favoritos.");
    } finally {
      setCargando(false);
    }
  }, [estaAutenticado]);

  useEffect(() => {
    let activo = true;
    if (!idUsuario) {
      void Promise.resolve().then(() => {
        if (activo) setIdsFavoritos([]);
      });
      return () => {
        activo = false;
      };
    }
    void (async () => {
      await migrarFavoritosLocales();
      if (activo) await recargar();
    })();
    return () => {
      activo = false;
    };
  }, [idUsuario, recargar]);

  const ids = useMemo(() => new Set(idsFavoritos), [idsFavoritos]);

  const esFavorito = useCallback((idLibro: number | string) => ids.has(Number(idLibro)), [ids]);

  const alternar = useCallback(
    async (idLibro: number | string) => {
      if (!estaAutenticado) throw new Error("Inicia sesión para guardar libros en tus favoritos.");
      const id = Number(idLibro);
      if (ids.has(id)) {
        await favoritosService.quitar(id);
        setIdsFavoritos((actual) => actual.filter((existente) => existente !== id));
      } else {
        await favoritosService.agregar(id);
        await recargar();
      }
    },
    [estaAutenticado, ids, recargar]
  );

  const valor = useMemo(
    () => ({ total: idsFavoritos.length, cargando, error, esFavorito, alternar }),
    [idsFavoritos.length, cargando, error, esFavorito, alternar]
  );

  return <ContextoFavoritos.Provider value={valor}>{children}</ContextoFavoritos.Provider>;
}

export function useFavoritos() {
  const contexto = useContext(ContextoFavoritos);
  if (!contexto) throw new Error("useFavoritos debe usarse dentro de un ProveedorFavoritos");
  return contexto;
}
