import React from "react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Panel de administración | LaBiblioteca",
  description: "Panel de control y gestión de libros, préstamos, autores y sedes de la biblioteca",
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <SidebarProvider
        defaultOpen={true}
        style={
          {
            "--sidebar-width": "14.5rem",
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
      >
        <div className="flex min-h-screen w-full bg-background text-foreground">
          {/* Sidebar Editorial de Administración */}
          <AppSidebar />

          {/* SidebarInset Contenedor Principal */}
          <SidebarInset className="flex flex-col flex-1 min-w-0">
            <SiteHeader />
            <main className="admin-touch @container p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
