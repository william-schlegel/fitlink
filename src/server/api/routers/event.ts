import { z } from "zod";

import {
  createEvent,
  deleteEvent,
  getEventById,
  getEventsForClub,
  updateEvent,
} from "@/db/dal";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";

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
    const eventData = await getEventById(input);
    return eventData ?? null;
  }),

  getEventsForClub: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getEventsForClub(input)),

  createEvent: protectedProcedure
    .input(eventObject.omit({ id: true }))
    .mutation(({ input }) => createEvent(input)),

  updateEvent: protectedProcedure
    .input(eventObject.partial())
    .mutation(({ input }) => updateEvent({ id: input.id ?? "", ...input })),

  deleteEvent: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) => deleteEvent(input)),
});
