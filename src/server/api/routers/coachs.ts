import { LATITUDE, LONGITUDE, DEFAULT_RANGE } from "@/lib/defaultValues";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { db } from "@/db";
import { and, eq, gte, ilike, lte, or } from "drizzle-orm";
import { calculateBBox, calculateDistance } from "@/lib/distance";
import { getDocUrl } from "../../../../files";
import {
  certification,
  certificationActivityGroups,
  certificationCertificationModules,
  certificationGroup,
  certificationModule,
  certificationModuleActivityGroups,
  coachingPrice,
} from "@/db/schema/coach";
import { coachingLevelListEnum, coachingTargetEnum } from "@/db/schema/enums";
import { user } from "@/db/schema/auth";
import { page, pageSection, pageSectionElement } from "@/db/schema/page";
import { userCoach } from "@/db/schema/user";
import { club, coachingActivity } from "@/db/schema/club";
import { isCUID } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { isAdmin } from "@/server/lib/userTools";

const CertificationData = z.object({
  id: z.cuid2(),
  name: z.string(),
  obtainedIn: z.date(),
  documentId: z.cuid2().optional(),
  userId: z.cuid2(),
  modules: z.array(z.cuid2()),
  activityGroups: z.array(z.cuid2()),
});

const OfferData = z.object({
  coachId: z.cuid2(),
  id: z.cuid2(),
  name: z.string(),
  target: z.enum(coachingTargetEnum.enumValues),
  excludingTaxes: z.boolean(),
  description: z.string(),
  startDate: z.date(),
  physical: z.boolean().default(false),
  inHouse: z.boolean().default(false),
  myPlace: z.boolean().default(false),
  publicPlace: z.boolean().default(false),
  perHourPhysical: z.number().min(0),
  perDayPhysical: z.number().min(0),
  travelFee: z.number().min(0),
  travelLimit: z.number().min(0),
  webcam: z.boolean().default(false),
  perHourWebcam: z.number().min(0),
  perDayWebcam: z.number().min(0),
  freeHours: z.number().min(0),
  levels: z.array(z.enum(coachingLevelListEnum.enumValues)),
  packs: z.array(
    z.object({
      nbHours: z.number().min(0),
      packPrice: z.number().min(0),
    })
  ),
});

export async function getCoachsForClub(clubId: string) {
  if (!isCUID(clubId)) return [];
  const clb = await db.query.club.findFirst({
    where: eq(club.id, clubId),
    with: {
      coaches: {
        with: {
          coach: { with: { user: { columns: { id: true, name: true } } } },
        },
      },
    },
  });
  return (
    clb?.coaches.map(
      (c: { coach: { user: { id: string; name: string } } }) => c.coach.user
    ) ?? []
  );
}

export async function getCoachById(coachId: string) {
  if (!isCUID(coachId)) return null;
  const coach = await db.query.user.findFirst({
    where: eq(user.id, coachId),
    with: {
      coachData: {
        with: {
          activityGroups: {
            with: {
              activities: true,
            },
          },
          certifications: {
            with: {
              modules: true,
              document: true,
            },
          },
          clubs: true,
          page: { columns: { id: true } },
        },
      },
    },
  });
  if (!coach) return null;

  // Find the first page for the coach with target "HOME"
  const pages = await db.query.page.findMany({
    where: and(eq(page.coachId, coach?.id ?? ""), eq(page.target, "HOME")),
    with: {
      sections: {
        with: {
          elements: {
            with: {
              images: true,
            },
            where: eq(pageSectionElement.elementType, "HERO_CONTENT"),
          },
        },
        where: eq(pageSection.model, "HERO"),
      },
    },
    limit: 1,
  });

  const imageData = pages[0];
  const imgData = imageData?.sections?.[0]?.elements?.[0]?.images?.[0];
  let imageUrl = coach.image;
  if (imgData) {
    imageUrl = await getDocUrl(coachId, imgData.id);
  }
  return { ...coach, imageUrl: imageUrl ?? "/images/dummy.jpg" };
}

