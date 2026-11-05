"use client";

import { useState } from "react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapaSelector } from "@/components/mapa/mapa-selector";
import { bibliotecasService, coordenadasDeSede, type Biblioteca } from "@/services/bibliotecas.service";
import { getMensajeError } from "@/lib/errores";

type Campo = "nombre" | "direccion" | "telefono" | "descripcion";

const CAMPOS: { clave: Campo; etiqueta: string; placeholder: string }[] = [
  { clave: "nombre", etiqueta: "Nombre", placeholder: "Ej. Sede principal" },
  { clave: "direccion", etiqueta: "Dirección", placeholder: "Ej. Carrera 48 # 1-125" },
  { clave: "telefono", etiqueta: "Teléfono", placeholder: "Ej. +57 604 426 6460" },
  { clave: "descripcion", etiqueta: "Descripción / horarios", placeholder: "Ej. Lunes a viernes, 8:00 a. m. a 6:00 p. m." },
];

interface FormularioSedeProps {
  abierto: boolean;
  /** Sede a editar; null para crear una nueva. */
  sede: Biblioteca | null;
  onCerrar: () => void;
  onGuardada: () => void;
}

/** Diálogo para crear o editar una sede, con selector de ubicación en el mapa. */
export function FormularioSede({ abierto, sede, onCerrar, onGuardada }: FormularioSedeProps) {
  // El contenido se monta al abrir, así el estado siempre parte de la sede recibida
  return (
    <Dialog open={abierto} onOpenChange={(valor) => !valor && onCerrar()}>
      <DialogContent className="admin-touch max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-none bg-card border-border shadow-2xl">
        {abierto && <ContenidoFormulario key={sede?.id_biblioteca ?? "nueva"} sede={sede} onCerrar={onCerrar} onGuardada={onGuardada} />}
      </DialogContent>
    </Dialog>
  );
}

function ContenidoFormulario({ sede, onCerrar, onGuardada }: Omit<FormularioSedeProps, "abierto">) {
  const inicial = sede ? coordenadasDeSede(sede) : null;
  const [valores, setValores] = useState<Record<Campo, string>>({
    nombre: sede?.nombre_biblioteca ?? "",
    direccion: sede?.direccion_biblioteca ?? "",
    telefono: sede?.telefono_biblioteca ?? "",
    descripcion: sede?.descripcion_biblioteca ?? "",
  });
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(inicial);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: Campo, valor: string) => {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    if (campo === "nombre") setErrorNombre(null);
  };

  const guardar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valores.nombre.trim()) {
      setErrorNombre("El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    setErrorServidor(null);
    const datos = { ...valores, latitud: punto?.lat ?? null, longitud: punto?.lng ?? null, quitarUbicacion: Boolean(sede && inicial && !punto) };
    try {
      if (sede) await bibliotecasService.update(sede.id_biblioteca, datos);
      else await bibliotecasService.create(datos);
      onGuardada();
    } catch (err) {
      setErrorServidor(getMensajeError(err, "No se pudo guardar la sede."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-serif text-2xl font-normal">{sede ? "Editar sede" : "Nueva sede"}</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Completa solo la información registrada para esta sede. Marca su ubicación en el mapa para que los lectores puedan ver cómo llegar.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        {CAMPOS.map(({ clave, etiqueta, placeholder }) => (
          <div key={clave} className="flex flex-col gap-2">
            <Label htmlFor={`sede-${clave}`} className="text-xs font-semibold">{etiqueta}{clave === "nombre" ? " *" : ""}</Label>
            <Input
              id={`sede-${clave}`}
              value={valores[clave]}
              placeholder={placeholder}
              aria-invalid={clave === "nombre" && Boolean(errorNombre)}
              onChange={(e) => cambiar(clave, e.target.value)}
              className="h-10 text-xs rounded-none border-border bg-background"
            />
            {clave === "nombre" && errorNombre && <p role="alert" className="text-[11px] text-destructive">{errorNombre}</p>}
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold">Ubicación en el mapa</Label>
          <MapaSelector
            latitud={punto?.lat ?? null}
            longitud={punto?.lng ?? null}
            busquedaInicial={valores.direccion}
            onChange={(elegido) => {
              setPunto({ lat: elegido.lat, lng: elegido.lng });
              // Al elegir un lugar se propone su dirección, sin pisar la que ya se haya escrito a mano
              if (elegido.direccion && !valores.direccion.trim()) cambiar("direccion", elegido.direccion);
            }}
          />
          {punto && (
            <button type="button" onClick={() => setPunto(null)} className="self-start text-[11px] font-semibold text-primary underline-offset-2 hover:underline">
              Quitar ubicación del mapa
            </button>
          )}
        </div>

        {errorServidor && <p role="alert" className="text-xs text-destructive">{errorServidor}</p>}
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando} className="rounded-none font-semibold">Cancelar</Button>
        <Button type="submit" disabled={guardando} className="rounded-none font-semibold">
          {guardando && <Icon icon={Clock01Icon} className="size-4 animate-spin" />}
          {sede ? "Guardar cambios" : "Crear sede"}
        </Button>
      </DialogFooter>
    </form>
  );
}
