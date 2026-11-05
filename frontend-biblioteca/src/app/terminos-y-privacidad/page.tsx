import Link from "next/link";
import { LayoutPublico } from "@/components/navegacion/layout-publico";
import { ContenedorPagina } from "@/components/ui/contenedor-pagina";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";

export const metadata = {
  title: "Términos y privacidad | LaBiblioteca",
  description: "Condiciones de uso del servicio de préstamo y política de tratamiento de datos personales de LaBiblioteca.",
};

const ACTUALIZADO = "septiembre de 2026";

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border border-border bg-card p-6 sm:p-8 flex flex-col gap-5">
      <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-[-0.02em] text-foreground">{titulo}</h2>
      <div className="flex flex-col gap-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

const Subtitulo = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-sans mt-2 text-xs font-semibold uppercase tracking-wider text-foreground">{children}</h3>
);

export default function PaginaTerminos() {
  return (
    <LayoutPublico>
      <ContenedorPagina maxAnchoClass="max-w-4xl">
        <EncabezadoPagina
          titulo="Términos y privacidad"
          subtitulo={`Última actualización: ${ACTUALIZADO}. Léelos antes de crear tu cuenta o solicitar un libro.`}
        />

        <nav aria-label="Contenido" className="mb-8 flex flex-wrap gap-3 text-xs font-semibold">
          <a href="#terminos" className="border border-border bg-card px-4 py-2 text-foreground hover:border-foreground">Términos de servicio</a>
          <a href="#privacidad" className="border border-border bg-card px-4 py-2 text-foreground hover:border-foreground">Política de privacidad</a>
        </nav>

        <div className="flex flex-col gap-8">
          <Seccion id="terminos" titulo="Términos de servicio">
            <Subtitulo>1. Quiénes pueden usar el servicio</Subtitulo>
            <p>
              Cualquier persona puede consultar el catálogo sin registrarse. Para solicitar libros, guardar favoritos o recibir avisos necesitas una cuenta con datos verdaderos y un correo al que tengas acceso. Eres responsable de mantener en reserva tu contraseña y de la actividad que se realice desde tu cuenta.
            </p>

            <Subtitulo>2. Solicitudes y préstamos</Subtitulo>
            <p>
              Solicitar un libro no garantiza el préstamo: el personal de la biblioteca revisa cada solicitud. Cuando se aprueba, el ejemplar queda reservado a tu nombre y debes retirarlo en la sede indicada dentro del plazo que fije la biblioteca; pasado ese plazo la reserva se cancela y el ejemplar vuelve a estar disponible.
            </p>
            <p>
              El número máximo de préstamos abiertos por lector y los días de préstamo los define la biblioteca y pueden cambiar. Puedes renovar un préstamo vigente, siempre que no haya vencido.
            </p>

            <Subtitulo>3. Devoluciones y multas</Subtitulo>
            <p>
              Debes devolver cada libro en la fecha de vencimiento. Si lo entregas tarde se genera una multa por cada día de retraso, según la tarifa vigente. Las multas pendientes se pagan en la sede y el personal las registra; la administración puede exonerarlas de forma justificada. La pérdida o el daño grave de un ejemplar puede implicar su reposición.
            </p>

            <Subtitulo>4. Uso adecuado</Subtitulo>
            <p>
              No puedes usar el servicio para suplantar a otra persona, intentar acceder a cuentas ajenas, sobrecargar el sistema o extraer información de forma automatizada. La biblioteca puede suspender o inactivar cuentas que incumplan estas condiciones o acumulen faltas al reglamento.
            </p>

            <Subtitulo>5. Cambios</Subtitulo>
            <p>
              Podemos actualizar estos términos. Cuando el cambio sea importante lo avisaremos en el sitio; seguir usando el servicio después de la actualización implica que lo aceptas.
            </p>
          </Seccion>

          <Seccion id="privacidad" titulo="Política de privacidad">
            <Subtitulo>1. Qué datos recopilamos</Subtitulo>
            <p>
              Al crear tu cuenta guardamos tu nombre y correo electrónico. En tu perfil puedes añadir documento de identidad y teléfono. Además registramos tus solicitudes, préstamos, multas, favoritos y notificaciones, y el personal de la biblioteca deja constancia de sus acciones en un registro de auditoría.
            </p>

            <Subtitulo>2. Para qué los usamos</Subtitulo>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>Identificarte y permitirte iniciar sesión.</li>
              <li>Gestionar tus solicitudes, préstamos, devoluciones y multas.</li>
              <li>Enviarte avisos sobre tus préstamos, vencimientos y multas.</li>
              <li>Mantener la seguridad del servicio y llevar el control interno de la biblioteca.</li>
            </ul>
            <p>No vendemos tus datos ni los usamos para publicidad.</p>

            <Subtitulo>3. Quién puede verlos</Subtitulo>
            <p>
              Tus datos solo los ve el personal autorizado de la biblioteca (bibliotecarios y administradores) para atender tus trámites. Usamos proveedores de infraestructura y autenticación para operar el sitio; ellos tratan la información únicamente para prestarnos ese servicio.
            </p>

            <Subtitulo>4. Cuánto tiempo los conservamos</Subtitulo>
            <p>
              Conservamos tu información mientras tu cuenta esté activa y el tiempo necesario para cumplir obligaciones de control del servicio (por ejemplo, multas pendientes). Puedes pedir que se elimine tu cuenta cuando no tengas obligaciones vigentes.
            </p>

            <Subtitulo>5. Tus derechos</Subtitulo>
            <p>
              Como titular de los datos puedes conocerlos, actualizarlos, corregirlos y solicitar su supresión, así como revocar tu autorización, conforme a la Ley 1581 de 2012 de Colombia. Puedes editar tu nombre, documento y teléfono desde{" "}
              <Link href="/mi-cuenta" className="font-semibold text-primary underline underline-offset-4">Mi cuenta</Link>; para lo demás, acércate a una sede o escríbenos desde la sección de{" "}
              <Link href="/sedes" className="font-semibold text-primary underline underline-offset-4">Sedes</Link>.
            </p>
          </Seccion>
        </div>
      </ContenedorPagina>
    </LayoutPublico>
  );
}
