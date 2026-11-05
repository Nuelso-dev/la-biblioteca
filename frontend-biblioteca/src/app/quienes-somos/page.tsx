import React from "react";
import Link from "next/link";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Book02Icon,
  Target01Icon,
  ViewIcon,
  ShieldCheck,
  UserGroupIcon,
  SparklesIcon,
  Building01Icon,
  Award01Icon,
  ArrowRight01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";

export const metadata = {
  title: "Quiénes somos | LaBiblioteca",
  description:
    "Misión, visión, valores y cifras de la red de bibliotecas.",
};

export default function PaginaQuienesSomos() {
  const valores = [
    {
      titulo: "Acceso universal",
      descripcion:
        "Cualquier persona puede consultar el catálogo y solicitar libros sin costo.",
      icono: UserGroupIcon,
    },
    {
      titulo: "Transparencia tecnológica",
      descripcion:
        "Mostramos en tiempo real qué ejemplares están disponibles y en qué sede.",
      icono: ShieldCheck,
    },
    {
      titulo: "Preservación patrimonial",
      descripcion:
        "Cuidamos y catalogamos colecciones académicas, literarias e históricas para conservarlas.",
      icono: Award01Icon,
    },
    {
      titulo: "Comunidad e inclusión",
      descripcion:
        "Las bibliotecas son espacios de encuentro, aprendizaje y fomento de la lectura.",
      icono: UserGroupIcon,
    },
  ];

  const estadisticas = [
    { cifra: "+50,000", etiqueta: "Ejemplares catalogados", icono: Book02Icon },
    { cifra: "4", etiqueta: "Sedes interconectadas", icono: Building01Icon },
    { cifra: "+12,000", etiqueta: "Lectores activos", icono: UserGroupIcon },
    { cifra: "98.5%", etiqueta: "Solicitudes atendidas", icono: SparklesIcon },
  ];

  return (
    <LayoutPublico>
      {/* SECCIÓN HERO PRINCIPAL */}
      <section className="border-b border-border bg-background py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-5 text-center flex flex-col items-center gap-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">
            <span className="h-px w-6 bg-accent-foreground" />
            Nuestra Institución
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-[-0.02em] text-foreground leading-[1.05] text-balance">
            Promoviendo la lectura y el acceso abierto al conocimiento
          </h1>

          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            Somos una red unificada de bibliotecas comprometida con la gestión eficiente de colecciones físicas, brindando herramientas digitales para que consultar y reservar libros sea simple, ágil y transparente.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="h-11 px-6 font-semibold rounded-none">
              <Link href="/libros" className="flex items-center gap-2">
                Explorar Catálogo <Icon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-6 font-semibold rounded-none border-border">
              <Link href="/como-funciona">Ver cómo funciona</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL EN CONTENEDOR */}
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12 flex flex-col gap-16">
        {/* SECCIÓN MISIÓN Y VISIÓN */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Misión */}
          <Card className="rounded-none border border-border bg-card shadow-none overflow-hidden">
            <CardContent className="p-6 sm:p-10 flex flex-col gap-4">
              <div className="size-10 rounded-none bg-secondary text-primary flex items-center justify-center border border-border">
                <Icon icon={Target01Icon} className="size-5" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-[-0.02em]">
                Nuestra Misión
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Garantizar a toda la comunidad estudiantil, docente y ciudadanía en general la libre consulta, reserva oportuna y conservación responsable de nuestro acervo bibliográfico. Integramos tecnología en tiempo real para conectar a cada lector con la sede física que resguarda el libro deseado.
              </p>
            </CardContent>
          </Card>

          {/* Card Visión */}
          <Card className="rounded-none border border-border bg-card shadow-none overflow-hidden">
            <CardContent className="p-6 sm:p-10 flex flex-col gap-4">
              <div className="size-10 rounded-none bg-secondary text-primary flex items-center justify-center border border-border">
                <Icon icon={ViewIcon} className="size-5" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-[-0.02em]">
                Nuestra Visión
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Consolidarnos como la red bibliotecaria modelo en integración digital y excelencia operativa, reconocida por eliminar barreras de acceso al libro físico, promover espacios de estudio inclusivos y preservar el patrimonio cultural e intelectual de la región.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* SECCIÓN ESTADÍSTICAS */}
        <section className="border border-border bg-card p-6 sm:p-10 flex flex-col gap-8">
          <div className="flex flex-col gap-2 border-b border-border pb-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">
              Índice 01 · Alcance
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-[-0.02em]">
              Nuestro Impacto en Cifras
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
            {estadisticas.map((stat, idx) => (
              <div
                key={idx}
                className="bg-card p-6 text-center flex flex-col items-center justify-center gap-2"
              >
                <div className="size-10 rounded-none bg-secondary text-primary flex items-center justify-center mb-1 border border-border">
                  <Icon icon={stat.icono} className="size-5" />
                </div>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
                  {stat.cifra}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {stat.etiqueta}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECCIÓN VALORES FUNDAMENTALES */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 border-b border-border pb-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-accent-foreground uppercase">
              Índice 02 · Principios
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-[-0.02em]">
              Valores que Guían Nuestra Red
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((val, idx) => (
              <Card key={idx} className="rounded-none border border-border bg-card p-6 shadow-none flex flex-col gap-3">
                <div className="size-10 rounded-none bg-secondary text-primary flex items-center justify-center border border-border">
                  <Icon icon={val.icono} className="size-5" />
                </div>
                <h3 className="font-serif text-lg font-normal text-foreground">
                  {val.titulo}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {val.descripcion}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* BANNER CTA FINAL */}
        <section className="rounded-none bg-card p-8 sm:p-12 border border-border shadow-none relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-[-0.02em]">
              ¿Listo para consultar tu próximo libro?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Explora nuestro catálogo en línea, encuentra la sede más cercana a ti y reserva ejemplares físicos en cuestión de segundos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <Button size="lg" asChild className="rounded-none font-semibold px-6 h-11 w-full sm:w-auto text-xs uppercase tracking-wider">
              <Link href="/libros">Ver catálogo completo</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-none font-semibold px-6 border-border h-11 w-full sm:w-auto text-xs uppercase tracking-wider"
            >
              <Link href="/preguntas-frecuentes" className="flex items-center justify-center gap-1.5">
                <Icon icon={HelpCircleIcon} className="size-4" /> Preguntas Frecuentes
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </LayoutPublico>
  );
}

