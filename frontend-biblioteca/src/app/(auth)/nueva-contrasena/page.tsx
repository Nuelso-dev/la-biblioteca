import { LayoutAuth } from "@/components/layout/layout-auth";
import { RestablecerClaveForm } from "@/components/restablecer-clave-form";

export const metadata = {
  title: "Nueva contraseña | LaBiblioteca",
  description: "Crea una contraseña nueva para tu cuenta de LaBiblioteca.",
};

export default function PaginaRestablecerClave() {
  return (
    <LayoutAuth>
      <RestablecerClaveForm />
    </LayoutAuth>
  );
}
