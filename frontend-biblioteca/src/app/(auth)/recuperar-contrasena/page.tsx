import { LayoutAuth } from "@/components/layout/layout-auth";
import { RecuperarClaveForm } from "@/components/recuperar-clave-form";

export const metadata = {
  title: "Recuperar contraseña | LaBiblioteca",
  description: "Recibe un enlace por correo para crear una contraseña nueva en LaBiblioteca.",
};

export default function PaginaRecuperarClave() {
  return (
    <LayoutAuth>
      <RecuperarClaveForm />
    </LayoutAuth>
  );
}
