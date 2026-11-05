import React from "react";
import { Instrument_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ProveedorAutenticacion } from "@/context/contexto-autenticacion";
import { ProveedorFavoritos } from "@/context/contexto-favoritos";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const fontInstrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
});

const fontPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "LaBiblioteca | Consulta y préstamo de libros",
  description: "Plataforma de consulta de catálogo de libros, préstamos y reserva de ejemplares físicos en red de bibliotecas",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#FAF7F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn(fontPlexSans.variable, fontInstrumentSerif.variable, fontPlexMono.variable, "font-sans")}>
      <body className="bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground min-h-screen flex flex-col font-sans">
        <ProveedorAutenticacion>
          <ProveedorFavoritos>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ProveedorFavoritos>
        </ProveedorAutenticacion>
      </body>
    </html>
  );
}
