import { InferSelectModel } from "drizzle-orm";
import z from "zod";

import {
  createPage,
  createPageSection,
  createPageSectionElement,
  createPageWithInitialSection,
  getClubPage as dalGetClubPage,
  getCoachPage as dalGetCoachPage,
  getPageSection as dalGetPageSection,
  deletePage,
  deletePageSection,
  deletePageSectionElement,
  getAllPublishedPagesForClub,
  getAllPublishedPagesForCoach,
  getClubBasicInfo,
  getCoachDataForPage,
  getCoachUserForPage,
  getPageById,
  getPageForCoach,
  getPageSectionElementById,
  getPageSectionElements,
  getPagesForClub,
  getPagesForManager,
  getPublishedPagesForClub,
  getUserForPageCreation,
  updatePage,
  updatePagePublication,
  updatePageSection,
  updatePageSectionElement,
  updatePageStyleForClub,
  updatePageStyleForCoach,
} from "@/db/dal";
import {
  pageSectionElementTypeEnum,
  pageSectionModelEnum,
  pageTargetEnum,
} from "@/db/schema/enums";
import { pageSectionElement } from "@/db/schema/page";
import { ZodClubId, ZodPageId, ZodUserId } from "@/db/types";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";

const PageObject = z.object({
  id: ZodPageId,
  name: z.string(),
  clubId: ZodClubId.optional(),
  userId: ZodUserId.optional(),
  target: z.enum(pageTargetEnum.enumValues),
});

const PageSectionObject = z.object({
  id: z.cuid2(),
  model: z.enum(pageSectionModelEnum.enumValues),
  pageId: ZodPageId,
  title: z.string().optional(),
  subTitle: z.string().optional(),
});

const PageSectionElementObject = z.object({
  id: z.cuid2(),
  images: z.array(z.string()).optional().default([]),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  elementType: z.enum(pageSectionElementTypeEnum.enumValues),
  content: z.string().optional(),
  link: z.url().optional(),
  pageId: ZodPageId.optional(),
  pageSection: z.enum(pageSectionModelEnum.enumValues).optional(),
  sectionId: z.cuid2(),
  optionValue: z.string().optional(),
});

export { getPagesForClub };

