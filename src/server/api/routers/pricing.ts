import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createPricing as dalCreatePricing,
  deletePricing as dalDeletePricing,
  deletePricingOption as dalDeletePricingOption,
  getAllPricing as dalGetAllPricing,
  getPricingById as dalGetPricingById,
  getPricingForRole as dalGetPricingForRole,
  undeletePricing as dalUndeletePricing,
  updatePricing as dalUpdatePricing,
} from "@/db/dal";
import { featureEnum, roleEnum } from "@/db/schema/enums";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { isAdmin, requireAdmin } from "@/server/lib/userTools";

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
  return dalGetAllPricing();
}

export async function getPricingById(id: string) {
  return dalGetPricingById(id);
}

export type GetPricingById = Awaited<ReturnType<typeof getPricingById>>;

export async function getPricingForRole(
  internalRole: (typeof roleEnum.enumValues)[number],
) {
  return dalGetPricingForRole(internalRole);
}

export const pricingRouter = createTRPCRouter({
  getPricingById: publicProcedure
    .input(z.cuid2())
    .query(async ({ input }) => getPricingById(input)),

  getPricingForRole: publicProcedure
    .input(z.enum(roleEnum.enumValues))
    .query(({ input }) => getPricingForRole(input)),

  getAllPricing: protectedProcedure.query(async () => getAllPricing()),

  createPricing: protectedProcedure
    .input(
      z.object({
        base: PricingObject.omit({ id: true }),
        options: z.array(z.string()),
        features: z.array(z.enum(featureEnum.enumValues)),
      }),
    )
    .mutation(({ input, ctx }) => {
      requireAdmin(ctx.user);
      return dalCreatePricing(input);
    }),

  updatePricing: protectedProcedure
    .input(
      z.object({
        base: PricingObject.partial(),
        options: z.array(z.string()),
        features: z.array(z.enum(featureEnum.enumValues)),
      }),
    )
    .mutation(({ input, ctx }) => {
      requireAdmin(ctx.user);

      if (!input.base.id)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pricing ID is required",
        });

      return dalUpdatePricing({
        base: { id: input.base.id, ...input.base },
        options: input.options,
        features: input.features,
      });
    }),

  deletePricing: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      requireAdmin(ctx.user);
      return dalDeletePricing(input);
    }),

  undeletePricing: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      requireAdmin(ctx.user);
      return dalUndeletePricing(input);
    }),

  deletePricingOption: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      requireAdmin(ctx.user);
      return dalDeletePricingOption(input);
    }),
});
