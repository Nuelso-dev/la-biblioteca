import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { ContenidoComoFunciona } from "@/components/como-funciona/contenido-como-funciona";

export const metadata = {
  title: "Cómo funciona | LaBiblioteca",
  description:
    "Cómo pedir prestado un libro: explora el catálogo, solicita el ejemplar, retíralo en la sede y devuélvelo a tiempo. Plazos, límites y multas.",
};

export default function PaginaComoFunciona() {
  return (
    <LayoutPublico>
      <ContenidoComoFunciona />
    </LayoutPublico>
  );
}
