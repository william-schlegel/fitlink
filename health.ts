import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/server";

export const healthRouter = createTRPCRouter({
  check: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        message: `Hello ${input.name ?? "World"}!`,
      };
    }),
});
