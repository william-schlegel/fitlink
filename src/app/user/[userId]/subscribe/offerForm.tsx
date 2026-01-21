"use client";

import { inferProcedureOutput } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/shadcn";
import { ButtonGroup } from "@/components/ui/shadcn/button-group";
import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import { trpc } from "@/lib/trpc/client";
import { AppRouter } from "@/server/api/root";

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
        <ButtonGroup>
          {offer.monthly ? (
            <Button
              variant={monthly ? "default" : "outline"}
              onClick={() => setMonthly(true)}
            >
              {t("subscription.select-monthly", {
                price: formatMoney(offer.monthly),
              })}
            </Button>
          ) : null}
          {offer.yearly ? (
            <Button
              variant={monthly ? "outline" : "default"}
              onClick={() => setMonthly(false)}
            >
              {t("subscription.select-yearly", {
                price: formatMoney(offer.yearly),
                date: formatDateLocalized(null, { dateFormat: "month-year" }),
              })}
            </Button>
          ) : null}
        </ButtonGroup>
        <ButtonGroup>
          <Button
            variant={online ? "default" : "outline"}
            onClick={() => setOnline(true)}
          >
            {t("subscription.payment-online")}
          </Button>
          <Button
            variant={online ? "outline" : "default"}
            onClick={() => setOnline(false)}
          >
            {t("subscription.payment-club")}
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSubscribe}>{t("subscription.subscribe")}</Button>
        <Button variant="outline" onClick={cancel}>
          {t("subscription.cancel")}
        </Button>
      </div>
    </>
  );
}
