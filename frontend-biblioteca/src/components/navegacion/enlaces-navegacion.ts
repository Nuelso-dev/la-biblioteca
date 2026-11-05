interface EnlaceNavegacion {
  href: string;
  label: string;
  /** Shown only in the mobile menu, not in the desktop header. */
  soloMovil?: boolean;
}

/** Full list used by the mobile menu. */
export const ENLACES_NAVEGACION: EnlaceNavegacion[] = [
  { href: "/libros", label: "Catálogo" },
  { href: "/autores", label: "Autores" },
  { href: "/sedes", label: "Sedes" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/quienes-somos", label: "Quiénes somos", soloMovil: true },
];

/** Subset shown in the desktop header. */
export const ENLACES_NAVEGACION_ESCRITORIO = ENLACES_NAVEGACION.filter((enlace) => !enlace.soloMovil);

export function esEnlaceActivo(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}
