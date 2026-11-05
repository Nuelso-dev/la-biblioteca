import { redirect } from "next/navigation";

const DESTINOS: Record<string, string> = {
  categorias: "/administracion/categorias",
  editoriales: "/administracion/editoriales",
  ubicaciones: "/administracion/sedes",
};

/** Ruta anterior con pestañas: redirige a la página propia de cada sección. */
export default async function PaginaAdminCatalogos({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  redirect(DESTINOS[tab ?? ""] ?? "/administracion/categorias");
}
