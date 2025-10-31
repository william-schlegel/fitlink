import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { event } from "@/db/schema/club";
import { db } from "@/db";

const eventObject = z.object({
  id: z.cuid2(),
  clubId: z.cuid2(),
  name: z.string(),
  brief: z.string(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  startDisplay: z.date(),
  endDisplay: z.date(),
  bannerText: z.string(),
  cancelled: z.boolean(),
  imageUrls: z.array(z.string()).optional().default([]),
  price: z.number(),
  free: z.boolean(),
  address: z.string(),
  searchAddress: z.string().optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

export const eventRouter = createTRPCRouter({
  getEventById: protectedProcedure.input(z.cuid2()).query(async ({ input }) => {
    const eventData = await db.query.event.findFirst({
      where: eq(event.id, input),
      with: { club: { with: { manager: true } } },
    });
    return eventData ?? null;
  }),
  getEventsForClub: protectedProcedure.input(z.cuid2()).query(({ input }) => {
    return db.query.event.findMany({
      where: eq(event.clubId, input),
      orderBy: [desc(event.startDate)],
    });
  }),
  createEvent: protectedProcedure
    .input(eventObject.omit({ id: true }))
    .mutation(({ input }) =>
      db.insert(event).values({
        ...input,
      }),
    ),
  updateEvent: protectedProcedure
    .input(eventObject.partial())
    .mutation(({ input }) => {
      return db.update(event).set({
        ...input,
      });
    }),
  deleteEvent: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      return db.delete(event).where(eq(event.id, input));
    }),
});
