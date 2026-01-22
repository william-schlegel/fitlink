import { NextResponse } from "next/server";
import { z } from "zod";

import { getSubscriptionById } from "@/db/dal";
import { stripe } from "@/lib/stripe/server";

const requestSchema = z.object({
  subscriptionId: z.string(),
  monthly: z.boolean(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const subscription = await getSubscriptionById(body.subscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 },
      );
    }

    const baseAmount = body.monthly
      ? subscription.monthly ?? 0
      : subscription.yearly ?? 0;
    const inscriptionFee = subscription.inscriptionFee ?? 0;
    const totalAmount = baseAmount + inscriptionFee;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid subscription amount." },
        { status: 400 },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        subscriptionId: body.subscriptionId,
        billingPeriod: body.monthly ? "monthly" : "yearly",
        userId: body.userId ?? "",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    const message =
      error instanceof z.ZodError ? "Invalid request payload." : "Server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
