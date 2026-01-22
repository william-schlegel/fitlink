"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/shadcn";

type StripePaymentFormProps = {
  submitLabel: string;
  onSuccess: () => void;
};

export function StripePaymentForm({
  submitLabel,
  onSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message ?? "Payment failed.");
    } else if (
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "processing"
    ) {
      onSuccess();
    } else {
      toast.error("Payment was not completed.");
    }

    setIsSubmitting(false);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? "Processing..." : submitLabel}
      </Button>
    </form>
  );
}
