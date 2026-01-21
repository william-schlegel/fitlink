import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { featureEnum, RoleEnum, roleEnum } from "@/db/schema/enums";
import {
  pricing,
  pricingFeature,
  pricingOption,
} from "@/db/schema/subscription";

// ==================== PRICING QUERIES ====================

export async function getPricingById(id: string) {
  return db.query.pricing.findFirst({
    where: eq(pricing.id, id),
    with: { options: true, features: true },
  });
}

export type GetPricingById = Awaited<ReturnType<typeof getPricingById>>;

export async function getPricingForRole(internalRole: RoleEnum) {
  return db.query.pricing.findMany({
    where: and(
      eq(pricing.roleTarget, internalRole),
      isNull(pricing.deletionDate),
    ),
    with: { options: true, features: true },
    orderBy: [asc(pricing.monthly)],
  });
}

export async function getAllPricing() {
  return db.query.pricing.findMany({
    orderBy: [asc(pricing.roleTarget), asc(pricing.monthly)],
  });
}

// ==================== PRICING MUTATIONS ====================

export async function createPricing(data: {
  base: {
    roleTarget: (typeof roleEnum.enumValues)[number];
    title: string;
    description: string;
    free?: boolean;
    highlighted?: boolean;
    monthly?: number;
    yearly?: number;
  };
  options: string[];
  features: (typeof featureEnum.enumValues)[number][];
}) {
  return db.transaction(async (tx) => {
    const [newPricing] = await tx.insert(pricing).values(data.base).returning();

    if (data.options.length > 0) {
      await tx.insert(pricingOption).values(
        data.options.map((o, i) => ({
          name: o,
          weight: i,
          pricingId: newPricing.id,
        })),
      );
    }

    if (data.features.length > 0) {
      await tx.insert(pricingFeature).values(
        data.features.map((f) => ({
          feature: f,
          pricingId: newPricing.id,
        })),
      );
    }

    return newPricing;
  });
}

export async function updatePricing(data: {
  base: {
    id: string;
    roleTarget?: (typeof roleEnum.enumValues)[number];
    title?: string;
    description?: string;
    free?: boolean;
    highlighted?: boolean;
    monthly?: number;
    yearly?: number;
  };
  options: string[];
  features: (typeof featureEnum.enumValues)[number][];
}) {
  const pricingId = data.base.id;

  return db.transaction(async (tx) => {
    await tx
      .delete(pricingOption)
      .where(eq(pricingOption.pricingId, pricingId));
    await tx
      .delete(pricingFeature)
      .where(eq(pricingFeature.pricingId, pricingId));

    const [updatedPricing] = await tx
      .update(pricing)
      .set(data.base)
      .where(eq(pricing.id, pricingId))
      .returning();

    if (data.options.length > 0) {
      await tx.insert(pricingOption).values(
        data.options.map((o, i) => ({
          name: o,
          weight: i,
          pricingId: pricingId,
        })),
      );
    }

    if (data.features.length > 0) {
      await tx.insert(pricingFeature).values(
        data.features.map((f) => ({
          feature: f,
          pricingId: pricingId,
        })),
      );
    }

    return updatedPricing;
  });
}

export async function deletePricing(id: string) {
  return db
    .update(pricing)
    .set({ deletionDate: new Date(Date.now()) })
    .where(eq(pricing.id, id));
}

export async function undeletePricing(id: string) {
  return db
    .update(pricing)
    .set({ deletionDate: null })
    .where(eq(pricing.id, id));
}

export async function deletePricingOption(name: string) {
  return db.delete(pricingOption).where(eq(pricingOption.name, name));
}
