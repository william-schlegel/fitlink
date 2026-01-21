"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { type FieldErrors } from "react-hook-form";

import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogSize,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from "@/lib/utils";

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
  variant?: ButtonVariant;
  className?: string;
  buttonClassName?: string;
  buttonSize?: ButtonSize;
  closeModal?: boolean;
  size?: DialogSize;
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
  variant = "default",
  className = "",
  buttonClassName = "",
  buttonSize = "default",
  closeModal,
  onCloseModal,
  size = "lg",
}: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");

  const close = useCallback(() => {
    setOpen(false);
    if (typeof onCloseModal === "function") onCloseModal();
  }, [onCloseModal]);

  useEffect(() => {
    if (closeModal) {
      Promise.resolve().then(() => close());
    }
  }, [closeModal, close]);

  const handleClickSubmit = () => {
    if (typeof errors === "object" && Object.keys(errors).length > 0) return;
    close();
    handleSubmit?.();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) onOpenModal?.();
    if (!isOpen) onCloseModal?.();
  };

  const iconOnly = buttonSize === "icon";

  const TriggerButton = (
    <Button
      variant={variant}
      size={buttonSize}
      className={cn(buttonClassName, "gap-2")}
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
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <DialogContent
        className={cn("max-h-[90vh] overflow-y-auto", className)}
        aria-describedby={title}
        size={size}
      >
        {children}
        {(cancelButtonText !== "" || typeof handleSubmit === "function") && (
          <DialogFooter className="space-x-2">
            {cancelButtonText !== "" && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  handleCancel?.();
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
        )}
      </DialogContent>
    </Dialog>
  );
}

export function getButtonSize(size: ButtonSize) {
  switch (size) {
    case "lg":
      return "h-6 w-6";
    case "xl":
      return "h-7 w-7";
    case "default":
      return "h-5 w-5";
    case "icon":
      return "h-4 w-4";
    default:
      return "h-4 w-4";
  }
}
