"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usuariosService } from "@/services/usuarios.service";
import { fetchAPI } from "@/services/api-client";
import { getMensajeError } from "@/lib/errores";

interface MetadataUsuario {
  nombre?: string;
  avatar?: string;
  codigoBiblioteca?: string;
  [key: string]: unknown;
}

interface MetadataApp {
  role?: string;
  rol?: string;
  [key: string]: unknown;
}

type SupabaseUser = {
  id: string;
  email?: string | null;
  user_metadata?: MetadataUsuario;
  app_metadata?: MetadataApp;
};

export type RolUsuario = "invitado" | "lector" | "bibliotecario" | "administrador";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  avatar?: string;
  codigoBiblioteca?: string;
}

export interface ResultadoAuth {
  exito: boolean;
  mensaje?: string;
  requiereConfirmacion?: boolean;
  usuario?: Usuario | null;
}

interface ContextoAutenticacionTipo {
  usuario: Usuario | null;
  rol: RolUsuario;
  /** Administrador o Bibliotecario: puede entrar al panel de gestión */
  esPersonal: boolean;
  estaAutenticado: boolean;
  cargando: boolean;
  iniciarSesion: (email: string, password?: string) => Promise<ResultadoAuth>;
  cerrarSesion: () => Promise<void>;
  /** Vuelve a leer el perfil (nombre y rol) desde el backend */
  refrescarUsuario: () => Promise<void>;
}

const ContextoAutenticacion = createContext<ContextoAutenticacionTipo | undefined>(undefined);
const CLAVE_STORAGE_USUARIO = "labiblioteca_usuario_sesion";
const CLAVE_STORAGE_USUARIO_LEGACY = "bookshub_usuario_sesion";

const construirUsuario = (user: SupabaseUser | null): Usuario | null => {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};
  const rol = appMetadata.role || appMetadata.rol;
  const rolAsignado: RolUsuario =
    rol === "administrador" ? "administrador" : rol === "bibliotecario" ? "bibliotecario" : "lector";
  const email = user.email || "";

  return {
    id: user.id,
    nombre: metadata.nombre || email.split("@")[0],
    email,
    rol: rolAsignado,
    avatar: metadata.avatar,
    codigoBiblioteca: metadata.codigoBiblioteca,
  };
};

const rolDesdeBaseDeDatos = (nombreRol?: string): RolUsuario | null => {
  if (nombreRol === "Administrador") return "administrador";
  if (nombreRol === "Bibliotecario") return "bibliotecario";
  if (nombreRol === "Lector") return "lector";
  return null;
};

/** El rol autoritativo vive en public.usuarios; los metadatos de Supabase solo son respaldo. */
const construirUsuarioConPerfil = async (user: SupabaseUser | null): Promise<Usuario | null> => {
  const base = construirUsuario(user);
  if (!base) return null;
  try {
    const perfil = await usuariosService.getMiPerfil();
    return {
      ...base,
      rol: rolDesdeBaseDeDatos(perfil.nombre_rol) ?? base.rol,
      nombre: perfil.nombrecompleto_usuario || base.nombre,
    };
  } catch (err) {
    console.warn("No se pudo leer el perfil desde el backend; se usan los metadatos de la sesión:", err);
    return base;
  }
};

export function ProveedorAutenticacion({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Las sesiones sintéticas antiguas no son una fuente de autoridad.
    localStorage.removeItem(CLAVE_STORAGE_USUARIO);
    localStorage.removeItem(CLAVE_STORAGE_USUARIO_LEGACY);

    let activo = true;
    const actualizarUsuario = async (session: { user: SupabaseUser } | null) => {
      const resuelto = await construirUsuarioConPerfil(session?.user || null);
      if (!activo) return;
      setUsuario(resuelto);
      setCargando(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => actualizarUsuario(data?.session || null))
      .catch((err: unknown) => {
        console.warn("No se pudo obtener la sesión de Supabase:", err);
        setUsuario(null);
        setCargando(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUsuario(null);
      } else if (session?.user) {
        // Se difiere: supabase-js no permite llamar a su API dentro de este callback sin bloquearse
        setTimeout(() => void actualizarUsuario(session), 0);
        return;
      }
      setCargando(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  const iniciarSesion = async (email: string, password?: string): Promise<ResultadoAuth> => {
    if (!email || !password) {
      return { exito: false, mensaje: "Ingresa tu correo y contraseña." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Error en Supabase signInWithPassword:", error);
      if (error.message?.includes("Invalid login credentials")) {
        return { exito: false, mensaje: "Credenciales incorrectas (correo o contraseña no válidos)." };
      }
      if (error.name === "AuthRetryableFetchError" || error.message?.includes("Failed to fetch") || error.message?.includes("fetch")) {
        return { exito: false, mensaje: "No se pudo conectar con Supabase Auth. Asegúrate de haber reiniciado el servidor con pnpm dev." };
      }
      return { exito: false, mensaje: error.message };
    }

    if (!data.user) {
      return { exito: false, mensaje: "No se pudo recuperar la sesión del usuario." };
    }

    const usuarioConstruido = await construirUsuarioConPerfil(data.user);
    setUsuario(usuarioConstruido);
    return { exito: true, usuario: usuarioConstruido };
  };


  const refrescarUsuario = async () => {
    const { data } = await supabase.auth.getSession();
    setUsuario(await construirUsuarioConPerfil(data.session?.user ?? null));
  };

  const cerrarSesion = async () => {
    // scope "local": cierra solo esta sesión; el valor por defecto ("global") revoca las sesiones
    // de esa cuenta en todos los dispositivos y expulsa a quien comparta el mismo usuario.
    await supabase.auth.signOut({ scope: "local" });
    setUsuario(null);
    localStorage.removeItem(CLAVE_STORAGE_USUARIO);
  };

  return (
    <ContextoAutenticacion.Provider
      value={{
        usuario,
        rol: usuario?.rol || "invitado",
        esPersonal: usuario?.rol === "administrador" || usuario?.rol === "bibliotecario",
        estaAutenticado: usuario !== null,
        cargando,
        iniciarSesion,
        cerrarSesion,
        refrescarUsuario,
      }}
    >
      {children}
    </ContextoAutenticacion.Provider>
  );
}

export function useAutenticacion() {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) throw new Error("useAutenticacion debe usarse dentro de un ProveedorAutenticacion");
  return contexto;
}
