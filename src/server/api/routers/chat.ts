import z from "zod";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { channel } from "@/db/schema/chat";
import { db } from "@/db";

export const clubRouter = createTRPCRouter({
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        createdByUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.insert(channel).values({
        name: input.name,
        createdByUserId: input.createdByUserId,
      });
    }),
});
