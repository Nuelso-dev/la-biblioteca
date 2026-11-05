import { Button } from "@/components/ui/button";

/** Números de página a mostrar: primera, última y la actual con sus vecinas; `null` marca un salto. */
function paginasVisibles(actual: number, total: number): (number | null)[] {
  const conjunto = new Set<number>([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...conjunto].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const resultado: (number | null)[] = [];
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) resultado.push(null);
    resultado.push(p);
  });
  return resultado;
}

interface PaginacionTablaProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  limite: number;
  onCambiar: (pagina: number) => void;
}

/** Pie de tabla con el rango mostrado y los controles de página (los controles solo aparecen con más de una página). */
export function PaginacionTabla({ pagina, totalPaginas, total, limite, onCambiar }: PaginacionTablaProps) {
  if (total === 0) return null;
  const desde = (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Mostrando <span className="font-semibold text-foreground">{desde}–{hasta}</span> de{" "}
        <span className="font-semibold text-foreground">{total}</span>
      </p>
      {totalPaginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)} className="h-8 rounded-none border-border px-3 text-xs">
            Anterior
          </Button>
          {paginasVisibles(pagina, totalPaginas).map((numero, indice) =>
            numero === null ? (
              <span key={`salto-${indice}`} className="px-1 text-xs text-muted-foreground">…</span>
            ) : (
              <Button
                key={numero}
                variant={numero === pagina ? "default" : "outline"}
                size="sm"
                aria-current={numero === pagina ? "page" : undefined}
                onClick={() => onCambiar(numero)}
                className="h-8 min-w-8 rounded-none border-border px-2 text-xs"
              >
                {numero}
              </Button>
            )
          )}
          <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)} className="h-8 rounded-none border-border px-3 text-xs">
            Siguiente
          </Button>
        </nav>
      )}
    </div>
  );
}
