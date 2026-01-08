import { Trash } from "lucide-react";

import { Button } from "./shadcn";
import { cn } from "@/lib/utils";

type DeleteButtonProps = {
  size?: "sm" | "lg" | "xl";
  icon?: boolean;
  className?: string;
  onClick?: () => void;
  label?: string;
};

export default function DeleteButton({
  size = "sm",
  className,
  icon = true,
  onClick,
  label,
}: DeleteButtonProps) {
  return (
    <Button
      variant="destructive"
      size={icon ? "icon" : size}
      className={className}
      onClick={onClick}
    >
      <Trash
        className={cn(
          "size-4 stroke-destructive",
          size === "lg" && "size-6",
          size === "xl" && "size-8",
        )}
      />
      {label && (
        <span
          className={cn(
            "text-xs",
            size === "lg" && "text-lg",
            size === "xl" && "text-xl",
          )}
        >
          {label}
        </span>
      )}
    </Button>
  );
}
