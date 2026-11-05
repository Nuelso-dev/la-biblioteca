"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckmarkCircle02Icon,
  Bookmark02Icon,
  Clock01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  HelpCircleIcon,
  Book02Icon,
  UserCheck01Icon,
  Notification01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";
import { plural, useReglasServicio } from "@/hooks/use-reglas-servicio";

/**
 * Guía del servicio. Los plazos, el máximo de préstamos y la tarifa de multa se leen de la configuración
 * de la biblioteca, así esta página siempre coincide con lo que realmente se aplica.
 */
export function ContenidoComoFunciona() {
  const { reglas, diasRetiro, diasPrestamo, maxPrestamos, tarifa } = useReglasServicio();

  const pasos = [
    {
      numero: "01",
      titulo: "Explora el catálogo",
      subtitulo: "Búsqueda y filtros",
      descripcion: "Busca por título, autor o ISBN y filtra por categoría, editorial, autor o sede. Activa “Solo libros disponibles” para ver únicamente lo que puedes pedir hoy.",
      badgeText: "Sin cuenta",
    },
    {
      numero: "02",
      titulo: "Elige un ejemplar",
      subtitulo: "Disponibilidad por sede",
      descripcion: "En la ficha del libro ves cada copia física, en qué sede está y si está disponible, reservada o prestada. Guarda en favoritos lo que quieras leer después.",
      badgeText: "Tiempo real",
    },
    {
      numero: "03",
      titulo: "Solicita el préstamo",
      subtitulo: "Revisión del personal",
      descripcion: "Inicia sesión, elige el ejemplar y pulsa “Solicitar préstamo”. El personal de la biblioteca revisa tu solicitud y te avisa por notificación si se aprueba o se rechaza.",
      badgeText: "Con cuenta",
    },
    {
      numero: "04",
      titulo: "Retira en la sede",
      subtitulo: "Ejemplar reservado para ti",
      descripcion: `Al aprobarse, el ejemplar queda reservado a tu nombre y nadie más puede llevárselo. Tienes ${diasRetiro} para pasar por la sede; el préstamo se registra al entregártelo. Pasado ese plazo, la reserva se cancela.`,
      badgeText: reglas ? `Retiro en ${plural(reglas.diasRetiro, "día", "días")}` : "Retiro en sede",
    },
    {
      numero: "05",
      titulo: "Lee, renueva y devuelve",
      subtitulo: "Desde Mis préstamos",
      descripcion: `Tienes ${diasPrestamo} de préstamo. Puedes renovarlo 7 días más desde tu cuenta mientras no haya vencido. Al devolverlo en la sede, el préstamo se cierra.`,
      badgeText: reglas ? `${plural(reglas.diasPrestamo, "día", "días")} de préstamo` : "Préstamo",
    },
  ];

  const reglasServicio = [
    {
      titulo: "Límite de préstamos",
      descripcion: `Puedes tener hasta ${maxPrestamos} al mismo tiempo. Al devolver uno, vuelves a tener cupo.`,
      icono: Book02Icon,
    },
    {
      titulo: "Plazo y renovaciones",
      descripcion: `Cada préstamo dura ${diasPrestamo}. La renovación suma 7 días y solo se puede hacer antes del vencimiento.`,
      icono: Clock01Icon,
    },
    {
      titulo: "Multas por retraso",
      descripcion: `Si devuelves después de la fecha de vencimiento se genera una multa de ${tarifa} por cada día de retraso. Se paga en la sede.`,
      icono: AlertCircleIcon,
    },
    {
      titulo: "Avisos en tu cuenta",
      descripcion: "Te notificamos cuando tu solicitud se aprueba o se rechaza, cuando registran tu préstamo o devolución y si un préstamo vence.",
      icono: Notification01Icon,
    },
  ];

  return (
    <>
      {/* HERO PRINCIPAL */}
      <section className="border-b border-border bg-background py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-5 text-center flex flex-col items-center gap-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">
            <span className="h-px w-6 bg-accent-foreground" />
            Guía de uso del servicio
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-[-0.02em] text-foreground leading-[1.05] text-balance">
            ¿Cómo pedir prestado un libro?
          </h1>

          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            Del catálogo a tus manos en 5 pasos: encuentra el libro, solicítalo, retíralo en la sede y devuélvelo a tiempo.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="h-11 px-6 font-semibold rounded-none">
              <Link href="/libros" className="flex items-center gap-2">
                Buscar libros en catálogo <Icon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-6 font-semibold rounded-none border-border">
              <Link href="/sedes">Ver sedes y cómo llegar</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12 flex flex-col gap-16">
        {/* PASOS */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2 border-b border-border pb-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">Índice 01 · Paso a paso</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground tracking-[-0.02em]">Del catálogo a tus manos</h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 border border-border divide-y md:divide-y-0 md:divide-x divide-border">
            {pasos.map((paso) => (
              <li key={paso.numero} className="bg-card p-6 flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-2 border-b border-border pb-3">
                  <span className="font-serif text-3xl font-normal text-primary">{paso.numero}</span>
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase text-right">{paso.badgeText}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-serif text-xl font-normal text-foreground">{paso.titulo}</h3>
                  <span className="text-xs font-medium text-accent-foreground">{paso.subtitulo}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{paso.descripcion}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* REGLAS */}
        <section className="border border-border bg-card p-6 sm:p-10 flex flex-col gap-8">
          <div className="flex flex-col gap-2 border-b border-border pb-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">Índice 02 · Normas del servicio</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-[-0.02em]">Plazos, límites y multas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reglasServicio.map((item) => (
              <div key={item.titulo} className="p-5 border border-border bg-secondary flex flex-col gap-3">
                <div className="size-8 rounded-none bg-background text-primary flex items-center justify-center border border-border">
                  <Icon icon={item.icono} className="size-4" />
                </div>
                <h3 className="font-serif text-base font-normal text-foreground">{item.titulo}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        {/* REQUISITOS */}
        <section className="grid grid-cols-1 gap-8 items-stretch">
          <div className="border border-border bg-card p-6 sm:p-10 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">Requisitos</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-[-0.02em]">¿Qué necesitas para tu primer préstamo?</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Consultar el catálogo es libre. Para pedir un libro necesitas una cuenta creada por la biblioteca, y para retirarlo, presentarte en la sede.
              </p>
            </div>

            <ul className="flex flex-col gap-3 pt-2 text-xs sm:text-sm text-foreground">
              <li className="flex items-center gap-2.5">
                <Icon icon={UserCheck01Icon} className="size-4 text-primary shrink-0" />
                <span>Una cuenta de lector activa (las cuentas suspendidas no pueden solicitar).</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon icon={CheckmarkCircle02Icon} className="size-4 text-primary shrink-0" />
                <span>Tu documento de identidad o carné al retirar el libro.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon icon={Location01Icon} className="size-4 text-primary shrink-0" />
                <span>
                  Saber a qué sede ir: mira{" "}
                  <Link href="/sedes" className="font-semibold text-primary underline underline-offset-4">el mapa de sedes</Link>.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border border-border bg-card p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h2 className="font-serif text-2xl font-normal text-foreground">¿Tienes dudas adicionales sobre el proceso?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Consulta las preguntas frecuentes o los términos del servicio.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 shrink-0">
            <Button size="default" variant="outline" asChild className="rounded-none h-10 px-6 font-semibold">
              <Link href="/preguntas-frecuentes" className="flex items-center gap-2"><Icon icon={HelpCircleIcon} className="size-4" /> Preguntas frecuentes</Link>
            </Button>
            <Button size="default" variant="outline" asChild className="rounded-none h-10 px-6 font-semibold">
              <Link href="/terminos-y-privacidad">Términos del servicio</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
