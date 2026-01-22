"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { inferProcedureOutput } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { StripePaymentForm } from "@/components/stripe/StripePaymentForm";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn";
import { ButtonGroup } from "@/components/ui/shadcn/button-group";
import { env } from "@/env";
import useTheme from "@/hooks/useTheme";
import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import { trpc } from "@/lib/trpc/client";
import { AppRouter } from "@/server/api/root";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const router = useRouter();
  const [browserTheme] = useTheme();

  const updateUser = trpc.users.addSubscriptionWithValidation.useMutation({
    onSuccess() {
      toast.success(t("subscription.subscription-added"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!offer) return;
    if (offer.monthly && !offer.yearly) {
      startTransition(() => {
        setMonthly(true);
      });
    } else if (offer.yearly && !offer.monthly) {
      startTransition(() => {
        setMonthly(false);
      });
    }
  }, [offer, setMonthly]);

  const selectedPrice = useMemo(() => {
    if (monthly && offer?.monthly) return offer.monthly;
    if (!monthly && offer?.yearly) return offer.yearly;
    return offer?.monthly ?? offer?.yearly ?? 0;
  }, [monthly, offer?.monthly, offer?.yearly]);

  const totalAmount = useMemo(
    () => selectedPrice + (offer?.inscriptionFee ?? 0),
    [selectedPrice, offer?.inscriptionFee],
  );

  useEffect(() => {
    if (!online) {
      startTransition(() => {
        setClientSecret(null);
      });
      return;
    }
    if (!offer?.id || totalAmount <= 0) return;

    const controller = new AbortController();
    startTransition(() => {
      setClientSecret(null);
      setIsCreatingIntent(true);
    });
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptionId: offer.id,
        monthly,
        userId,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to start payment.");
        }
        setClientSecret(data.clientSecret);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        const message =
          error instanceof Error ? error.message : "Unable to start payment.";
        toast.error(message);
      })
      .finally(() => setIsCreatingIntent(false));

    return () => controller.abort();
  }, [monthly, online, offer?.id, totalAmount, userId]);

  function handleSubscribe() {
    if (!userId || !offer?.id) return;
    if (online) return;
    updateUser.mutate({
      userId,
      subscriptionId: offer.id,
      monthly,
      online: false,
    });
    cancel();
  }

  function handlePaymentSuccess() {
    if (!userId || !offer?.id) return;
    updateUser.mutate({
      userId,
      subscriptionId: offer.id,
      monthly,
      online: true,
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
      {online ? (
        <Card className="p-4 max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{t("subscription.payment-form")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isCreatingIntent ? (
              <p>{t("subscription.loading-payment-form")}</p>
            ) : null}
            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: browserTheme === "dark" ? "night" : "stripe",
                  },
                }}
              >
                <StripePaymentForm
                  submitLabel={t("subscription.subscribe")}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            ) : isCreatingIntent ? null : (
              <p className="text-sm text-muted-foreground">
                {t("subscription.unable-to-start-payment")}
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
      {!online ? (
        <div className="flex gap-2">
          <Button onClick={handleSubscribe}>
            {t("subscription.subscribe")}
          </Button>
          <Button variant="outline" onClick={cancel}>
            {t("subscription.cancel")}
          </Button>
        </div>
      ) : null}
    </>
  );
}
