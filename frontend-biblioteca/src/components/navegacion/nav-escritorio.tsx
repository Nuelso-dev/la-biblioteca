import Link from "next/link";
import { ENLACES_NAVEGACION_ESCRITORIO, esEnlaceActivo } from "./enlaces-navegacion";

interface NavEscritorioProps {
  pathname: string;
}

export function NavEscritorio({ pathname }: NavEscritorioProps) {
  return (
    <nav className="hidden items-center gap-8 md:flex">
      {ENLACES_NAVEGACION_ESCRITORIO.map((enlace) => {
        const activo = esEnlaceActivo(pathname, enlace.href);

        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`text-sm transition-colors ${
              activo
                ? "border-b-2 border-primary pb-0.5 font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            {enlace.label}
          </Link>
        );
      })}
    </nav>
  );
}
