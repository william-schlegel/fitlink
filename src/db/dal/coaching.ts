import { and, eq, gte, inArray, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { club, site } from "@/db/schema/club";
import {
  coachingLevel,
  coachingPrice,
  coachingPricePack,
  selectedModuleForCoach,
} from "@/db/schema/coach";
import { coachingLevelListEnum, coachingTargetEnum } from "@/db/schema/enums";
import { page, pageSection, pageSectionElement } from "@/db/schema/page";
import { userCoach } from "@/db/schema/user";
import { DEFAULT_RANGE, LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { calculateBBox } from "@/lib/distance";

// ==================== COACH QUERIES ====================

export async function getCoachById(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      coachData: {
        with: {
          activityGroups: {
            with: {
              activities: true,
            },
          },
          certifications: true,
          clubs: true,
          page: { columns: { id: true } },
        },
      },
    },
  });
}

export async function getSelectedModulesForCoach(
  coachId: string,
  certificationIds: string[],
) {
  if (certificationIds.length === 0) return [];
  return db.query.selectedModuleForCoach.findMany({
    where: and(
      eq(selectedModuleForCoach.coachId, coachId),
      inArray(selectedModuleForCoach.certificationId, certificationIds),
    ),
    with: {
      module: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function getCoachHomePage(coachId: string) {
  return db.query.page.findMany({
    where: and(eq(page.coachId, coachId), eq(page.target, "HOME")),
    with: {
      sections: {
        with: {
          elements: {
            where: eq(pageSectionElement.elementType, "HERO_CONTENT"),
          },
        },
        where: eq(pageSection.model, "HERO"),
      },
    },
    limit: 1,
  });
}

export async function getCoachsFromDistance(
  locationLng: number = LONGITUDE,
  locationLat: number = LATITUDE,
  range: number = DEFAULT_RANGE,
) {
  const bbox = calculateBBox(locationLng, locationLat, range);
  return db.query.userCoach.findMany({
    where: and(
      gte(userCoach.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
      lte(userCoach.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
      gte(userCoach.latitude, bbox?.[1]?.[1] ?? LATITUDE),
      lte(userCoach.latitude, bbox?.[0]?.[1] ?? LATITUDE),
    ),
    with: {
      page: true,
      certifications: true,
    },
  });
}

export async function getAllCoaches() {
  return db.query.user.findMany({
    where: or(
      eq(user.internalRole, "COACH"),
      eq(user.internalRole, "MANAGER_COACH"),
    ),
    with: {
      coachData: {
        with: {
          certifications: true,
          page: true,
        },
      },
    },
  });
}

export async function getCoachsForClub(clubId: string) {
  return db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: {
      coaches: {
        with: {
          coach: { with: { user: { columns: { id: true, name: true } } } },
        },
      },
    },
  });
}

export async function getCoachData(userId: string) {
  return db.query.userCoach.findFirst({
    where: eq(userCoach.userId, userId),
    with: {
      coachingPrices: {
        with: {
          packs: true,
          coachingLevel: true,
        },
      },
    },
  });
}

// ==================== COACHING OFFERS ====================

export async function getOfferById(id: string) {
  return db.query.coachingPrice.findFirst({
    where: eq(coachingPrice.id, id),
    with: {
      packs: true,
      coachingLevel: true,
    },
  });
}

export async function getOfferWithDetails(id: string) {
  return db.query.coachingPrice.findFirst({
    where: eq(coachingPrice.id, id),
    with: {
      coach: {
        with: {
          page: {
            with: {
              sections: {
                with: {
                  elements: true,
                },
              },
            },
          },
          user: true,
        },
      },
      coachingLevel: true,
      packs: true,
    },
  });
}

export async function getCoachOffers(coachId: string) {
  return db.query.coachingPrice.findMany({
    where: eq(coachingPrice.coachId, coachId),
    with: {
      coachingLevel: true,
    },
  });
}

export async function getOffersForCompanies(
  locationLng: number,
  locationLat: number,
  range: number,
  priceMin: number,
  priceMax: number,
) {
  const bbox = calculateBBox(locationLng, locationLat, range);
  const uc = db
    .select()
    .from(userCoach)
    .where(
      and(
        gte(userCoach.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
        lte(userCoach.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
        gte(userCoach.latitude, bbox?.[1]?.[1] ?? LATITUDE),
        lte(userCoach.latitude, bbox?.[0]?.[1] ?? LATITUDE),
      ),
    )
    .as("user_coaches");

  return db
    .select()
    .from(coachingPrice)
    .where(
      and(
        eq(coachingPrice.target, "COMPANY"),
        gte(coachingPrice.perHourPhysical, priceMin),
        lte(coachingPrice.perHourPhysical, priceMax),
      ),
    )
    .leftJoin(uc, eq(coachingPrice.coachId, uc.userId));
}

export async function createCoachOffer(data: {
  coachId: string;
  name: string;
  target: (typeof coachingTargetEnum.enumValues)[number];
  excludingTaxes: boolean;
  description: string;
  startDate: Date;
  physical: boolean;
  inHouse: boolean;
  myPlace: boolean;
  publicPlace: boolean;
  perHourPhysical: number;
  perDayPhysical: number;
  travelFee: number;
  travelLimit: number;
  webcam: boolean;
  perHourWebcam: number;
  perDayWebcam: number;
  freeHours: number;
  packs: Array<{ nbHours: number; packPrice: number }>;
  levels: (typeof coachingLevelListEnum.enumValues)[number][];
}) {
  return db.transaction(async (tx) => {
    const [cp] = await tx
      .insert(coachingPrice)
      .values({
        name: data.name,
        description: data.description,
        target: data.target,
        excludingTaxes: data.excludingTaxes,
        coachId: data.coachId,
        inHouse: data.inHouse,
        physical: data.physical,
        myPlace: data.myPlace,
        publicPlace: data.publicPlace,
        startDate: data.startDate,
        webcam: data.webcam,
        freeHours: data.freeHours,
        perDayPhysical: data.perDayPhysical,
        perDayWebcam: data.perDayWebcam,
        perHourPhysical: data.perHourPhysical,
        perHourWebcam: data.perHourWebcam,
        travelFee: data.travelFee,
        travelLimit: data.travelLimit,
      })
      .returning();

    if (data.packs.length) {
      await tx.insert(coachingPricePack).values(
        data.packs.map((pack) => ({
          coachingPriceId: cp.id,
          nbHours: pack.nbHours,
          packPrice: pack.packPrice,
        })),
      );
    }

    if (data.levels.length) {
      await tx.insert(coachingLevel).values(
        data.levels.map((level) => ({
          level,
          offerId: cp.id,
        })),
      );
    }

    return cp;
  });
}

export async function updateCoachOffer(data: {
  id: string;
  coachId?: string;
  name?: string;
  target?: (typeof coachingTargetEnum.enumValues)[number];
  excludingTaxes?: boolean;
  description?: string;
  startDate?: Date;
  physical?: boolean;
  inHouse?: boolean;
  myPlace?: boolean;
  publicPlace?: boolean;
  perHourPhysical?: number;
  perDayPhysical?: number;
  travelFee?: number;
  travelLimit?: number;
  webcam?: boolean;
  perHourWebcam?: number;
  perDayWebcam?: number;
  freeHours?: number;
  packs?: Array<{ nbHours: number; packPrice: number }>;
  levels?: (typeof coachingLevelListEnum.enumValues)[number][];
}) {
  return db.transaction(async (tx) => {
    await tx
      .delete(coachingPricePack)
      .where(eq(coachingPricePack.coachingPriceId, data.id));
    await tx.delete(coachingLevel).where(eq(coachingLevel.offerId, data.id));

    const [cp] = await tx
      .update(coachingPrice)
      .set({
        name: data.name,
        description: data.description,
        target: data.target,
        excludingTaxes: data.excludingTaxes,
        coachId: data.coachId,
        inHouse: data.inHouse,
        physical: data.physical,
        myPlace: data.myPlace,
        publicPlace: data.publicPlace,
        startDate: data.startDate,
        webcam: data.webcam,
        freeHours: data.freeHours,
        perDayPhysical: data.perDayPhysical,
        perDayWebcam: data.perDayWebcam,
        perHourPhysical: data.perHourPhysical,
        perHourWebcam: data.perHourWebcam,
        travelFee: data.travelFee,
        travelLimit: data.travelLimit,
      })
      .where(eq(coachingPrice.id, data.id))
      .returning();

    if (data.packs?.length) {
      await tx.insert(coachingPricePack).values(
        data.packs.map((pack) => ({
          coachingPriceId: cp.id,
          nbHours: pack.nbHours,
          packPrice: pack.packPrice,
        })),
      );
    }

    if (data.levels?.length) {
      await tx.insert(coachingLevel).values(
        data.levels.map((level) => ({
          level,
          offerId: cp.id,
        })),
      );
    }

    return cp;
  });
}

export async function deleteCoachOffer(id: string) {
  return db.delete(coachingPrice).where(eq(coachingPrice.id, id));
}

// ==================== COACHING ACTIVITIES ====================

export async function getOfferActivityByName(name: string) {
  return db
    .select({
      coachingActivities: userCoach.coachingActivities,
    })
    .from(userCoach);
}

// ==================== USER PRICING FOR OFFER VALIDATION ====================

export async function getUserWithPricingForOffer(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      pricing: {
        with: { features: true },
      },
    },
  });
}

// ==================== ASSISTANT SEARCH FUNCTIONS ====================

const DEFAULT_ASSISTANT_RADIUS = 20;
const DEFAULT_ASSISTANT_LIMIT = 20;

export type AssistantSearchInput = {
  activity?: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
};

export async function searchCoachesByActivityAndLocation({
  activity,
  lat,
  lng,
  radiusKm = DEFAULT_ASSISTANT_RADIUS,
  limit = DEFAULT_ASSISTANT_LIMIT,
}: AssistantSearchInput) {
  const bbox = calculateBBox(lng, lat, radiusKm);

  const coaches = await db.query.userCoach.findMany({
    where: and(
      gte(userCoach.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
      lte(userCoach.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
      gte(userCoach.latitude, bbox?.[1]?.[1] ?? LATITUDE),
      lte(userCoach.latitude, bbox?.[0]?.[1] ?? LATITUDE),
      activity
        ? sql`array_to_string(${userCoach.coachingActivities}, ',') ILIKE ${"%" + activity + "%"}`
        : undefined,
    ),
    with: {
      page: true,
      certifications: true,
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    limit,
  });

  return coaches;
}

export async function searchClubsByActivityAndLocation({
  activity,
  lat,
  lng,
  radiusKm = DEFAULT_ASSISTANT_RADIUS,
  limit = DEFAULT_ASSISTANT_LIMIT,
}: AssistantSearchInput) {
  const bbox = calculateBBox(lng, lat, radiusKm);

  const sites = await db.query.site.findMany({
    where: and(
      gte(site.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
      lte(site.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
      gte(site.latitude, bbox?.[1]?.[1] ?? LATITUDE),
      lte(site.latitude, bbox?.[0]?.[1] ?? LATITUDE),
    ),
    with: {
      club: {
        with: {
          activities: {
            with: {
              group: true,
            },
          },
          pages: {
            columns: {
              id: true,
              published: true,
              target: true,
            },
          },
        },
      },
    },
    limit: limit * 2, // Fetch more to allow filtering
  });

  // Filter by activity if provided (case-insensitive partial match on activity or group name)
  let filtered = sites;
  if (activity) {
    const activityLower = activity.toLowerCase();
    filtered = sites.filter((s) =>
      s.club.activities.some(
        (a) =>
          a.name.toLowerCase().includes(activityLower) ||
          a.group.name.toLowerCase().includes(activityLower),
      ),
    );
  }

  return filtered.slice(0, limit);
}