export const pageRouter = createTRPCRouter({
  listPublicClubPresentationParams: publicProcedure.query(async () => {
    const pages = await getAllPublishedPagesForClub();
    return pages.map((p) => ({
      clubId: p.clubId,
      pageId: p.id,
      updatedAt: p.updatedAt,
    }));
  }),
  listPublicCoachPresentationParams: publicProcedure.query(async () => {
    const pages = await getAllPublishedPagesForCoach();
    return pages.map((p) => ({
      coachUserId: p.coachUserId,
      pageId: p.id,
      updatedAt: p.updatedAt,
    }));
  }),
  getPagesForManager: protectedProcedure
    .input(ZodUserId)
    .query(({ input }) => getPagesForManager(input)),

  getPagesForClub: protectedProcedure
    .input(ZodClubId)
    .query(({ input }) => getPagesForClub(input)),

  getPageForCoach: publicProcedure
    .input(z.object({ userId: ZodUserId }))
    .query(async ({ input }) => {
      const coachPage = await getPageForCoach(input.userId);
      if (coachPage) return coachPage;

      const actualUser = await getUserForPageCreation(input.userId);
      if (actualUser) {
        return createPageWithInitialSection(
          actualUser.name ?? "coach",
          input.userId,
          actualUser.name,
        );
      }
      return null;
    }),

  getPageById: protectedProcedure
    .input(ZodPageId)
    .query(({ input }) => getPageById(input)),

  getPageSection: publicProcedure
    .input(
      z.object({
        pageId: ZodPageId,
        section: z.enum(pageSectionModelEnum.enumValues),
        createIfNone: z.boolean().optional().default(false),
        createElement: z
          .object({
            elementType: z.enum(pageSectionElementTypeEnum.enumValues),
            title: z.string(),
          })
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const section = await dalGetPageSection(input.pageId, input.section);
      if (!section) {
        if (input.createIfNone) {
          const newSection = await createPageSection({
            pageId: input.pageId,
            model: input.section,
            title: "Section",
            subTitle: "",
          });
          let newElement: InferSelectModel<typeof pageSectionElement>[] = [];
          if (input.createElement) {
            newElement = await createPageSectionElement({
              sectionId: newSection[0].id,
              elementType: input.createElement.elementType,
              title: input.createElement.title,
            });
          }
          return {
            id: newSection[0].id,
            title: newSection[0].title,
            subTitle: newSection[0].subTitle,
            elements: newElement,
          };
        }
        return null;
      }
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
          imageUrls: e.imageUrls,
        })),
      };
    }),

  getPageSectionElements: publicProcedure
    .input(
      z.object({
        pageId: ZodPageId,
        section: z.enum(pageSectionModelEnum.enumValues),
      }),
    )
    .query(({ input }) => getPageSectionElements(input.pageId, input.section)),

  getPageSectionElementById: protectedProcedure
    .input(z.object({ sectionElementId: z.cuid2() }))
    .query(async ({ input }) => {
      const elem = await getPageSectionElementById(input.sectionElementId);
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
        images: elem.imageUrls,
      };
    }),

  createPage: protectedProcedure
    .input(PageObject.omit({ id: true }))
    .mutation(({ input }) =>
      createPage({
        name: input.name,
        clubId: input.clubId,
        coachUserId: input.userId,
        target: input.target,
      }),
    ),

  updatePage: protectedProcedure
    .input(PageObject.omit({ clubId: true }))
    .mutation(({ input }) => updatePage(input)),

  deletePage: protectedProcedure
    .input(z.object({ pageId: ZodPageId }))
    .mutation(({ input }) => deletePage(input.pageId)),

  createPageSection: protectedProcedure
    .input(PageSectionObject.omit({ id: true }))
    .mutation(({ input }) => createPageSection(input)),

  updatePageSection: protectedProcedure
    .input(PageSectionObject.partial())
    .mutation(({ input }) =>
      updatePageSection({ id: input.id ?? "", ...input }),
    ),

  deletePageSection: protectedProcedure
    .input(z.object({ pageId: z.cuid2(), sectionId: z.cuid2() }))
    .mutation(({ input }) => deletePageSection(input.sectionId)),

  createPageSectionElement: protectedProcedure
    .input(PageSectionElementObject.omit({ id: true }))
    .mutation(({ input }) => createPageSectionElement(input)),

  updatePageSectionElement: protectedProcedure
    .input(
      PageSectionElementObject.omit({ sectionId: true, elementType: true }),
    )
    .mutation(({ input }) => updatePageSectionElement(input)),

  deletePageSectionElement: protectedProcedure
    .input(z.object({ sectionElementId: z.string() }))
    .mutation(({ input }) => deletePageSectionElement(input.sectionElementId)),

  getClubPage: publicProcedure
    .input(z.object({ pageId: ZodPageId }))
    .query(async ({ input }) => {
      const clubPage = await dalGetClubPage(input.pageId);
      if (!clubPage) return null;
      const clubId = clubPage.clubId;
      if (!clubId) return null;
      const allPages = await getPublishedPagesForClub(clubId);
      const myClub = await getClubBasicInfo(clubId);
      return {
        clubId,
        sections: clubPage?.sections ?? [],
        pages: allPages.map((p) => p.target),
        theme: myClub?.pageStyle ?? "light",
        clubName: myClub?.name ?? "",
      };
    }),

  getCoachPage: publicProcedure
    .input(z.object({ pageId: ZodPageId }))
    .query(async ({ input }) => {
      const coachPage = await dalGetCoachPage(input.pageId);
      const coachUserId = coachPage?.coachUserId;
      const coachUser = await getCoachUserForPage(coachUserId);

      const image = coachPage?.sections
        .find((s) => s.model === "HERO")
        ?.elements.find((e) => e.elementType === "HERO_CONTENT")
        ?.imageUrls?.[0];
      const hero = coachPage?.sections
        .find((s) => s.model === "HERO")
        ?.elements.find((e) => e.elementType === "HERO_CONTENT");
      const options = new Map(
        coachPage?.sections
          .find((s) => s.model === "HERO")
          ?.elements.filter((e) => e.elementType === "OPTION")
          .map((o) => [o.title, o.optionValue]),
      );
      const activities =
        coachUser?.coachData?.coachingActivities?.map((a, idx) => ({
          id: `${idx}-${a}`,
          name: a,
        })) ?? [];
      const features = (coachUser?.pricing?.features ?? []) as Array<{
        feature: string;
      }>;
      const certificationOk = !!features.find(
        (f) => f.feature === "COACH_CERTIFICATION",
      );

      const certifications = certificationOk
        ? (coachUser?.coachData?.certifications.map((c) => ({
            id: c.id,
            name: c.name,
          })) ?? [])
        : [];
      const offersOk = !!features.find((f) => f.feature === "COACH_OFFER");
      const offerCompaniesOk = !!features.find(
        (f) => f.feature === "COACH_OFFER_COMPANY",
      );
      const offers = offersOk
        ? (coachUser?.coachData?.coachingPrices.filter((c) =>
            offerCompaniesOk ? true : c.target === "INDIVIDUAL",
          ) ?? [])
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
    .input(z.object({ coachUserId: ZodUserId }))
    .query(async ({ input }) => {
      const userData = await getCoachDataForPage(input.coachUserId);
      const features = (userData?.pricing?.features ?? []) as Array<{
        feature: string;
      }>;
      const certificationOk = !!features.find(
        (f) => f.feature === "COACH_CERTIFICATION",
      );
      const certifications = certificationOk
        ? (userData?.coachData?.certifications.map((c) => ({
            id: c.id,
            name: c.name,
          })) ?? [])
        : [];

      const offersOk = !!features.find((f) => f.feature === "COACH_OFFER");
      const offerCompaniesOk = !!features.find(
        (f) => f.feature === "COACH_OFFER_COMPANY",
      );
      const offers = offersOk
        ? (userData?.coachData?.coachingPrices.filter((c) =>
            offerCompaniesOk ? true : c.target === "INDIVIDUAL",
          ) ?? [])
        : [];
      return {
        certifications,
        activities:
          userData?.coachData?.coachingActivities?.map((name, idx) => ({
            id: `${idx}-${name}`,
            name,
          })) ?? [],
        offers,
      };
    }),

  updatePagePublication: protectedProcedure
    .input(z.object({ pageId: ZodPageId, published: z.boolean() }))
    .mutation(({ input }) =>
      updatePagePublication(input.pageId, input.published),
    ),

  updatePageStyleForCoach: protectedProcedure
    .input(
      z.object({
        userId: ZodUserId,
        pageStyle: z.string(),
      }),
    )
    .mutation(({ input }) =>
      updatePageStyleForCoach(input.userId, input.pageStyle),
    ),

  updatePageStyleForClub: protectedProcedure
    .input(
      z.object({
        clubId: ZodClubId,
        pageStyle: z.string(),
      }),
    )
    .mutation(({ input }) =>
      updatePageStyleForClub(input.clubId, input.pageStyle),
    ),
});
