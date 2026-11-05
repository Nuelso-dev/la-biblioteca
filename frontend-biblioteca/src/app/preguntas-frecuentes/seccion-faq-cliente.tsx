"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search01Icon,
  ArrowDown01Icon,
  HelpCircleIcon,
  Building01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReglasServicio } from "@/hooks/use-reglas-servicio";

interface PreguntaFaq {
  id: string;
  categoria: string;
  pregunta: string;
  respuesta: string;
}

interface DatosFaq {
  diasRetiro: string;
  diasPrestamo: string;
  maxPrestamos: string;
  tarifa: string;
}

/** Preguntas frecuentes. Las cifras (plazos, límites, tarifa) vienen de la configuración de la biblioteca. */
function construirPreguntas({ diasRetiro, diasPrestamo, maxPrestamos, tarifa }: DatosFaq): PreguntaFaq[] {
  return [
    {
      id: "faq-1",
      categoria: "Préstamos y renovaciones",
      pregunta: "¿Cuántos libros puedo tener en préstamo al mismo tiempo?",
      respuesta: `Puedes tener hasta ${maxPrestamos} a la vez. Cada préstamo dura ${diasPrestamo}. Cuando devuelves un libro, recuperas ese cupo.`,
    },
    {
      id: "faq-2",
      categoria: "Préstamos y renovaciones",
      pregunta: "¿Cómo puedo renovar la fecha de devolución de un libro?",
      respuesta:
        "Desde la pestaña “Mis préstamos” de tu cuenta puedes renovar un préstamo activo. La renovación suma 7 días y solo se puede hacer mientras el préstamo no haya vencido.",
    },
    {
      id: "faq-3",
      categoria: "Préstamos y renovaciones",
      pregunta: "¿Qué ocurre si devuelvo un libro después de la fecha límite?",
      respuesta: `Se genera una multa de ${tarifa} por cada día de retraso. Puedes verla en la pestaña “Mis multas” de tu cuenta y se paga en la sede. La administración puede exonerarla en casos justificados.`,
    },
    {
      id: "faq-4",
      categoria: "Reservas y retiros",
      pregunta: "¿Cuánto tiempo tengo para retirar un libro aprobado?",
      respuesta: `Cuando el personal aprueba tu solicitud, el ejemplar queda reservado a tu nombre y tienes ${diasRetiro} para pasar por la sede. Si no lo retiras a tiempo, la reserva se cancela y el ejemplar vuelve a estar disponible.`,
    },
    {
      id: "faq-5",
      categoria: "Reservas y retiros",
      pregunta: "¿Puedo cancelar una solicitud si ya no necesito el libro?",
      respuesta:
        "Sí. Mientras la solicitud esté pendiente, entra a “Mis préstamos” y pulsa “Cancelar solicitud”. Si ya fue aprobada, avisa al personal de la sede para que libere la reserva.",
    },
    {
      id: "faq-6",
      categoria: "Reservas y retiros",
      pregunta: "¿Qué hago si el libro que quiero no tiene copias disponibles?",
      respuesta:
        "Puedes guardarlo en favoritos para volver a él después y usar los filtros del catálogo (por sede, editorial o autor) para ver si otra sede tiene una copia disponible.",
    },
    {
      id: "faq-7",
      categoria: "Cuenta y registro",
      pregunta: "¿Quiénes pueden solicitar préstamos?",
      respuesta:
        "Los lectores con cuenta creada por la biblioteca. Las cuentas suspendidas o inactivas por la administración no pueden hacer solicitudes.",
    },
    {
      id: "faq-8",
      categoria: "Cuenta y registro",
      pregunta: "¿Qué necesito presentar para retirar mi libro?",
      respuesta: "Tu documento de identidad o carné, en la ventanilla de la sede donde está reservado el ejemplar.",
    },
    {
      id: "faq-9",
      categoria: "Cuenta y registro",
      pregunta: "¿Cómo puedo actualizar mis datos personales?",
      respuesta:
        "En “Mi cuenta” puedes editar tu nombre, documento de identidad y teléfono. El correo y el rol los administra la biblioteca; si necesitas cambiarlos, acércate a una sede.",
    },
    {
      id: "faq-10",
      categoria: "Sedes y servicios",
      pregunta: "¿Dónde veo los horarios y cómo llego a una sede?",
      respuesta:
        "En la sección Sedes encuentras la dirección, el teléfono y el horario de cada biblioteca, junto con un mapa y el botón “Cómo llegar” para abrir la ruta desde donde estés.",
    },
  ];
}

const CATEGORIAS = [
  "Todas",
  "Préstamos y renovaciones",
  "Reservas y retiros",
  "Cuenta y registro",
  "Sedes y servicios",
];

