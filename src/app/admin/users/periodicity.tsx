"use client";

import { trpc } from "@/lib/trpc/client";
import { useTranslations } from "next-intl";

export default function Periodicity({
  userId,
  monthlyPayment,
}: {
  userId: string;
  monthlyPayment: boolean | undefined;
}) {
  const periodicityMutation = trpc.users.updatePaymentPeriod.useMutation({
    onSuccess() {
      utils.users.getUserFullById.invalidate(userId);
    },
  });
  const utils = trpc.useUtils();

  const t = useTranslations("admin.user");
  return (
    <span className="flex flex-grow items-center justify-between rounded border border-primary px-2 text-primary">
      <span>{t("modify-period")}</span>
      <label className="swap">
        <input
          type="checkbox"
          checked={monthlyPayment ?? false}
          onChange={(e) =>
            periodicityMutation.mutate({
              userId,
              monthlyPayment: e.currentTarget.checked,
            })
          }
          className="bg-primary"
        />
        <div className="swap-on px-4 text-primary-content">
          {t("per-month")}
        </div>
        <div className="swap-off px-4 text-primary-content">
          {t("per-year")}
        </div>
      </label>
    </span>
  );
}
