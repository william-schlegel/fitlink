"use client";

import { useTranslations } from "next-intl";

type Props = { label: string; limited?: boolean };
function LockedButton({ label, limited }: Props) {
  const t = useTranslations("common");

  return (
    <span
      className="btn tooltip tooltip-bottom tooltip-error no-animation flex cursor-default items-center gap-2 bg-neutral/20 text-base-content/20  hover:bg-neutral/20 hover:text-base-content/20"
      data-tip={t(
        limited ? "navigation.limited-plan" : "navigation.insufficient-plan",
      )}
    >
      <i className="bx bx-lock bx-xs" />
      {label}
    </span>
  );
}
export default LockedButton;