export async function getCertificationsForCoach(coachId: string) {
  if (!isCUID(coachId)) return null;
  return await db.query.userCoach.findFirst({
    where: eq(userCoach.userId, coachId),
    with: {
      certifications: {
        with: {
          modules: true,
          certificationActivityGroups: { with: { activityGroup: true } },
        },
      },
    },
  });
}

export async function getCertificationGroups() {
  return await db.query.certificationGroup.findMany({
    with: {
      modules: {
        with: {
          certificationModuleActivityGroups: { with: { activityGroup: true } },
        },
      },
    },
  });
}

export async function getCertificationGroupById(id: string) {
  if (!isCUID(id)) return null;
  return await db.query.certificationGroup.findFirst({
    where: eq(certificationGroup.id, id),
    with: {
      modules: true,
    },
  });
}

export const coachRouter = createTRPCRouter({
  getCoachById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => await getCoachById(input)),
  getCoachsFromDistance: publicProcedure
    .input(
      z.object({
        locationLng: z.number().default(LONGITUDE),
        locationLat: z.number().default(LATITUDE),
        range: z.number().max(100).default(DEFAULT_RANGE),
      })
    )
    .query(async ({ input }) => {
      const bbox = calculateBBox(
        input.locationLng,
        input.locationLat,
        input.range
      );
      const coachs = await db.query.userCoach.findMany({
        where: and(
          gte(userCoach.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
          lte(userCoach.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
          gte(userCoach.latitude, bbox?.[1]?.[1] ?? LATITUDE),
          lte(userCoach.latitude, bbox?.[0]?.[1] ?? LATITUDE)
        ),
        with: {
          page: true,
          certifications: true,
          coachingActivities: true,
        },
      });
      return coachs
        .map((c) => ({
          ...c,
          distance: calculateDistance(
            input.locationLng,
            input.locationLat,
            c.longitude ?? 0,
            c.latitude ?? 0
          ),
        }))
        .filter(
          (c) =>
            c.distance <= input.range &&
            c.distance <= (c.range ?? DEFAULT_RANGE)
        );
    }),
  createCertification: protectedProcedure
    .input(CertificationData.omit({ id: true }))
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const certif = await tx
          .insert(certification)
          .values({
            name: input.name,
            obtainedIn: input.obtainedIn,
            coachId: input.userId,
          })
          .returning();

        const certifId = certif[0].id;
        await tx.insert(certificationCertificationModules).values(
          input.modules.map((m) => ({
            certificationId: certifId,
            certificationModuleId: m,
          }))
        );
        await tx.insert(certificationActivityGroups).values(
          input.activityGroups.map((a) => ({
            certificationId: certifId,
            activityGroupId: a,
          }))
        );

        await tx.insert(certificationActivityGroups).values(
          input.activityGroups.map((a) => ({
            certificationId: certifId,
            activityGroupId: a,
          }))
        );

        // coach: {
        //   connect: {
        //     userId: input.userId,
        //   },
        // },

        if (input.documentId) {
          await tx
            .update(certification)
            .set({
              documentId: input.documentId,
            })
            .where(eq(certification.id, certifId));
        }
        return certif;
      });
    }),
  updateCertification: protectedProcedure
    .input(CertificationData.partial())
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const certifId = input.id;
        if (!certifId || !isCUID(certifId))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid certification id",
          });
        const certif = await tx
          .update(certification)
          .set({
            name: input.name,
            obtainedIn: input.obtainedIn,
            coachId: input.userId ?? undefined,
            // modules: input.modules
            //   ? {
            //       connect: input.modules.map((m) => ({ id: m })),
            //     }
            //   : undefined,
            // activityGroups: input.activityGroups
            //   ? {
            //       connect: input.activityGroups.map((a) => ({ id: a })),
            //     }
            //   : undefined,
          })
          .where(eq(certification.id, certifId))
          .returning();
        await tx
          .delete(certificationCertificationModules)
          .where(
            eq(certificationCertificationModules.certificationId, certifId)
          );
        await tx
          .delete(certificationActivityGroups)
          .where(eq(certificationActivityGroups.certificationId, certifId));
        if (input.modules?.length) {
          await tx.insert(certificationCertificationModules).values(
            input.modules.map((m) => ({
              certificationId: certifId,
              certificationModuleId: m,
            }))
          );
        }
        if (input.activityGroups?.length) {
          await tx.insert(certificationActivityGroups).values(
            input.activityGroups.map((a) => ({
              certificationId: certifId,
              activityGroupId: a,
            }))
          );
        }

        return certif;
      })
    ),
  deleteCertification: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) =>
      db.delete(certification).where(eq(certification.id, input))
    ),
  getAllCoachs: publicProcedure.query(() =>
    db.query.user.findMany({
      where: or(
        eq(user.internalRole, "COACH"),
        eq(user.internalRole, "MANAGER_COACH")
      ),
      with: {
        coachData: {
          with: {
            certifications: true,
            page: true,
          },
        },
      },
    })
  ),
  getCoachsForClub: publicProcedure
    .input(z.cuid2())
    .query(async ({ input }) => await getCoachsForClub(input)),

  getCertificationsForCoach: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => await getCertificationsForCoach(input)),

  getCertificationById: protectedProcedure.input(z.cuid2()).query(({ input }) =>
    db.query.certification.findFirst({
      where: eq(certification.id, input),
      with: {
        certificationActivityGroups: { with: { activityGroup: true } },
        modules: true,
      },
    })
  ),
  getCertificationGroups: protectedProcedure.query(
    async ({}) => await getCertificationGroups()
  ),
  getCertificationGroupById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => await getCertificationGroupById(input)),
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        modules: z.array(
          z.object({
            name: z.string(),
            activityIds: z.array(z.cuid2()),
          })
        ),
      })
    )
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const group = await tx
          .insert(certificationGroup)
          .values({
            name: input.name,
          })
          .returning();
        input.modules.forEach(async (mod) => {
          const newModule = await tx
            .insert(certificationModule)
            .values({
              name: mod.name,
              certificationGroupId: group[0].id,
            })
            .returning();
          if (mod.activityIds.length > 0) {
            await tx.insert(certificationModuleActivityGroups).values(
              mod.activityIds.map((id) => ({
                certificationModuleId: newModule[0].id,
                activityGroupId: id,
              }))
            );
          }
        });
        return group;
      })
    ),
  updateGroup: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
      })
    )
    .mutation(({ input }) =>
      db
        .update(certificationGroup)
        .set({
          name: input.name,
        })
        .where(eq(certificationGroup.id, input.id))
        .returning()
    ),

  updateActivitiesForModule: protectedProcedure
    .input(
      z.object({
        moduleId: z.cuid2(),
        activityIds: z.array(z.cuid2()),
      })
    )
    .mutation(({ input }) =>
      db
        .update(certificationModule)
        .set({
          // activityGroups: {
          //   connect: input.activityIds.map((a) => ({ id: a })),
          // },
        })
        .where(eq(certificationModule.id, input.moduleId))
        .returning()
    ),

  deleteGroup: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      await isAdmin(true);
      return db
        .delete(certificationGroup)
        .where(eq(certificationGroup.id, input))
        .returning();
    }),
  createModule: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        groupId: z.cuid2(),
        activityIds: z.array(z.cuid2()),
      })
    )
    .mutation(({ input }) =>
      db
        .insert(certificationModule)
        .values({
          name: input.name,
          certificationGroupId: input.groupId,
          // activityGroups: {
          //   connect: input.activityIds.map((id) => ({ id })),
          // },
        })
        .returning()
    ),
  updateModule: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
        activityIds: z.array(z.cuid2()),
      })
    )
    .mutation(({ input }) =>
      db
        .update(certificationModule)
        .set({
          name: input.name,
          // activityGroups: {
          //   connect: input.activityIds.map((id) => ({ id })),
          // },
        })
        .where(eq(certificationModule.id, input.id))
        .returning()
    ),

  deleteModule: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      return db
        .delete(certificationModule)
        .where(eq(certificationModule.id, input))
        .returning();
    }),
  getCoachData: protectedProcedure.input(z.cuid2()).query(({ input }) =>
    db.query.userCoach.findFirst({
      where: eq(userCoach.userId, input),
      with: {
        coachingActivities: true,
        coachingPrices: {
          with: {
            packs: true,
            coachingLevel: true,
          },
        },
      },
    })
  ),
  getOfferById: protectedProcedure.input(z.cuid2()).query(({ input }) =>
    db.query.coachingPrice.findFirst({
      where: eq(coachingPrice.id, input),
      with: {
        packs: true,
        coachingLevel: true,
      },
    })
  ),
  getOffersForCompanies: publicProcedure
    .input(
      z.object({
        locationLng: z.number().default(LONGITUDE),
        locationLat: z.number().default(LATITUDE),
        activityName: z.string().optional(),
        range: z.number().max(100).default(25),
        priceMin: z.number().min(0).default(0),
        priceMax: z.number().max(1000).default(1000),
      })
    )
    .query(({ input }) => {
      const bbox = calculateBBox(
        input.locationLng,
        input.locationLat,
        input.range
      );
      const uc = db
        .select()
        .from(userCoach)
        .where(
          and(
            gte(userCoach.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
            lte(userCoach.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
            gte(userCoach.latitude, bbox?.[1]?.[1] ?? LATITUDE),
            lte(userCoach.latitude, bbox?.[0]?.[1] ?? LATITUDE)
          )
        )
        .as("user_coaches");
      return db
        .select()
        .from(coachingPrice)
        .where(
          and(
            eq(coachingPrice.target, "COMPANY"),
            eq(coachingPrice.perHourPhysical, input.priceMin),
            eq(coachingPrice.perHourPhysical, input.priceMax)
          )
        )
        .leftJoin(uc, eq(coachingPrice.coachId, uc.userId));
      // userCoach: {
      //   coachingActivities: input?.activityName
      //     ? {
      //         some: { name: { contains: input.activityName } },
      //       }
      //     : undefined,
      //   AND: [
      //     { longitude: { gte: bbox?.[0]?.[0] ?? LONGITUDE } },
      //     { longitude: { lte: bbox?.[1]?.[0] ?? LONGITUDE } },
      //     { latitude: { gte: bbox?.[1]?.[1] ?? LATITUDE } },
      //     { latitude: { lte: bbox?.[0]?.[1] ?? LATITUDE } },
      //   ],
      // },
      // AND: [

      // ],
      // },
    }),
  getOfferWithDetails: publicProcedure
    .input(z.cuid2())
    .query(async ({ input }) => {
      const offer = await db.query.coachingPrice.findFirst({
        where: eq(coachingPrice.id, input),

        with: {
          coach: {
            with: {
              page: {
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
              },
              user: true,
              coachingActivities: true,
            },
          },
          coachingLevel: true,
          packs: true,
        },
      });
      const pageImage =
        offer?.coach.page?.sections?.[0]?.elements?.[0]?.images?.[0]?.id;
      let imageUrl = offer?.coach.user.image ?? "/images/dummy.jpg";
      if (pageImage) {
        const img = await getDocUrl(offer?.coach.user.id, pageImage);
        if (img) imageUrl = img;
      }
      return { ...offer, imageUrl };
    }),
  getCoachOffers: protectedProcedure.input(z.cuid2()).query(({ input }) =>
    db.query.coachingPrice.findMany({
      where: eq(coachingPrice.coachId, input),
      with: {
        coachingLevel: true,
      },
    })
  ),
  // createCoachOffer: protectedProcedure
  //   .input(OfferData.omit({ id: true }))
  //   .mutation(async ({ input }) => {
  //     const pricing = await db.query.pricing.findFirst({
  //       where: {
  //         users: {
  //           some: {
  //             id: input.coachId,
  //           },
  //         },
  //       },
  //       with: {
  //         features: true,
  //       },
  //     });
  //     const target = pricing?.features.find(
  //       (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY"
  //     )
  //       ? input.target
  //       : "INDIVIDUAL";
  //     return db.query.coachingPrice.create({
  //       data: {
  //         name: input.name,
  //         description: input.description,
  //         target,
  //         excludingTaxes: input.excludingTaxes,
  //         coachId: input.coachId,
  //         inHouse: input.inHouse,
  //         physical: input.physical,
  //         myPlace: input.myPlace,
  //         publicPlace: input.publicPlace,
  //         startDate: input.startDate,
  //         webcam: input.webcam,
  //         freeHours: input.freeHours,
  //         perDayPhysical: input.perDayPhysical,
  //         perDayWebcam: input.perDayWebcam,
  //         perHourPhysical: input.perHourPhysical,
  //         perHourWebcam: input.perHourWebcam,
  //         travelFee: input.travelFee,
  //         travelLimit: input.travelLimit,
  //         packs: {
  //           createMany: {
  //             data: input.packs.map((pack) => ({
  //               nbHours: pack.nbHours,
  //               packPrice: pack.packPrice,
  //             })),
  //           },
  //         },
  //         coachingLevel: {
  //           createMany: {
  //             data: input.levels.map((level) => ({
  //               level,
  //             })),
  //           },
  //         },
  //       },
  //     });
  //   }),
  // updateCoachOffer: protectedProcedure
  //   .input(OfferData.partial())
  //   .mutation(async ({ input }) => {
  //     const pricing = await db.query.pricing.findFirst({
  //       where: {
  //         users: {
  //           some: {
  //             id: input.coachId,
  //           },
  //         },
  //       },
  //       with: {
  //         features: true,
  //       },
  //     });
  //     const target = pricing?.features.find(
  //       (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY"
  //     )
  //       ? input.target ?? "INDIVIDUAL"
  //       : "INDIVIDUAL";
  //     await db.query.coachingPricePack.deleteMany({
  //       where: {
  //         coachingPriceId: input.id,
  //       },
  //     });
  //     await db.query.coachingLevel.deleteMany({
  //       where: {
  //         offerId: input.id,
  //       },
  //     });
  //     return db.query.coachingPrice.update({
  //       where: { id: input.id },
  //       data: {
  //         name: input.name,
  //         description: input.description,
  //         target,
  //         excludingTaxes: input.excludingTaxes,
  //         coachId: input.coachId,
  //         inHouse: input.inHouse,
  //         physical: input.physical,
  //         myPlace: input.myPlace,
  //         publicPlace: input.publicPlace,
  //         startDate: input.startDate,
  //         webcam: input.webcam,
  //         freeHours: input.freeHours,
  //         perDayPhysical: input.perDayPhysical,
  //         perDayWebcam: input.perDayWebcam,
  //         perHourPhysical: input.perHourPhysical,
  //         perHourWebcam: input.perHourWebcam,
  //         travelFee: input.travelFee,
  //         travelLimit: input.travelLimit,
  //         packs: {
  //           createMany: {
  //             data:
  //               input?.packs?.map((pack) => ({
  //                 nbHours: pack.nbHours,
  //                 packPrice: pack.packPrice,
  //               })) ?? [],
  //           },
  //         },
  //         coachingLevel: {
  //           createMany: {
  //             data:
  //               input?.levels?.map((level) => ({
  //                 level,
  //               })) ?? [],
  //           },
  //         },
  //       },
  //     });
  //   }),
  // deleteCoachOffer: protectedProcedure
  //   .input(z.cuid2())
  //   .mutation(({ input }) =>
  //     db.query.coachingPrice.delete({ where: { id: input } })
  //   ),
  getOfferActivityByName: publicProcedure.input(z.string()).query(({ input }) =>
    db
      .selectDistinctOn([coachingActivity.name])
      .from(coachingActivity)
      .where(ilike(coachingActivity.name, `%${input}%`))
      .limit(25)
  ),
});
