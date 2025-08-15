"use client";

import { formatMoney } from "@/lib/formatNumber";
import { useTranslations } from "next-intl";

type PlanDetailsProps = {
  monthlyPayment: boolean;
  name: string | null;
  monthly: number | null;
  yearly: number | null;
  free: boolean | null;
};

export default function PlanDetails({
  monthlyPayment,
  name,
  monthly,
  yearly,
  free,
}: PlanDetailsProps) {
  const t = useTranslations("auth");
  if (!name) return null;
  return (
    <>
      {name} (
      {free
        ? t("account.free")
        : monthlyPayment
        ? `${formatMoney(monthly)} ${t("account.per-month")}`
        : `${formatMoney(yearly)} ${t("account.per-year")}`}
      )
    </>
  );
}
