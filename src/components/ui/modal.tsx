"use client";

import { type ReactNode, useState, useEffect, useCallback } from "react";
import { type FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from "@/lib/utils";

import { type ButtonSize, type TIconButtonVariant } from "./buttonIcon";

export type TModalVariant =
  | TIconButtonVariant
  | "Primary"
  | "Secondary"
  | "Outlined-Primary"
  | "Outlined-Secondary";

type Props = {
  title: string | undefined;
  handleSubmit?: () => void;
  handleCancel?: () => void;
  children: ReactNode;
  submitButtonText?: string;
  cancelButtonText?: string;
  errors?: FieldErrors;
  buttonIcon?: ReactNode;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  variant?: TModalVariant;
  className?: string;
  buttonClassName?: string;
  buttonSize?: ButtonSize;
  closeModal?: boolean;
};

export default function Modal({
  title,
  handleSubmit,
  children,
  submitButtonText,
  cancelButtonText,
  handleCancel,
  errors,
  buttonIcon,
  onOpenModal,
  variant = "Primary",
  className = "",
  buttonClassName = "",
  buttonSize = "md",
  closeModal,
  onCloseModal,
}: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");

  const close = useCallback(() => {
    setOpen(false);
    if (typeof onCloseModal === "function") onCloseModal();
  }, [onCloseModal]);

  useEffect(() => {
    if (closeModal) close();
  }, [closeModal, close]);

  const handleClickSubmit = () => {
    if (typeof errors === "object" && Object.keys(errors).length > 0) return;
    close();
    if (typeof handleSubmit === "function") handleSubmit();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && typeof onOpenModal === "function") onOpenModal();
    if (!isOpen && typeof onCloseModal === "function") onCloseModal();
  };

  const primary =
    variant === "Primary" ||
    variant === "Outlined-Primary" ||
    variant === "Icon-Primary" ||
    variant === "Icon-Outlined-Primary" ||
    variant === "Icon-Only-Primary";
  const outlined =
    variant === "Outlined-Primary" ||
    variant === "Outlined-Secondary" ||
    variant === "Icon-Outlined-Primary" ||
    variant === "Icon-Outlined-Secondary";
  const iconOnly =
    variant === "Icon-Outlined-Primary" ||
    variant === "Icon-Outlined-Secondary" ||
    variant === "Icon-Primary" ||
    variant === "Icon-Secondary" ||
    variant === "Icon-Only-Primary" ||
    variant === "Icon-Only-Secondary";
  const noBorder =
    variant === "Icon-Only-Primary" || variant === "Icon-Only-Secondary";

  const getButtonVariant = () => {
    if (noBorder) return "ghost";
    if (outlined) return "outline";
    return primary ? "default" : "secondary";
  };

  const getButtonSize = () => {
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

  const TriggerButton = (
    <Button
      variant={getButtonVariant()}
      size={iconOnly ? "icon" : getButtonSize()}
      className={cn(
        buttonClassName,
        noBorder && (primary ? "text-primary" : "text-secondary"),
        "gap-2"
      )}
    >
      {buttonIcon}
      {!iconOnly && title}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        {iconOnly ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{title}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
        )}
      </TooltipProvider>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle className="pr-6">{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:gap-0">
          {cancelButtonText !== "" && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                if (typeof handleCancel === "function") handleCancel();
                close();
              }}
            >
              {cancelButtonText ?? t("cancel")}
            </Button>
          )}
          {typeof handleSubmit === "function" && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleClickSubmit();
              }}
            >
              {submitButtonText ?? t("save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function getButtonSize(size: ButtonSize) {
  switch (size) {
    case "lg":
      return "h-6 w-6";
    case "md":
      return "h-5 w-5";
    default:
      return "h-4 w-4";
  }
}
