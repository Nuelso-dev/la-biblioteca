import { useState } from "react";
import { Search01Icon, FilterIcon, Cancel01Icon, RotateLeftIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Filtro desplegable adicional (editorial, autor, sede...). El valor "" significa "todos". */
export interface FiltroExtra {
  id: string;
  etiqueta: string;
  todas: string;
  valor: string;
  opciones: { valor: string; etiqueta: string }[];
  onChange: (valor: string) => void;
}

const TODOS = "__todos__";

function SelectorFiltro({ filtro, compacto }: { filtro: FiltroExtra; compacto: boolean }) {
  return (
    <div className={compacto ? "flex flex-col gap-1.5" : "flex flex-col gap-2"}>
      <label className={compacto ? "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider" : "text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
        {filtro.etiqueta}
      </label>
      <Select value={filtro.valor || TODOS} onValueChange={(v) => filtro.onChange(v === TODOS ? "" : v)}>
        <SelectTrigger className={compacto ? "w-full h-9 text-xs rounded-none border-border bg-background" : "w-full h-11 text-sm rounded-none border-border bg-background"}>
          <SelectValue placeholder={filtro.todas} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{filtro.todas}</SelectItem>
          {filtro.opciones.map((opcion) => (
            <SelectItem key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface SidebarFiltrosCatalogoProps {
  busqueda: string;
  setBusqueda: (valor: string) => void;
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: (valor: string) => void;
  soloDisponibles: boolean;
  setSoloDisponibles: (valor: boolean) => void;
  categorias: string[];
  filtrosExtra: FiltroExtra[];
  hayFiltrosActivos: boolean;
  resultadosCount: number;
  onLimpiarFiltros: () => void;
}

export function SidebarFiltrosCatalogo({
  busqueda,
  setBusqueda,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  soloDisponibles,
  setSoloDisponibles,
  categorias,
  filtrosExtra,
  hayFiltrosActivos,
  resultadosCount,
  onLimpiarFiltros,
}: SidebarFiltrosCatalogoProps) {
  const [sheetAbierto, setSheetAbierto] = useState(false);

  return (
    <>
      {/* Barra de control para Móvil (< lg) */}
      <div className="flex lg:hidden flex-col gap-3 w-full">
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Icon icon={Search01Icon} className="size-4 absolute left-3.5 top-3 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por título, autor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-8 h-10 text-base sm:text-xs rounded-none border-border bg-background focus-visible:ring-primary"
            />
            {busqueda && (
              <Button variant="unstyled" size={null}
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Icon icon={Cancel01Icon} className="size-4" />
              </Button>
            )}
          </div>

          <Sheet open={sheetAbierto} onOpenChange={setSheetAbierto}>
            <SheetTrigger asChild>
              <Button
                variant={hayFiltrosActivos ? "default" : "outline"}
                className="h-10 px-3.5 rounded-none border-border shrink-0 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Icon icon={FilterIcon} className="size-4" />
                <span>Filtros</span>
                {hayFiltrosActivos && (
                  <span className="size-2 rounded-full bg-accent-foreground ml-0.5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-none border-t border-border bg-card p-5 max-h-[85vh] overflow-y-auto"
            >
              <SheetHeader className="p-0 pb-4 border-b border-border text-left flex flex-row items-center justify-between">
                <SheetTitle className="text-base font-serif font-normal flex items-center gap-2">
                  <Icon icon={FilterIcon} className="size-4 text-primary" />
                  Filtros de Catálogo
                </SheetTitle>
                {hayFiltrosActivos && (
                  <Button variant="unstyled" size={null}
                    type="button"
                    onClick={() => {
                      onLimpiarFiltros();
                      setSheetAbierto(false);
                    }}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon icon={RotateLeftIcon} className="size-3" />
                    Limpiar
                  </Button>
                )}
              </SheetHeader>

              <div className="flex flex-col gap-5 py-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Categoría
                  </label>
                  <Select value={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada}>
                    <SelectTrigger className="w-full h-11 text-sm rounded-none border-border bg-background">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filtrosExtra.map((filtro) => (
                  <SelectorFiltro key={filtro.id} filtro={filtro} compacto={false} />
                ))}

                <div className="pt-2 flex items-center gap-2.5">
                  <Checkbox
                    id="disponible-sheet"
                    checked={soloDisponibles}
                    onCheckedChange={(c) => setSoloDisponibles(!!c)}
                    className="size-5 rounded-none"
                  />
                  <label
                    htmlFor="disponible-sheet"
                    className="text-sm font-medium text-foreground cursor-pointer select-none"
                  >
                    Solo libros disponibles para retiro
                  </label>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Resultados actuales</span>
                  <Badge variant="outline" className="text-xs uppercase font-mono font-semibold rounded-none">
                    {resultadosCount} títulos
                  </Badge>
                </div>
              </div>

              <SheetFooter className="p-0 pt-3 border-t border-border">
                <Button
                  onClick={() => setSheetAbierto(false)}
                  className="w-full h-11 text-xs font-semibold uppercase tracking-wider rounded-none"
                >
                  Ver {resultadosCount} resultados
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Chips de categorías en scroll horizontal táctil */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {categorias.slice(0, 8).map((cat) => {
            const activo = categoriaSeleccionada === cat;
            return (
              <Button variant="unstyled" size={null}
                key={cat}
                type="button"
                onClick={() => setCategoriaSeleccionada(activo && cat !== "Todas" ? "Todas" : cat)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer rounded-none ${
                  activo
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground"
                }`}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Panel Desktop Sticky (>= lg) */}
      <div className="hidden lg:flex flex-col gap-6 w-full">
        <div className="relative w-full">
          <Icon icon={Search01Icon} className="size-4 absolute left-3.5 top-3 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por título, autor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 pr-9 h-10 text-xs rounded-none border-border bg-background focus-visible:ring-primary"
          />
          {busqueda && (
            <Button variant="unstyled" size={null}
              type="button"
              onClick={() => setBusqueda("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <Icon icon={Cancel01Icon} className="size-4" />
            </Button>
          )}
        </div>

        <Card className="border border-border bg-card rounded-none shadow-none">
          <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-normal flex items-center gap-2 text-foreground font-serif">
              <Icon icon={FilterIcon} className="size-4 text-primary" />
              Filtros de búsqueda
            </CardTitle>
            {hayFiltrosActivos && (
              <Button variant="unstyled" size={null}
                type="button"
                onClick={onLimpiarFiltros}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Icon icon={RotateLeftIcon} className="size-3" />
                Limpiar
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Categoría
              </label>
              <Select value={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada}>
                <SelectTrigger className="w-full h-9 text-xs rounded-none border-border bg-background">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtrosExtra.map((filtro) => (
              <SelectorFiltro key={filtro.id} filtro={filtro} compacto />
            ))}

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="disponible-sidebar"
                  checked={soloDisponibles}
                  onCheckedChange={(c) => setSoloDisponibles(!!c)}
                />
                <label
                  htmlFor="disponible-sidebar"
                  className="text-xs font-medium text-foreground cursor-pointer select-none"
                >
                  Solo libros disponibles
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Resultados encontrados</span>
              <Badge variant="outline" className="text-[10px] uppercase font-semibold rounded-none">
                {resultadosCount}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
