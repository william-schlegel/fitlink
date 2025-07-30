import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { roleEnum } from "@/db/schema/enums";
import { user } from "@/db/schema/auth";

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const foundUser = await db.query.user.findFirst({
        with: {
          pricing: {
            with: {
              features: true,
            },
          },
        },
        where: eq(user.id, input.id),
      });
      return foundUser;
    }),

  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(({ input }) => {
      // Mock implementation
      return Array.from({ length: input.limit }, (_, i) => ({
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: "MEMBER" as const,
      }));
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.email(),
        role: z.enum(roleEnum.enumValues),
      })
    )
    .mutation(({ input }) => {
      // Mock implementation
      return {
        id: `user-${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString(),
      };
    }),
});
