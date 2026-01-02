"use client";

import { useTranslations } from "next-intl";
import { type ReactNode } from "react";

import Modal, { type TModalVariant } from "./modal";
import { type ButtonSize } from "./buttonIcon";

type Props = {
  title: string;
  message: string;
  textConfirmation?: string;
  textCancel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  buttonIcon?: ReactNode;
  variant?: TModalVariant;
  buttonSize?: ButtonSize;
};

function Confirmation({
  title,
  message,
  textConfirmation,
  textCancel,
  onConfirm,
  onCancel,
  buttonIcon,
  variant = "Secondary",
  buttonSize = "md",
}: Props) {
  const t = useTranslations("common");
  return (
    <Modal
      title={title}
      handleSubmit={onConfirm}
      handleCancel={onCancel}
      submitButtonText={textConfirmation ?? t("continue")}
      cancelButtonText={textCancel}
      buttonIcon={buttonIcon}
      variant={variant}
      buttonSize={buttonSize}
    >
      <div className="py-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="flex flex-col gap-2">
          {message &&
            message
              .split("|")
              .map((p: string, idx: number) => (
                <p key={idx} className="text-base-content/80">{p}</p>
              ))}
        </div>
      </div>
    </Modal>
  );
}

export default Confirmation;
