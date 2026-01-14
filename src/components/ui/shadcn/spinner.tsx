import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({
  className,
  size = "md",
  ...props
}: React.ComponentProps<"svg"> & { size?: "sm" | "md" | "lg" }) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin",
        size === "sm" && "size-4",
        size === "md" && "size-6",
        size === "lg" && "size-8",
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
