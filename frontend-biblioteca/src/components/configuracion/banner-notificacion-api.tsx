import { CheckmarkCircle02Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/hugeicon";

interface BannerNotificacionApiProps {
  notificacion: { tipo: "exito" | "error"; texto: string } | null;
}

export function BannerNotificacionApi({ notificacion }: BannerNotificacionApiProps) {
  if (!notificacion) return null;

  return (
    <div
      className={`p-4 rounded-2xl border flex items-center gap-3 font-medium text-xs shadow-2xs transition-all ${
        notificacion.tipo === "exito"
          ? "bg-accent border-primary/30 text-primary"
          : "bg-destructive/10 border-destructive/30 text-destructive"
      }`}
      role="alert"
    >
      {notificacion.tipo === "exito" ? (
        <Icon icon={CheckmarkCircle02Icon} className="size-4 shrink-0" />
      ) : (
        <Icon icon={AlertCircleIcon} className="size-4 shrink-0" />
      )}
      <span>{notificacion.texto}</span>
    </div>
  );
}
