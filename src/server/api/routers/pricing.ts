import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { featureEnum, roleEnum } from "@/db/schema/enums";
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

export const pricingRouter = createTRPCRouter({
  getPricingById: publicProcedure.input(z.cuid2()).query(({ input }) => {
    return db.query.pricing.findFirst({
      where: eq(pricing.id, input),
      with: { options: true, features: true },
    });
  }),
  getPricingForRole: publicProcedure
    .input(z.enum(roleEnum.enumValues))
    .query(({ input }) => {
      return db.query.pricing.findMany({
        where: and(eq(pricing.roleTarget, input), isNull(pricing.deletionDate)),
        with: { options: true },
        orderBy: [asc(pricing.monthly)],
      });
    }),
  getAllPricing: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== "ADMIN")
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to query pricing",
      });
    return db.query.pricing.findMany({
      orderBy: [asc(pricing.roleTarget), asc(pricing.monthly)],
    });
  }),
  createPricing: protectedProcedure
    .input(
      z.object({
        base: PricingObject.omit({ id: true }),
        options: z.array(z.string()),
        features: z.array(z.enum(featureEnum.enumValues)),
      })
    )
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to create a pricing",
        });
      // return db.insert(pricing).values({
      //     ...input.base,
      //     options: {
      //       createMany: {
      //         data: input.options.map((o, i) => ({ name: o, weight: i })),
      //       },
      //     },
      //     features: {
      //       createMany: {
      //         data: input.features.map((f) => ({ feature: f })),
      //       },
      //       },
      //   },
      // });
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
      if (ctx.user.role !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify a pricing",
        });
      await db
        .delete(pricingOption)
        .where(eq(pricingOption.pricingId, input.base.id ?? ""));
      await db
        .delete(pricingFeature)
        .where(eq(pricingFeature.pricingId, input.base.id ?? ""));
      // return db.update(pricing).set({
      //   data: {
      //     ...input.base,
      //     options: {
      //       createMany: {
      //         data: input.options.map((o, i) => ({ name: o, weight: i })),
      //       },
      //     },
      //     features: {
      //       createMany: {
      //         data: input.features.map((f) => ({ feature: f })),
      //       },
      //     },
      //   },
      // });
    }),
  deletePricing: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "ADMIN")
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
      if (ctx.user.role !== "ADMIN")
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
      if (ctx.user.role !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete a pricing option",
        });
      return db.delete(pricingOption).where(eq(pricingOption.name, input));
    }),
});
