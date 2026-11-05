"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Textarea } from "@/components/ui/textarea";
import { SelectorPortada } from "./selector-portada";
import { SelectorAutores } from "./selector-autores";
import { IDIOMAS_SUGERIDOS, type ErroresFormularioLibro, type FormularioLibro, type Libro } from "./tipos";
import type { CategoriaLibro } from "@/services/categorias.service";
import type { Editorial } from "@/services/editoriales.service";
import type { Autor } from "@/services/autores.service";
import type { Estado } from "@/services/config.service";

interface FormularioLibroProps {
  abierto: boolean;
  setAbierto: (abierto: boolean) => void;
  libroEditado: Libro | null;
  formulario: FormularioLibro;
  erroresFormulario: ErroresFormularioLibro;
  errorServidor?: string | null;
  cargandoDetalle?: boolean;
  guardando: boolean;
  categorias: CategoriaLibro[];
  editoriales: Editorial[];
  autores: Autor[];
  estados: Estado[];
  onCambiarCampo: <K extends keyof FormularioLibro>(campo: K, valor: FormularioLibro[K]) => void;
  onAutorCreado: (autor: Autor) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function Obligatorio() {
  return <span className="text-destructive" aria-hidden="true"> *</span>;
}

function MensajeError({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} role="alert" className="text-[11px] text-destructive">
      {mensaje}
    </p>
  );
}

const claseInvalido = "border-destructive focus-visible:ring-destructive";

