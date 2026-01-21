import { and, eq, InferSelectModel } from "drizzle-orm";

import {
  pageSectionElementTypeEnum,
  pageSectionModelEnum,
  pageTargetEnum,
} from "@/db/schema/enums";
import { page, pageSection, pageSectionElement } from "@/db/schema/page";
import { userCoach } from "@/db/schema/user";
import { club } from "@/db/schema/club";
import { user } from "@/db/schema/auth";
import { isCUID } from "@/lib/utils";
import { db } from "@/db";

// ==================== PAGE QUERIES ====================

export async function getPageById(id: string) {
  return db.query.page.findFirst({
    where: eq(page.id, id),
    with: {
      sections: {
        with: {
          elements: true,
        },
      },
    },
  });
}

export function getPagesForClub(clubId: string) {
  if (!isCUID(clubId)) return [];
  return db.query.page.findMany({
    where: eq(page.clubId, clubId),
  });
}

export async function getPagesForManager(managerId: string) {
  const rows = await db
    .select({ page, club })
    .from(page)
    .innerJoin(club, eq(page.clubId, club.id))
    .where(eq(club.managerId, managerId));
  return rows.map((r) => ({ ...r.page, club: r.club }));
}

export async function getPageForCoach(userId: string) {
  return db.query.page.findFirst({
    where: eq(page.coachId, userId),
  });
}

export async function getUserForPageCreation(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
  });
}

export async function getClubPage(pageId: string) {
  return db.query.page.findFirst({
    where: and(eq(page.id, pageId), eq(page.published, true)),
    with: {
      sections: {
        with: {
          elements: true,
        },
      },
    },
  });
}

export async function getPublishedPagesForClub(clubId: string) {
  return db.query.page.findMany({
    where: and(eq(page.clubId, clubId), eq(page.published, true)),
  });
}

export async function getClubBasicInfo(clubId: string) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
  });
}

export async function getCoachPage(pageId: string) {
  return db.query.page.findFirst({
    where: and(
      eq(page.id, pageId),
      eq(page.target, "HOME"),
      eq(page.published, true),
    ),
    with: {
      sections: {
        with: {
          elements: true,
        },
      },
    },
  });
}

export async function getCoachUserForPage(coachUserId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, coachUserId),
    with: {
      pricing: { with: { features: true } },
      coachData: {
        with: {
          certifications: {
            with: {
              selectedModuleForCoach: {
                with: { module: true },
              },
            },
          },
          coachingPrices: { with: { coachingLevel: true } },
        },
      },
    },
  });
}

export async function getCoachDataForPage(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      pricing: { with: { features: true } },
      coachData: {
        with: {
          certifications: {
            with: {
              selectedModuleForCoach: {
                with: { module: true },
              },
            },
          },
          coachingPrices: { with: { coachingLevel: true } },
        },
      },
    },
  });
}

// ==================== PAGE MUTATIONS ====================

export async function createPage(data: {
  name: string;
  clubId?: string;
  coachId?: string;
  target: (typeof pageTargetEnum.enumValues)[number];
}) {
  return db.insert(page).values(data).returning();
}

export async function updatePage(data: {
  id: string;
  name?: string;
  target?: (typeof pageTargetEnum.enumValues)[number];
  userId?: string;
}) {
  return db
    .update(page)
    .set({
      name: data.name,
      target: data.target,
      coachId: data.userId,
    })
    .where(eq(page.id, data.id));
}

export async function updatePagePublication(
  pageId: string,
  published: boolean,
) {
  return db
    .update(page)
    .set({ published })
    .where(eq(page.id, pageId))
    .returning();
}

export async function deletePage(pageId: string) {
  return db.delete(page).where(eq(page.id, pageId));
}

// ==================== PAGE SECTION QUERIES ====================

export async function getPageSection(
  pageId: string,
  sectionModel: (typeof pageSectionModelEnum.enumValues)[number],
) {
  return db.query.pageSection.findFirst({
    where: and(
      eq(pageSection.pageId, pageId),
      eq(pageSection.model, sectionModel),
    ),
    with: {
      elements: true,
      page: { with: { club: true } },
    },
  });
}

