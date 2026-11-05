import * as React from "react";

import { cn } from "@/lib/utils";

/** Select nativo con el mismo estilo de los inputs del panel (accesible y sin dependencias). */
function SelectNativo({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-nativo"
      className={cn(
        "h-10 w-full rounded-none border border-border bg-background px-3 text-xs text-foreground outline-none transition-[color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { SelectNativo };
