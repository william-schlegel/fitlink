"use client";

import { type ReactNode } from "react";

import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from "@/lib/utils";

export type TIconButtonVariant =
  | "Icon-Only-Primary"
  | "Icon-Only-Secondary"
  | "Icon-Primary"
  | "Icon-Secondary"
  | "Icon-Outlined-Primary"
  | "Icon-Outlined-Secondary";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

type Props = {
  title: string;
  iconComponent: ReactNode;
  buttonVariant?: TIconButtonVariant;
  buttonSize?: ButtonSize;
  fullButton?: boolean;
  onClick?: () => void;
  className?: string;
};

function ButtonIcon({
  title,
  iconComponent,
  buttonVariant = "Icon-Outlined-Primary",
  buttonSize = "md",
  fullButton,
  onClick,
  className,
}: Props) {
  const noBorder =
    buttonVariant === "Icon-Only-Primary" ||
    buttonVariant === "Icon-Only-Secondary";
  const primary =
    buttonVariant === "Icon-Only-Primary" ||
    buttonVariant === "Icon-Outlined-Primary" ||
    buttonVariant === "Icon-Primary";
  const outlined =
    buttonVariant === "Icon-Outlined-Primary" ||
    buttonVariant === "Icon-Outlined-Secondary";

  const getButtonVariant = () => {
    if (noBorder) return "ghost";
    if (outlined) return "outline";
    return primary ? "default" : "secondary";
  };

  const getSize = () => {
    switch (buttonSize) {
      case "lg":
        return "lg";
      case "sm":
        return "sm";
      case "xs":
        return "sm";
      default:
        return "default";
    }
  };

  if (fullButton) {
    return (
      <Button
        variant={getButtonVariant()}
        size={getSize()}
        className={cn("gap-2", className)}
        onClick={onClick}
      >
        {iconComponent}
        {title}
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={getButtonVariant()}
            size="icon"
            className={cn(
              noBorder && (primary ? "text-primary" : "text-secondary"),
              className
            )}
            onClick={onClick}
          >
            {iconComponent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ButtonIcon;
