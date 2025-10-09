"use client";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { formatMoney } from "@/lib/formatNumber";
import createLink from "@/lib/createLink";
import { Pricing } from "./page";

export default function PricingCard({
  pricingId,
  pricing,
}: {
  pricingId: string;
  pricing: Pricing;
}) {
  const router = useRouter();
  return (
    <button
      className={twMerge(
        "flex w-full items-center justify-between text-center",
        pricingId === pricing.id && "active",
      )}
      onClick={() => router.push(createLink({ pricingId: pricing.id }))}
    >
      <span>
        {pricing.title}&nbsp;
        <span className="text-xs">
          {pricing.free ? null : `(${formatMoney(pricing.monthly)})`}
        </span>
      </span>
      <span className="space-x-2">
        {pricing.highlighted ? (
          <i className="bx bxs-star bx-xs text-accent" />
        ) : null}
        {pricing.deleted ? (
          <i className="bx bx-trash bx-sm text-red-600" />
        ) : null}
      </span>
    </button>
  );
}
