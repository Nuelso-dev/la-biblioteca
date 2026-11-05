import { Button } from "@/components/ui/button";

interface MostrarMasProps {
  visibles: number;
  total: number;
  /** Nombre en plural de lo que se lista, por ejemplo "sedes". */
  etiqueta: string;
  onMostrarMas: () => void;
}

export function MostrarMas({ visibles, total, etiqueta, onMostrarMas }: MostrarMasProps) {
  if (visibles >= total) return null;

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border pt-6">
      <p className="text-xs text-muted-foreground">
        Mostrando <span className="font-bold text-foreground">{visibles}</span> de{" "}
        <span className="font-bold text-foreground">{total}</span> {etiqueta}
      </p>
      <Button variant="outline" onClick={onMostrarMas} className="rounded-none text-xs font-semibold h-9">
        Mostrar más {etiqueta}
      </Button>
    </div>
  );
}
