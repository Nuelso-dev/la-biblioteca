import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Libro } from "./tipos";

interface ConfirmarEliminarDialogProps {
  libro: Libro | null;
  eliminandoId: number | string | null;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export function ConfirmarEliminarDialog({
  libro,
  eliminandoId,
  onCancelar,
  onConfirmar,
}: ConfirmarEliminarDialogProps) {
  return (
    <Dialog open={!!libro} onOpenChange={onCancelar}>
      <DialogContent className="admin-touch sm:max-w-md rounded-none bg-card border-border shadow-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">¿Confirmas la eliminación?</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Esta acción no se puede deshacer. Se eliminará el libro{" "}
            <strong className="text-foreground">{libro?.titulo_libro}</strong> del inventario.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} className="rounded-none font-semibold">
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmar}
            disabled={eliminandoId !== null}
            className="rounded-none font-semibold"
          >
            {eliminandoId !== null ? "Eliminando..." : "Sí, eliminar libro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
