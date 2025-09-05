import { db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import {
  page,
  pageSection,
  pageSectionElement,
  page as pageTable,
} from "@/db/schema/page";
import { club, club as clubTable } from "@/db/schema/club";
import {
  pageSectionElementTypeEnum,
  pageSectionModelEnum,
  pageTargetEnum,
} from "@/db/schema/enums";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import z from "zod";
import { user } from "@/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { getDocUrl } from "../../../../files";
import { userCoach, userDocument } from "@/db/schema/user";
import { isCUID } from "@/lib/utils";

const PageObject = z.object({
  id: z.cuid2(),
  name: z.string(),
  clubId: z.cuid2().optional(),
  userId: z.cuid2().optional(),
  target: z.enum(pageTargetEnum.enumValues),
});

const PageSectionObject = z.object({
  id: z.cuid2(),
  model: z.enum(pageSectionModelEnum.enumValues),
  pageId: z.cuid2(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

const PageSectionElementObject = z.object({
  id: z.cuid2(),
  images: z.array(z.cuid2()).optional().default([]),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  elementType: z.enum(pageSectionElementTypeEnum.enumValues),
  content: z.string().optional(),
  link: z.string().url().optional(),
  pageId: z.cuid2().optional(),
  pageSection: z.enum(pageSectionModelEnum.enumValues).optional(),
  sectionId: z.cuid2(),
  optionValue: z.string().optional(),
});

// type GetCoachDataForPageReturn = {
//   certifications: { id: string; name: string }[];
//   activities: { id: string; name: string }[];
//   offers: (CoachingPrice & {
//     coachingLevel: CoachingLevel[];
//   })[];
// };

export function getPagesForClub(clubId: string) {
  if (!isCUID(clubId)) return [];
  return db.query.page.findMany({
    where: eq(page.clubId, clubId),
  });
}

export async function getPageForCoach(coachId: string) {
  {
    const coachPage = await db.query.page.findFirst({
      where: eq(page.coachId, coachId),
    });
    if (coachPage) return coachPage;
    const actualUser = await db.query.user.findFirst({
      where: eq(user.id, coachId),
    });
    if (!actualUser)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Error fetching user ${coachId}`,
      });
    return db.transaction(async (tx) => {
      const newPage = await tx
        .insert(page)
        .values({
          name: actualUser.name ?? "coach",
          target: "HOME",
          coachId,
        })
        .returning();

      const newSection = await tx
        .insert(pageSection)
        .values({
          pageId: newPage[0].id,
          model: "HERO",
          title: actualUser.name,
          subTitle: actualUser.name,
        })
        .returning({ id: pageSection.id });
      await tx.insert(pageSectionElement).values({
        pageId: newPage[0].id,
        sectionId: newSection[0].id,
        elementType: "HERO_CONTENT",
        title: actualUser.name,
      });
      return newPage[0];
    });
  }
}

export const pageRouter = createTRPCRouter({
  getPagesForManager: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const rows = await db
        .select({ page: pageTable, club: clubTable })
        .from(pageTable)
        .innerJoin(clubTable, eq(pageTable.clubId, clubTable.id))
        .where(eq(clubTable.managerId, input));
      return rows.map((r) => ({ ...r.page, club: r.club }));
    }),
  getPagesForClub: protectedProcedure
    .input(z.cuid2())
    .query(({ input }) => getPagesForClub(input)),
  getPageForCoach: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => getPageForCoach(input)),
  getPageById: protectedProcedure.input(z.cuid2()).query(({ input }) =>
    db.query.page.findFirst({
      where: eq(page.id, input),
      with: {
        sections: {
          with: {
            elements: {
              with: {
                images: {
                  with: {
                    document: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  ),
  getPageSection: publicProcedure
    .input(
      z.object({
        pageId: z.cuid2(),
        section: z.enum(pageSectionModelEnum.enumValues),
      })
    )
    .query(async ({ input }) => {
      const section = await db.query.pageSection.findFirst({
        where: and(
          eq(pageSection.pageId, input.pageId),
          eq(pageSection.model, input.section)
        ),
        with: {
          elements: {
            with: { images: { with: { document: true } } },
          },
          page: { with: { club: true } },
        },
      });
      const images: {
        elemId: string;
        docId: string;
        userId: string;
        url: string;
      }[] = [];
      const userId = section?.page.club?.managerId ?? "";
      for (const elem of section?.elements ?? []) {
        for (const doc of elem.images) {
          const url = await getDocUrl(userId, doc.document.id);
          if (url)
            images.push({
              elemId: elem.id,
              docId: doc.document.id,
              userId: doc.document.userId,
              url,
            });
        }
      }
      if (!section) return null;
      return {
        id: section.id,
        title: section.title,
        subTitle: section.subTitle,
        elements: section.elements.map((e) => ({
          id: e.id,
          title: e.title,
          subTitle: e.subTitle,
          content: e.content,
          elementType: e.elementType,
          link: e.link,
          optionValue: e.optionValue,
          pageId: e.pageId,
          sectionId: e.sectionId,
          pageSection: e.pageSection,
          images: images
            .filter((i) => i.elemId === e.id)
            .map((i) => ({ docId: i.docId, userId: i.userId, url: i.url })),
        })),
      };
    }),
  getPageSectionElements: publicProcedure
    .input(
      z.object({
        pageId: z.cuid2(),
        section: z.enum(pageSectionModelEnum.enumValues),
      })
    )
    .query(async ({ input }) => {
      const section = await db.query.pageSection.findFirst({
        where: and(
          eq(pageSection.pageId, input.pageId),
          eq(pageSection.model, input.section)
        ),
        with: {
          elements: true,
        },
      });
      if (!section) return null;
      return section.elements;
    }),
  getPageSectionElementById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => {
      const elem = await db.query.pageSectionElement.findFirst({
        where: eq(pageSectionElement.id, input),
        with: {
          images: {
            with: {
              document: true,
            },
          },
        },
      });
      const images: {
        docId: string;
        userId: string;
        url: string;
      }[] = [];
      for (const doc of elem?.images ?? []) {
        const url = await getDocUrl(doc.document.userId, doc.document.id);
        if (url)
          images.push({
            docId: doc.id,
            userId: doc.document.userId,
            url,
          });
      }
      if (!elem) return null;
      return {
        id: elem.id,
        title: elem.title,
        subTitle: elem.subTitle,
        content: elem.content,
        elementType: elem.elementType,
        link: elem.link,
        optionValue: elem.optionValue,
        pageId: elem.pageId,
        sectionId: elem.sectionId,
        pageSection: elem.pageSection,
        images,
      };
    }),
  createPage: protectedProcedure
    .input(PageObject.omit({ id: true }))
    .mutation(({ input }) => db.insert(page).values(input).returning()),
  updatePage: protectedProcedure
    .input(PageObject.omit({ clubId: true }))
    .mutation(({ input }) =>
      db.update(page).set(input).where(eq(page.id, input.id))
    ),
  deletePage: protectedProcedure
    .input(z.string())
    .mutation(({ input }) => db.delete(page).where(eq(page.id, input))),
  createPageSection: protectedProcedure
    .input(PageSectionObject.omit({ id: true }))
    .mutation(({ input }) => db.insert(pageSection).values(input).returning()),
  updatePageSection: protectedProcedure
    .input(PageSectionObject.partial())
    .mutation(({ input }) =>
      db
        .update(pageSection)
        .set(input)
        .where(eq(pageSection.id, input.id ?? ""))
    ),
  deletePageSection: protectedProcedure
    .input(z.object({ pageId: z.cuid2(), sectionId: z.cuid2() }))
    .mutation(async ({ input }) => {
      return db
        .delete(pageSection)
        .where(eq(pageSection.id, input.sectionId))
        .returning();
    }),
  createPageSectionElement: protectedProcedure
    .input(PageSectionElementObject.omit({ id: true }))
    .mutation(({ input }) =>
      db.insert(pageSectionElement).values({
        content: input.content,
        elementType: input.elementType,
        // images: {
        //   connect: input.images.map((imageId) => ({ id: imageId })),
        // },
        link: input.link,
        pageId: input.pageId,
        pageSection: input.pageSection,
        title: input.title,
        subTitle: input.subTitle,
        sectionId: input.sectionId,
        optionValue: input.optionValue,
      })
    ),
  updatePageSectionElement: protectedProcedure
    .input(
      PageSectionElementObject.omit({ sectionId: true, elementType: true })
    )
    .mutation(({ input }) =>
      db
        .update(pageSectionElement)
        .set({
          content: input.content,
          // images: {
          //   connect: input.images.map((imageId) => ({ id: imageId })),
          // },
          link: input.link,
          pageId: input.pageId,
          pageSection: input.pageSection,
          title: input.title,
          subTitle: input.subTitle,
          optionValue: input.optionValue,
        })
        .where(eq(pageSectionElement.id, input.id))
    ),
  deletePageSectionElement: protectedProcedure
    .input(z.string())
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const images = await tx.query.pageSectionElement.findFirst({
          where: eq(pageSectionElement.id, input),
          with: {
            images: { columns: { id: true } },
          },
        });
        await tx
          .delete(pageSectionElement)
          .where(eq(pageSectionElement.id, input));
        await tx
          .delete(userDocument)
          .where(
            inArray(userDocument.id, images?.images.map((i) => i.id) ?? [])
          );
      })
    ),
  getClubPage: publicProcedure.input(z.string()).query(async ({ input }) => {
    const clubPage = await db.query.page.findFirst({
      where: and(eq(page.id, input), eq(page.published, true)),
      with: {
        sections: {
          with: {
            elements: {
              with: {
                images: true,
              },
            },
          },
        },
      },
    });
    const clubId = clubPage?.clubId ?? "";
    const allPages = await db.query.page.findMany({
      where: and(eq(page.clubId, clubId), eq(page.published, true)),
    });
    const myClub = await db.query.club.findFirst({
      where: eq(club.id, clubId),
    });
    return {
      clubId,
      sections: clubPage?.sections ?? [],
      pages: allPages.map((p) => p.target),
      theme: myClub?.pageStyle ?? "light",
      clubName: myClub?.name ?? "",
    };
  }),
  getCoachPage: publicProcedure.input(z.string()).query(async ({ input }) => {
    // 1) Charger la page avec ses relations (sections -> elements -> images)
    const coachPage = await db.query.page.findFirst({
      where: and(
        eq(page.id, input),
        eq(page.target, "HOME"),
        eq(page.published, true)
      ),
      with: {
        sections: {
          with: {
            elements: { with: { images: true } },
          },
        },
      },
    });

    const coachUserId = coachPage?.coachId ?? "";

    // 2) Charger l'utilisateur coach et toutes ses relations nécessaires
    const coachUser = await db.query.user.findFirst({
      where: eq(user.id, coachUserId),
      with: {
        pricing: { with: { features: true } },
        coachData: {
          with: {
            certifications: { with: { modules: true } },
            coachingActivities: true,
            coachingPrices: { with: { coachingLevel: true } },
          },
        },
      },
    });

    const image = coachPage?.sections
      .find((s) => s.model === "HERO")
      ?.elements.find((e) => e.elementType === "HERO_CONTENT")?.images?.[0];
    const hero = coachPage?.sections
      .find((s) => s.model === "HERO")
      ?.elements.find((e) => e.elementType === "HERO_CONTENT");
    const options = new Map(
      coachPage?.sections
        .find((s) => s.model === "HERO")
        ?.elements.filter((e) => e.elementType === "OPTION")
        .map((o) => [o.title, o.optionValue])
    );
    const activities =
      coachUser?.coachData?.coachingActivities.map(
        (a: { id: string; name: string }) => ({
          id: a.id,
          name: a.name,
        })
      ) ?? [];
    const features = (coachUser?.pricing?.features ?? []) as Array<{
      feature: string;
    }>;
    const certificationOk = !!features.find(
      (f) => f.feature === "COACH_CERTIFICATION"
    );

    const certifications = certificationOk
      ? coachUser?.coachData?.certifications.map((c) => ({
          id: c.id,
          name: c.name,
        })) ?? []
      : [];
    const offersOk = !!features.find((f) => f.feature === "COACH_OFFER");
    const offerCompaniesOk = !!features.find(
      (f) => f.feature === "COACH_OFFER_COMPANY"
    );
    const offers = offersOk
      ? coachUser?.coachData?.coachingPrices.filter((c) =>
          offerCompaniesOk ? true : c.target === "INDIVIDUAL"
        ) ?? []
      : [];

    return {
      email: coachUser?.email,
      phone: coachUser?.phone,
      searchAddress: coachUser?.coachData?.searchAddress,
      longitude: coachUser?.coachData?.longitude,
      latitude: coachUser?.coachData?.latitude,
      range: coachUser?.coachData?.range,
      hero,
      options,
      activities,
      certifications,
      pageStyle: coachUser?.coachData?.pageStyle,
      publicName: coachUser?.coachData?.publicName,
      offers,
      image,
    };
  }),
  getCoachDataForPage: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, input),
        with: {
          pricing: { with: { features: true } },
          coachData: {
            with: {
              certifications: { with: { modules: true } },
              coachingActivities: true,
              coachingPrices: { with: { coachingLevel: true } },
            },
          },
        },
      });
      const features = (userData?.pricing?.features ?? []) as Array<{
        feature: string;
      }>;
      const certificationOk = !!features.find(
        (f) => f.feature === "COACH_CERTIFICATION"
      );
      const certifications = certificationOk
        ? userData?.coachData?.certifications.map((c) => ({
            id: c.id,
            name: c.name,
          })) ?? []
        : [];

      const offersOk = !!features.find((f) => f.feature === "COACH_OFFER");
      const offerCompaniesOk = !!features.find(
        (f) => f.feature === "COACH_OFFER_COMPANY"
      );
      const offers = offersOk
        ? userData?.coachData?.coachingPrices.filter((c) =>
            offerCompaniesOk ? true : c.target === "INDIVIDUAL"
          ) ?? []
        : [];
      return {
        certifications,
        activities:
          userData?.coachData?.coachingActivities.map((a) => ({
            id: a.id,
            name: a.name,
          })) ?? [],
        offers,
      };
    }),
  updatePagePublication: protectedProcedure
    .input(z.object({ pageId: z.cuid2(), published: z.boolean() }))
    .mutation(({ input }) =>
      db
        .update(page)
        .set({ published: input.published })
        .where(eq(page.id, input.pageId))
        .returning()
    ),
  updatePageStyleForCoach: protectedProcedure
    .input(
      z.object({
        userId: z.cuid2(),
        pageStyle: z.string(),
      })
    )
    .mutation(({ input }) =>
      db
        .update(userCoach)
        .set({ pageStyle: input.pageStyle })
        .where(eq(userCoach.userId, input.userId))
    ),
  updatePageStyleForClub: protectedProcedure
    .input(
      z.object({
        clubId: z.cuid2(),
        pageStyle: z.string(),
      })
    )
    .mutation(({ input }) =>
      db
        .update(club)
        .set({ pageStyle: input.pageStyle })
        .where(eq(club.id, input.clubId))
    ),
});
