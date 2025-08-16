import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { featureEnum, RoleEnum, roleEnum } from "@/db/schema/enums";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { db } from "@/db";
import { and, asc, eq, isNull } from "drizzle-orm";
import {
  pricing,
  pricingFeature,
  pricingOption,
} from "@/db/schema/subscription";
import { isAdmin } from "@/server/lib/userTools";

const PricingObject = z.object({
  id: z.cuid2(),
  roleTarget: z.enum(roleEnum.enumValues),
  title: z.string(),
  description: z.string(),
  free: z.boolean().optional().default(false),
  highlighted: z.boolean().optional().default(false),
  monthly: z.number().optional().default(0),
  yearly: z.number().optional().default(0),
});

export async function getAllPricing() {
  await isAdmin();
  return db.query.pricing.findMany({
    orderBy: [asc(pricing.roleTarget), asc(pricing.monthly)],
  });
}

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
      isNull(pricing.deletionDate)
    ),
    with: { options: true, features: true },
    orderBy: [asc(pricing.monthly)],
  });
}

export const pricingRouter = createTRPCRouter({
  getPricingById: publicProcedure
    .input(z.cuid2())
    .query(async ({ input }) => await getPricingById(input)),
  getPricingForRole: publicProcedure
    .input(z.enum(roleEnum.enumValues))
    .query(({ input }) => getPricingForRole(input)),
  getAllPricing: protectedProcedure.query(async () => await getAllPricing()),
  createPricing: protectedProcedure
    .input(
      z.object({
        base: PricingObject.omit({ id: true }),
        options: z.array(z.string()),
        features: z.array(z.enum(featureEnum.enumValues)),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to create a pricing",
        });

      return await db.transaction(async (tx) => {
        const [newPricing] = await tx
          .insert(pricing)
          .values(input.base)
          .returning();

        if (input.options.length > 0) {
          await tx.insert(pricingOption).values(
            input.options.map((o, i) => ({
              name: o,
              weight: i,
              pricingId: newPricing.id,
            }))
          );
        }

        if (input.features.length > 0) {
          await tx.insert(pricingFeature).values(
            input.features.map((f) => ({
              feature: f,
              pricingId: newPricing.id,
            }))
          );
        }

        return newPricing;
      });
    }),
  updatePricing: protectedProcedure
    .input(
      z.object({
        base: PricingObject.partial(),
        options: z.array(z.string()),
        features: z.array(z.enum(featureEnum.enumValues)),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify a pricing",
        });

      if (!input.base.id)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pricing ID is required",
        });

      const pricingId = input.base.id;

      return await db.transaction(async (tx) => {
        await tx
          .delete(pricingOption)
          .where(eq(pricingOption.pricingId, pricingId));
        await tx
          .delete(pricingFeature)
          .where(eq(pricingFeature.pricingId, pricingId));

        const [updatedPricing] = await tx
          .update(pricing)
          .set(input.base)
          .where(eq(pricing.id, pricingId))
          .returning();

        if (input.options.length > 0) {
          await tx.insert(pricingOption).values(
            input.options.map((o, i) => ({
              name: o,
              weight: i,
              pricingId: pricingId,
            }))
          );
        }

        if (input.features.length > 0) {
          await tx.insert(pricingFeature).values(
            input.features.map((f) => ({
              feature: f,
              pricingId: pricingId,
            }))
          );
        }

        return updatedPricing;
      });
    }),
  deletePricing: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      if (ctx.user.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete a pricing",
        });
      return db
        .update(pricing)
        .set({
          deletionDate: new Date(Date.now()),
        })
        .where(eq(pricing.id, input));
    }),
  undeletePricing: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      if (ctx.user.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to undelete a pricing",
        });
      return db
        .update(pricing)
        .set({
          deletionDate: null,
        })
        .where(eq(pricing.id, input));
    }),
  deletePricingOption: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      if (ctx.user.internalRole !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete a pricing option",
        });
      return db.delete(pricingOption).where(eq(pricingOption.name, input));
    }),
});
