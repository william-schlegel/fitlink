# Stripe Integration Plan

## Goals
- Show a Stripe payment form when the user chooses online payment.
- Start the Stripe workflow and finalize the subscription after a successful payment.

## Plan
1. Review the current subscription flow and offer selection to confirm required data (price, billing period, user/offer identifiers).
2. Add Stripe client/server plumbing: a server endpoint to create a PaymentIntent and a client component using Stripe Elements.
3. Update the subscribe UI to switch between offline and online flows, and wire success to the existing subscription mutation.
4. Document configuration steps (Stripe keys, webhook notes) and any env vars.
