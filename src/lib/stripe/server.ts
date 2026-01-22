import Stripe from "stripe";

import { env } from "@/env";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
  });

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}
