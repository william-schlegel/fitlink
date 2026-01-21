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

import type {
  ButtonSize as ShadcnButtonSize,
  ButtonVariant as ShadcnButtonVariant,
} from "@/components/ui/shadcn/button";

type ButtonIconVariant = "default" | "outlines";
type ButtonIconSize = "default" | "sm" | "lg" | "xl" | "icon";

type Props = {
  title: string;
  iconComponent: ReactNode;
  variant?: ButtonIconVariant;
  size?: ButtonIconSize;
  fullButton?: boolean;
  onClick?: () => void;
  className?: string;
};

function ButtonIcon({
  title,
  iconComponent,
  variant = "default",
  size,
  fullButton,
  onClick,
  className,
}: Props) {
  const resolvedVariant: ShadcnButtonVariant =
    variant === "outlines" ? "outline" : "default";
  const resolvedSize: ShadcnButtonSize = fullButton
    ? size && size !== "icon"
      ? size
      : "default"
    : (size ?? "icon");

  if (fullButton) {
    return (
      <Button
        variant={resolvedVariant}
        size={resolvedSize}
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
            variant={resolvedVariant}
            size={resolvedSize}
            className={className}
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
