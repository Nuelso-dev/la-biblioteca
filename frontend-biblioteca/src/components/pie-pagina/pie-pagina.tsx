"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight01Icon,
  Book02Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";

const enlacesExplorar = [
  { label: "Catálogo", href: "/libros" },
  { label: "Autores", href: "/autores" },
  { label: "Sedes", href: "/sedes" },
];

const enlacesAyuda = [
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
];

export function PiePagina() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.5fr_0.7fr_0.9fr] lg:px-12 lg:py-16">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
            <span className="flex size-10 items-center justify-center rounded-none bg-primary-foreground text-primary">
              <Icon icon={Book02Icon} className="size-5" />
            </span>
            <span className="font-serif text-2xl font-normal tracking-[-0.02em]">LaBiblioteca</span>
          </Link>
          <p className="mt-5 text-sm leading-6 text-primary-foreground/70">
            Un lugar para encontrar historias, reservar ejemplares y mantenerte cerca de tu red de bibliotecas.
          </p>
        </div>

        <FooterColumn title="Explorar" links={enlacesExplorar} />
        <div>
          <FooterColumn title="Orientación" links={enlacesAyuda} />
          <a href="mailto:contacto@inemjose.edu.co" className="mt-7 flex items-center gap-2 text-xs text-primary-foreground/75 transition-colors hover:text-primary-foreground">
            <Icon icon={Mail01Icon} className="size-4" />
            contacto@inemjose.edu.co
          </a>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto max-w-7xl px-5 py-5 pb-safe text-xs text-primary-foreground/55 sm:px-8 lg:px-12">
          <span>© 2026 LaBiblioteca. Consulta y préstamo de libros.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/55">{title}</h2>
      <nav aria-label={title} className="mt-4 flex flex-col items-start gap-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm py-1 text-primary-foreground/80 transition-colors hover:text-primary-foreground">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
