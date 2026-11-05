import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface IconProps extends React.ComponentProps<typeof HugeiconsIcon> {
  className?: string;
}

export function Icon({ className, size, ...props }: IconProps) {
  return (
    <HugeiconsIcon
      className={cn("shrink-0", className)}
      size={size}
      color="currentColor"
      strokeWidth={1.75}
      {...props}
    />
  );
}

export { HugeiconsIcon };
