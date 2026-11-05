import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function generarNumerosPaginas(paginaActual: number, totalPaginas: number): (number | string)[] {
  const paginas: (number | string)[] = [];
  if (totalPaginas <= 5) {
    for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
  } else {
    paginas.push(1);
    if (paginaActual > 3) paginas.push("...");

    const inicio = Math.max(2, paginaActual - 1);
    const fin = Math.min(totalPaginas - 1, paginaActual + 1);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    if (paginaActual < totalPaginas - 2) paginas.push("...");
    paginas.push(totalPaginas);
  }
  return paginas;
}

interface PaginacionCatalogoProps {
  paginaActual: number;
  totalPaginas: number;
  elementosPorPagina: number;
  totalResultados: number;
  construirUrlPagina: (numPagina: number) => string;
}

export function PaginacionCatalogo({
  paginaActual,
  totalPaginas,
  elementosPorPagina,
  totalResultados,
  construirUrlPagina,
}: PaginacionCatalogoProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
      <p className="text-xs text-muted-foreground font-medium">
        Mostrando{" "}
        <span className="font-bold text-foreground">
          {(paginaActual - 1) * elementosPorPagina + 1}
        </span>{" "}
        a{" "}
        <span className="font-bold text-foreground">
          {Math.min(paginaActual * elementosPorPagina, totalResultados)}
        </span>{" "}
        de <span className="font-bold text-foreground">{totalResultados}</span> libros
      </p>

      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={construirUrlPagina(Math.max(1, paginaActual - 1))}
              disabled={paginaActual === 1}
            />
          </PaginationItem>

          {generarNumerosPaginas(paginaActual, totalPaginas).map((num, i) => (
            <PaginationItem key={i}>
              {num === "..." ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href={construirUrlPagina(Number(num))}
                  isActive={paginaActual === num}
                >
                  {num}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href={construirUrlPagina(Math.min(totalPaginas, paginaActual + 1))}
              disabled={paginaActual === totalPaginas}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
