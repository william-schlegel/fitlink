"use client";

import { inferProcedureOutput } from "@trpc/server";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import { AppRouter } from "@/server/api/root";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

export default function OfferForm({
  offer,
  userId,
}: {
  offer: inferProcedureOutput<
    AppRouter["subscriptions"]["getSubscriptionById"]
  >;
  userId: string;
}) {
  const t = useTranslations("club");
  const [monthly, setMonthly] = useState(false);
  const [online, setOnline] = useState(false);
  const router = useRouter();

  const updateUser = trpc.users.addSubscriptionWithValidation.useMutation({
    onSuccess() {
      toast.success(t("subscription.subscription-added"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  function handleSubscribe() {
    if (!userId || !offer?.id) return;
    updateUser.mutate({
      userId,
      subscriptionId: offer.id,
      monthly,
      online,
    });
    cancel();
  }

  function cancel() {
    router.back();
  }

  if (!offer) return null;

  return (
    <>
      <div className="space-y-2 rounded border border-primary p-4">
        <h2>{t("subscription.payment")}</h2>
        {offer.inscriptionFee ? (
          <label className="w-fit gap-4">
            {t("subscription.inscription-fee")}
            <span>{formatMoney(offer.inscriptionFee)}</span>
          </label>
        ) : null}
        <div className="space-x-4">
          {offer.monthly ? (
            <button
              type="button"
              className={`btn btn-secondary ${monthly ? "" : "btn-outline"}`}
              onClick={() => setMonthly(true)}
            >
              {t("subscription.select-monthly", {
                price: formatMoney(offer.monthly),
              })}
            </button>
          ) : null}
          {offer.yearly ? (
            <button
              type="button"
              className={`btn btn-secondary ${monthly ? "btn-outline" : ""}`}
              onClick={() => setMonthly(false)}
            >
              {t("subscription.select-yearly", {
                price: formatMoney(offer.yearly),
                date: formatDateLocalized(null, { dateFormat: "month-year" }),
              })}
            </button>
          ) : null}
        </div>
        <div className="space-x-4">
          <button
            type="button"
            className={`btn btn-secondary ${online ? "" : "btn-outline"}`}
            onClick={() => setOnline(true)}
          >
            {t("subscription.payment-online")}
          </button>
          <button
            type="button"
            className={`btn btn-secondary ${online ? "btn-outline" : ""}`}
            onClick={() => setOnline(false)}
          >
            {t("subscription.payment-club")}
          </button>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubscribe}
        >
          {t("subscription.subscribe")}
        </button>
        <button
          type="button"
          className="btn-outline btn btn-secondary"
          onClick={cancel}
        >
          {t("subscription.cancel")}
        </button>
      </div>
    </>
  );
}