export function FormularioLibroDialog({
  abierto,
  setAbierto,
  libroEditado,
  formulario,
  erroresFormulario,
  errorServidor,
  cargandoDetalle,
  guardando,
  categorias,
  editoriales,
  autores,
  estados,
  onCambiarCampo,
  onAutorCreado,
  onSubmit,
}: FormularioLibroProps) {
  const bloqueado = guardando || Boolean(cargandoDetalle);

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogContent className="admin-touch sm:max-w-2xl rounded-none bg-card border-border shadow-none max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">
            {libroEditado ? "Editar libro" : "Nuevo libro"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Los campos marcados con <span className="text-destructive font-semibold">*</span> son obligatorios. Los ejemplares
            físicos se administran en la sección Ejemplares.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          {errorServidor && (
            <div role="alert" className="flex items-start gap-2.5 p-3 text-xs border border-destructive/30 bg-destructive/10 text-destructive rounded-none">
              <Icon icon={AlertCircleIcon} className="size-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorServidor}</span>
            </div>
          )}

          {cargandoDetalle && (
            <p className="text-xs text-muted-foreground">Cargando datos del libro...</p>
          )}

          {/* ── Datos principales ─────────────────────────── */}
          <fieldset disabled={bloqueado} className="flex flex-col gap-4 border-0 p-0 m-0 min-w-0">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Datos principales
            </legend>

            <div className="flex flex-col gap-2">
              <Label htmlFor="titulo" className="text-xs font-semibold">Título<Obligatorio /></Label>
              <Input
                id="titulo"
                value={formulario.titulo}
                onChange={(e) => onCambiarCampo("titulo", e.target.value)}
                placeholder="Ej. Cien años de soledad"
                aria-invalid={Boolean(erroresFormulario.titulo)}
                aria-describedby={erroresFormulario.titulo ? "titulo-error" : undefined}
                className={`h-10 text-xs rounded-none border-border bg-background ${erroresFormulario.titulo ? claseInvalido : ""}`}
              />
              <MensajeError id="titulo-error" mensaje={erroresFormulario.titulo} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="idCategoria" className="text-xs font-semibold">Categoría<Obligatorio /></Label>
                <SelectNativo
                  id="idCategoria"
                  value={formulario.idCategoria ?? ""}
                  aria-invalid={Boolean(erroresFormulario.idCategoria)}
                  onChange={(e) => onCambiarCampo("idCategoria", e.target.value ? Number(e.target.value) : null)}
                  className={erroresFormulario.idCategoria ? claseInvalido : ""}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categorias_libros} value={cat.id_categorias_libros}>
                      {cat.nombre_categlib}
                    </option>
                  ))}
                </SelectNativo>
                <MensajeError id="categoria-error" mensaje={erroresFormulario.idCategoria} />
                {categorias.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    No hay categorías registradas.{" "}
                    <a href="/administracion/categorias" className="font-semibold text-primary underline-offset-2 hover:underline">Crear una categoría</a>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="isbn" className="text-xs font-semibold">ISBN</Label>
                <Input
                  id="isbn"
                  value={formulario.isbn}
                  onChange={(e) => onCambiarCampo("isbn", e.target.value)}
                  placeholder="978-958-..."
                  aria-invalid={Boolean(erroresFormulario.isbn)}
                  className={`h-10 text-xs rounded-none border-border bg-background font-mono ${erroresFormulario.isbn ? claseInvalido : ""}`}
                />
                <MensajeError id="isbn-error" mensaje={erroresFormulario.isbn} />
                {!erroresFormulario.isbn && <p className="text-[11px] text-muted-foreground">Opcional, pero no puede repetirse entre libros.</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="idEditorial" className="text-xs font-semibold">Editorial<Obligatorio /></Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <SelectNativo
                  id="idEditorial"
                  value={formulario.idEditorial ?? ""}
                  aria-invalid={Boolean(erroresFormulario.idEditorial)}
                  onChange={(e) => {
                    onCambiarCampo("idEditorial", e.target.value ? Number(e.target.value) : null);
                    if (e.target.value) onCambiarCampo("editorialNueva", "");
                  }}
                  className={erroresFormulario.idEditorial ? claseInvalido : ""}
                >
                  <option value="">Seleccionar editorial existente...</option>
                  {editoriales.map((ed) => (
                    <option key={ed.id_editorial} value={ed.id_editorial}>
                      {ed.nombre_editorial}
                    </option>
                  ))}
                </SelectNativo>
                <Input
                  id="editorialNueva"
                  value={formulario.editorialNueva}
                  onChange={(e) => {
                    onCambiarCampo("editorialNueva", e.target.value);
                    if (e.target.value.trim()) onCambiarCampo("idEditorial", null);
                  }}
                  placeholder="...o escribe una editorial nueva"
                  className="h-10 text-xs rounded-none border-border bg-background"
                />
              </div>
              <MensajeError id="editorial-error" mensaje={erroresFormulario.idEditorial} />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Autores</Label>
              <SelectorAutores
                autores={autores}
                seleccionados={formulario.autoresIds}
                onChange={(ids) => onCambiarCampo("autoresIds", ids)}
                onAutorCreado={onAutorCreado}
                disabled={bloqueado}
              />
              <p className="text-[11px] text-muted-foreground">Opcional. Puedes asignar varios autores o crear uno nuevo desde aquí.</p>
            </div>
          </fieldset>

          {/* ── Publicación ───────────────────────────────── */}
          <fieldset disabled={bloqueado} className="flex flex-col gap-4 border-0 p-0 m-0 min-w-0">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Publicación
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="numPaginas" className="text-xs font-semibold">Número de páginas</Label>
                <Input
                  id="numPaginas"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={formulario.numPaginas}
                  onChange={(e) => onCambiarCampo("numPaginas", e.target.value)}
                  aria-invalid={Boolean(erroresFormulario.numPaginas)}
                  className={`h-10 text-xs rounded-none border-border bg-background font-mono ${erroresFormulario.numPaginas ? claseInvalido : ""}`}
                />
                <MensajeError id="paginas-error" mensaje={erroresFormulario.numPaginas} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="idioma" className="text-xs font-semibold">Idioma</Label>
                <Input
                  id="idioma"
                  list="idiomas-sugeridos"
                  value={formulario.idioma}
                  onChange={(e) => onCambiarCampo("idioma", e.target.value)}
                  className="h-10 text-xs rounded-none border-border bg-background"
                />
                <datalist id="idiomas-sugeridos">
                  {IDIOMAS_SUGERIDOS.map((idioma) => (
                    <option key={idioma} value={idioma} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="fechaPublicacion" className="text-xs font-semibold">Fecha de publicación</Label>
                <Input
                  id="fechaPublicacion"
                  type="date"
                  value={formulario.fechaPublicacion}
                  onChange={(e) => onCambiarCampo("fechaPublicacion", e.target.value)}
                  aria-invalid={Boolean(erroresFormulario.fechaPublicacion)}
                  className={`h-10 text-xs rounded-none border-border bg-background ${erroresFormulario.fechaPublicacion ? claseInvalido : ""}`}
                />
                <MensajeError id="fecha-error" mensaje={erroresFormulario.fechaPublicacion} />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="idEstado" className="text-xs font-semibold">Estado en el catálogo</Label>
              <SelectNativo
                id="idEstado"
                value={formulario.idEstado ?? ""}
                onChange={(e) => onCambiarCampo("idEstado", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Automático (según sus ejemplares)</option>
                {estados
                  .filter((estado) => estado.codigo_estado === "DESCATALOGADO")
                  .map((estado) => (
                    <option key={estado.id_estado} value={estado.id_estado}>
                      {estado.nombre_estado} (oculto del catálogo público)
                    </option>
                  ))}
              </SelectNativo>
              <p className="text-[11px] text-muted-foreground">
                En modo automático el libro pasa a Agotado cuando ninguno de sus ejemplares está disponible, y vuelve a Disponible al devolverse uno.
              </p>
            </div>
          </fieldset>

          {/* ── Portada y descripción ─────────────────────── */}
          <fieldset disabled={bloqueado} className="flex flex-col gap-4 border-0 p-0 m-0 min-w-0">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Portada y descripción
            </legend>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Portada</Label>
              <SelectorPortada valor={formulario.portada} onChange={(nombre) => onCambiarCampo("portada", nombre)} disabled={bloqueado} />
              <p className="text-[11px] text-muted-foreground">Elige una imagen ya subida; no hace falta pegar una dirección.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descripcion" className="text-xs font-semibold">Descripción / sinopsis</Label>
              <Textarea
                id="descripcion"
                value={formulario.descripcion}
                onChange={(e) => onCambiarCampo("descripcion", e.target.value)}
                placeholder="Breve descripción del contenido del libro..."
                className="min-h-24 text-xs rounded-none border-border bg-background"
              />
            </div>
          </fieldset>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setAbierto(false)} className="rounded-none font-semibold">
              Cancelar
            </Button>
            <Button type="submit" disabled={bloqueado} className="rounded-none font-semibold bg-foreground text-background hover:bg-foreground/90">
              {guardando ? "Guardando..." : libroEditado ? "Guardar cambios" : "Crear libro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