export function SeccionFaqCliente() {
  const { diasRetiro, diasPrestamo, maxPrestamos, tarifa } = useReglasServicio();
  const PREGUNTAS_FAQ = useMemo(
    () => construirPreguntas({ diasRetiro, diasPrestamo, maxPrestamos, tarifa }),
    [diasRetiro, diasPrestamo, maxPrestamos, tarifa]
  );
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [itemsAbiertos, setItemsAbiertos] = useState<Record<string, boolean>>({
    "faq-1": true, // Primer item abierto por defecto
  });

  const toggleItem = (id: string) => {
    setItemsAbiertos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const preguntasFiltradas = useMemo(() => {
    return PREGUNTAS_FAQ.filter((item) => {
      const coincideCategoria =
        categoriaSeleccionada === "Todas" || item.categoria === categoriaSeleccionada;
      const busquedaMinus = busqueda.toLowerCase().trim();
      const coincideTexto =
        busquedaMinus === "" ||
        item.pregunta.toLowerCase().includes(busquedaMinus) ||
        item.respuesta.toLowerCase().includes(busquedaMinus) ||
        item.categoria.toLowerCase().includes(busquedaMinus);

      return coincideCategoria && coincideTexto;
    });
  }, [PREGUNTAS_FAQ, busqueda, categoriaSeleccionada]);

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto">
      {/* SECCIÓN DE BÚSQUEDA Y CATEGORÍAS */}
      <div className="w-full flex flex-col gap-6">
        {/* Input con Buscador Interactivo */}
        <div className="relative">
          <Icon icon={Search01Icon} className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por palabra clave (ej. renovar, reserva, sede)..."
            className="pl-11 pr-4 h-12 rounded-none bg-background border-border text-base sm:text-sm placeholder:text-muted-foreground"
          />
          {busqueda && (
            <Button variant="unstyled" size={null}
              onClick={() => setBusqueda("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Limpiar
            </Button>
          )}
        </div>

        {/* Píldoras de Filtro por Criterio */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:flex-wrap sm:justify-center sm:mx-0 sm:px-0 scrollbar-none">
          {CATEGORIAS.map((cat) => {
            const activa = categoriaSeleccionada === cat;
            return (
              <Button variant="unstyled" size={null}
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-none text-xs font-semibold transition-colors cursor-pointer border shrink-0",
                  activa
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                )}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      {/* LISTA DE ACCORDIONS */}
      <div className="w-full flex flex-col gap-3">
        {preguntasFiltradas.length > 0 ? (
          preguntasFiltradas.map((faq) => {
            const estaAbierta = Boolean(itemsAbiertos[faq.id]);
            return (
              <Card
                key={faq.id}
                className={cn(
                  "rounded-none border transition-colors overflow-hidden bg-card shadow-none",
                  estaAbierta ? "border-primary" : "border-border hover:border-foreground/30"
                )}
              >
                <Button variant="unstyled" size={null}
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={estaAbierta}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none focus-visible:bg-muted/40"
                >
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="text-[10px] font-semibold text-accent-foreground uppercase tracking-wider">
                      {faq.categoria}
                    </span>
                    <h3 className="font-serif text-lg font-normal text-foreground leading-snug">
                      {faq.pregunta}
                    </h3>
                  </div>
                  <div
                    className={cn(
                      "size-7 rounded-none border border-border bg-secondary flex items-center justify-center shrink-0 transition-transform duration-200 mt-0.5",
                      estaAbierta && "rotate-180 bg-primary text-primary-foreground border-primary"
                    )}
                  >
                    <Icon icon={ArrowDown01Icon} className="size-3.5" />
                  </div>
                </Button>

                {estaAbierta && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 text-sm text-muted-foreground leading-relaxed border-t border-border bg-secondary/30">
                    {faq.respuesta}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 px-4 rounded-none border border-dashed border-border bg-card flex flex-col items-center gap-3">
            <Icon icon={HelpCircleIcon} className="size-8 text-muted-foreground mx-auto" />
            <h3 className="font-serif text-xl font-normal text-foreground">
              No se encontraron preguntas
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Cambia la búsqueda o elige la categoría &quot;Todas&quot;.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBusqueda("");
                setCategoriaSeleccionada("Todas");
              }}
              className="rounded-none font-semibold"
            >
              Restablecer filtros
            </Button>
          </div>
        )}
      </div>

      {/* BLOQUE ASISTENCIA ADICIONAL */}
      <div className="w-full rounded-none bg-card p-6 sm:p-8 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <h3 className="font-serif text-xl font-normal text-foreground">
            ¿No encontraste la respuesta a tu inquietud?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visita cualquiera de nuestras sedes físicas o consulta los detalles de contacto en el pie de página.
          </p>
        </div>
        <Button size="sm" asChild className="rounded-none font-semibold px-6 shrink-0 h-10">
          <Link href="/sedes" className="flex items-center gap-2">
            <Icon icon={Building01Icon} className="size-4" /> Consultar sedes
          </Link>
        </Button>
      </div>
    </div>
  );
}