export async function getPageSectionElements(
  pageId: string,
  sectionModel: (typeof pageSectionModelEnum.enumValues)[number],
) {
  const section = await db.query.pageSection.findFirst({
    where: and(
      eq(pageSection.pageId, pageId),
      eq(pageSection.model, sectionModel),
    ),
    with: {
      elements: true,
    },
  });
  return section?.elements ?? null;
}

// ==================== PAGE SECTION MUTATIONS ====================

export async function createPageSection(data: {
  model: (typeof pageSectionModelEnum.enumValues)[number];
  pageId: string;
  title?: string;
  subTitle?: string;
}) {
  return db.insert(pageSection).values(data).returning();
}

export async function updatePageSection(data: {
  id: string;
  model?: (typeof pageSectionModelEnum.enumValues)[number];
  pageId?: string;
  title?: string;
  subTitle?: string;
}) {
  return db
    .update(pageSection)
    .set(data)
    .where(eq(pageSection.id, data.id))
    .returning();
}

export async function deletePageSection(sectionId: string) {
  return db
    .delete(pageSection)
    .where(eq(pageSection.id, sectionId))
    .returning();
}

// ==================== PAGE SECTION ELEMENT QUERIES ====================

export async function getPageSectionElementById(id: string) {
  return db.query.pageSectionElement.findFirst({
    where: eq(pageSectionElement.id, id),
  });
}

// ==================== PAGE SECTION ELEMENT MUTATIONS ====================

export async function createPageSectionElement(data: {
  images?: string[];
  title?: string;
  subTitle?: string;
  elementType: (typeof pageSectionElementTypeEnum.enumValues)[number];
  content?: string;
  link?: string;
  pageId?: string;
  pageSection?: (typeof pageSectionModelEnum.enumValues)[number];
  sectionId: string;
  optionValue?: string;
}) {
  return db
    .insert(pageSectionElement)
    .values({
      content: data.content,
      elementType: data.elementType,
      link: data.link,
      pageId: data.pageId,
      pageSection: data.pageSection,
      title: data.title,
      subTitle: data.subTitle,
      sectionId: data.sectionId,
      optionValue: data.optionValue,
      imageUrls: data.images,
    })
    .returning();
}

export async function updatePageSectionElement(data: {
  id: string;
  images?: string[];
  title?: string;
  subTitle?: string;
  content?: string;
  link?: string;
  pageId?: string;
  pageSection?: (typeof pageSectionModelEnum.enumValues)[number];
  optionValue?: string;
}) {
  return db
    .update(pageSectionElement)
    .set({
      content: data.content,
      imageUrls: data.images,
      link: data.link,
      pageId: data.pageId,
      pageSection: data.pageSection,
      title: data.title,
      subTitle: data.subTitle,
      optionValue: data.optionValue,
    })
    .where(eq(pageSectionElement.id, data.id))
    .returning();
}

export async function deletePageSectionElement(id: string) {
  return db.delete(pageSectionElement).where(eq(pageSectionElement.id, id));
}

// ==================== PAGE STYLE ====================

export async function updatePageStyleForCoach(
  userId: string,
  pageStyle: string,
) {
  return db
    .update(userCoach)
    .set({ pageStyle })
    .where(eq(userCoach.userId, userId));
}

export async function updatePageStyleForClub(
  clubId: string,
  pageStyle: string,
) {
  return db.update(club).set({ pageStyle }).where(eq(club.id, clubId));
}

// ==================== PAGE CREATION WITH INITIAL SECTIONS ====================

export async function createPageWithInitialSection(
  pageName: string,
  coachId: string,
  userName: string | null,
) {
  return db.transaction(async (tx) => {
    const newPage = await tx
      .insert(page)
      .values({
        name: pageName,
        target: "HOME",
        coachId,
      })
      .returning();

    const newSection = await tx
      .insert(pageSection)
      .values({
        pageId: newPage[0].id,
        model: "HERO",
        title: userName,
        subTitle: userName,
      })
      .returning({ id: pageSection.id });

    await tx.insert(pageSectionElement).values({
      pageId: newPage[0].id,
      sectionId: newSection[0].id,
      elementType: "HERO_CONTENT",
      title: userName,
    });

    return newPage[0];
  });
}
