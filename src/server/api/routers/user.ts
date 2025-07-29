import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/server";
import { UserRoleArray } from "@/db/schema";

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      // This is a mock implementation
      // In a real app, you would query your database here
      return {
        id: input.id,
        name: "John Doe",
        email: "john@example.com",
        role: "MEMBER" as const,
      };
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
        role: z.enum(UserRoleArray),
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
