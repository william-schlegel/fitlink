import { asc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import z from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { activity, club, clubCoachs, site } from "@/db/schema/club";
import { openingCalendarClubs } from "@/db/schema/planning";
import { userCoach, userDocument } from "@/db/schema/user";
import { createChannelService } from "@/server/lib/chat";
import { page } from "@/db/schema/page";
import { user } from "@/db/schema/auth";
import { isCUID } from "@/lib/utils";
import { getDocUrl } from "./files";
import { db } from "@/db";

export const clubRouter = createTRPCRouter({
  getClubById: protectedProcedure
    .input(z.object({ clubId: z.cuid2(), userId: z.string() }))
    .query(async ({ input }) => {
      if (!isCUID(input.clubId) || !input.userId) return null;
      const userData = await db.query.user.findFirst({
        where: eq(user.id, input.userId),
        with: {
          pricing: {
            with: {
              features: true,
            },
          },
        },
      });
      const take: number | undefined = userData?.pricing?.features.find(
        (f) => f.feature === "MANAGER_MULTI_SITE",
      )
        ? undefined
        : 1;
      const myClub = await db.query.club.findFirst({
        where: eq(club.id, input.clubId),
        with: {
          sites: {
            limit: take,
            with: {
              rooms: {
                with: {
                  activities: {
                    with: {
                      activity: true,
                    },
                  },
                },
              },
            },
          },

          activities: { with: { group: true } },
          logo: true,
        },
      });
      let logoUrl = "";
      if (myClub?.logoId) {
        logoUrl = await getDocUrl(myClub.managerId, myClub.logoId);
      }
      return { ...myClub, logoUrl };
    }),
  getClubPagesForNavByClubId: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const myClub = await db.query.club.findFirst({
        where: eq(club.id, input),
        with: {
          pages: {
            where: eq(page.published, true),
            with: {
              sections: true,
            },
          },
        },
      });
      let logoUrl = "";
      if (myClub?.logoId) {
        logoUrl = await getDocUrl(myClub.managerId, myClub.logoId);
      }
      if (!myClub) return { pages: [], logoUrl };
      return {
        pages: myClub.pages.map((p) => ({
          id: p.id,
          name: p.name,
          target: p.target,
          sections: p.sections.map((s) => ({
            id: s.id,
            model: s.model,
            title: s.title,
          })),
        })),
        logoUrl,
      };
    }),
  getClubsForManager: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, input),
        with: {
          pricing: {
            with: {
              features: true,
            },
          },
        },
      });
      const take = userData?.pricing?.features.find(
        (f) => f.feature === "MANAGER_MULTI_CLUB",
      )
        ? undefined
        : 1;
      return db.query.club.findMany({
        where: eq(club.managerId, input),
        orderBy: asc(club.name),
        limit: take,
      });
    }),
  getAllClubs: publicProcedure.query(async () =>
    db.query.club.findMany({
      orderBy: asc(club.name),
      with: { activities: { with: { group: true } }, pages: true },
    }),
  ),
  createClub: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        userId: z.string(),
        searchAddress: z.string(),
        longitude: z.number(),
        latitude: z.number(),
        logoId: z.cuid2().optional(),
        isSite: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.internalRole !== "ADMIN" && ctx.user.id !== input.userId)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to create a club for this user",
        });

      const newClub = await db.transaction(async (tx) => {
        // create the channel for the club via shared service
        const chatChannel = await createChannelService({
          name: input.name,
          createdByUserId: input.userId,
        });
        const clb = await tx
          .insert(club)
          .values({
            name: input.name,
            address: input.address,
            managerId: input.userId,
            logoId: input.logoId ? input.logoId : undefined,
            chatGroupId: chatChannel?.id,
          })
          .returning();
        if (input.isSite) {
          await tx.insert(site).values({
            clubId: clb[0].id,
            name: input.name,
            address: input.address,
            searchAddress: input.searchAddress,
            longitude: input.longitude,
            latitude: input.latitude,
          });
        }
        return clb[0];
      });

      return newClub;
    }),
  updateClub: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
        address: z.string(),
        logoId: z.cuid2().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const initialClub = await db.query.club.findFirst({
        where: eq(club.id, input.id),
        with: {
          manager: {
            with: {
              user: true,
            },
          },
        },
      });
      if (
        ctx.user.internalRole !== "ADMIN" &&
        ctx.user.id !== initialClub?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });
      const initialLogoId = club?.logoId;
      const data: {
        name: string;
        address: string;
        logoId: string | null;
      } = {
        name: input.name,
        address: input.address,
        logoId: input.logoId,
      };

      const updated = await db
        .update(club)
        .set(data)
        .where(eq(club.id, input.id))
        .returning();
      if (initialLogoId && !input.logoId) {
        await db.delete(userDocument).where(eq(userDocument.id, initialLogoId));
      }

      // if (initialClub) {
      //   // create the channel for the club
      //   let token = initialClub.manager.user.chatToken;
      //   if (!token) {
      //     token = createToken(initialClub.managerId);
      //     await db.update(user).set({ chatToken: token }).where(eq(user.id, initialClub.managerId));
      //   }
      //   await streamchatClient.connectUser({ id: club.managerId }, token);
      //   const channel = streamchatClient.channel("messaging", club.id, {
      //     name: input.name,
      //     created_by_id: club.managerId,
      //   });
      //   await channel.create();
      // }
      return updated;
    }),
  updateClubCalendar: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        calendarId: z.cuid2(),
      }),
    )
    .mutation(async ({ input }) => {
      return db
        .update(openingCalendarClubs)
        .set({
          openingCalendarId: input.calendarId,
          clubId: input.id,
        })
        .where(eq(openingCalendarClubs.clubId, input.id))
        .returning();
    }),

  deleteClub: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ ctx, input }) => {
      const deletedClub = await db.query.club.findFirst({
        where: eq(club.id, input),
      });
      if (
        ctx.user.internalRole !== "ADMIN" &&
        ctx.user.id !== deletedClub?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete this club",
        });
      return db.delete(club).where(eq(club.id, input));
    }),
  updateClubActivities: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        activities: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const initialClub = await db.query.club.findFirst({
        where: eq(club.id, input.id),
      });
      if (
        ctx.user.internalRole !== "ADMIN" &&
        ctx.user.id !== initialClub?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });

      // Option 1: Assign activities to this club (update clubId in activities)
      return db
        .update(activity)
        .set({
          clubId: input.id,
        })
        .where(inArray(activity.id, input.activities))
        .returning();
    }),
  updateClubCoach: protectedProcedure
    .input(
      z.object({
        clubId: z.cuid2(),
        coachUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const initialClub = await db.query.club.findFirst({
        where: eq(club.id, input.clubId),
      });
      if (
        ctx.user.internalRole !== "ADMIN" &&
        ctx.user.id !== initialClub?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });

      return db
        .update(clubCoachs)
        .set({
          clubId: input.clubId,
        })
        .where(eq(userCoach.userId, input.coachUserId))
        .returning();
    }),
});
