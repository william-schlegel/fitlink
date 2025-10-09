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
      <h3>{title}</h3>
      <div className="flex flex-col">
        {message &&
          message
            .split("|")
            .map((p: string, idx: number) => <p key={idx}>{p}</p>)}
      </div>
    </Modal>
  );
}

export default Confirmation;
