import { LATITUDE, LONGITUDE, DEFAULT_RANGE } from "@/lib/defaultValues";
import { RoomReservation } from "@prisma/client";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { db } from "@/db";
import { and, asc, eq, gte, lte, or } from "drizzle-orm";
import { calculateBBox, calculateDistance } from "@/lib/distance";
import { getDocUrl } from "./files";
import {
  certification,
  certificationGroup,
  coachingPrice,
} from "@/db/schema/coach";
import { coachingLevelListEnum, coachingTargetEnum } from "@/db/schema/enums";
import { user } from "@/db/schema/auth";
import { page, pageSection, pageSectionElement } from "@/db/schema/page";
import { userCoach } from "@/db/schema/user";
import { club } from "@/db/schema/club";

const CertificationData = z.object({
  id: z.cuid(),
  name: z.string(),
  obtainedIn: z.date(),
  documentId: z.cuid().optional(),
  userId: z.cuid(),
  modules: z.array(z.cuid()),
  activityGroups: z.array(z.cuid()),
});

const OfferData = z.object({
  coachId: z.cuid(),
  id: z.cuid(),
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

export const coachRouter = createTRPCRouter({
  getCoachById: protectedProcedure
    .input(z.cuid())
    .query(async ({ ctx, input }) => {
      const coach = await db.query.user.findFirst({
        where: eq(user.id, input),
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
      let imageUrl = coach?.image;
      if (imgData) {
        imageUrl = await getDocUrl(imgData.userId, imgData.id);
      }
      return { ...coach, imageUrl: imageUrl ?? "/images/dummy.jpg" };
    }),
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
  // createCertification: protectedProcedure
  //   .input(CertificationData.omit({ id: true }))
  //   .mutation(async ({ ctx, input }) => {
  //     const certif = await db.query.certification.create({
  //       data: {
  //         name: input.name,
  //         obtainedIn: input.obtainedIn,
  //         coach: {
  //           connect: {
  //             userId: input.userId,
  //           },
  //         },
  //         modules: {
  //           connect: input.modules.map((m) => ({ id: m })),
  //         },
  //         activityGroups: {
  //           connect: input.activityGroups.map((a) => ({ id: a })),
  //         },
  //       },
  //     });
  //     if (input.documentId) {
  //       await db.query.certification.update({
  //         where: { id: certif.id },
  //         data: {
  //           document: {
  //             connect: {
  //               id: input.documentId,
  //             },
  //           },
  //         },
  //       });
  //     }
  //     return certif;
  //   }),
  // updateCertification: protectedProcedure
  //   .input(CertificationData.partial())
  //   .mutation(({ ctx, input }) =>
  //     db.query.certification.update({
  //       where: { id: input.id },
  //       data: {
  //         name: input.name,
  //         obtainedIn: input.obtainedIn,
  //         coachId: input.userId,
  //         modules: input.modules
  //           ? {
  //               connect: input.modules.map((m) => ({ id: m })),
  //             }
  //           : undefined,
  //         activityGroups: input.activityGroups
  //           ? {
  //               connect: input.activityGroups.map((a) => ({ id: a })),
  //             }
  //           : undefined,
  //       },
  //     })
  //   ),
  // deleteCertification: protectedProcedure
  //   .input(z.string())
  //   .mutation(({ ctx, input }) =>
  //     db.query.certification.delete({ where: { id: input } })
  //   ),
  getAllCoachs: publicProcedure.query(() =>
    db.query.user.findMany({
      where: or(eq(user.role, "COACH"), eq(user.role, "MANAGER_COACH")),
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
  getCoachsForClub: publicProcedure.input(z.cuid()).query(async ({ input }) => {
    const clb = await db.query.club.findFirst({
      where: eq(club.id, input),
      with: {
        coachs: { with: { user: { columns: { id: true, name: true } } } },
      },
    });
    return (
      clb?.coachs.map((c: { user: { id: string; name: string } }) => c.user) ??
      []
    );
  }),

  getCertificationsForCoach: protectedProcedure
    .input(z.string())
    .query(({ input }) =>
      db.query.userCoach.findFirst({
        where: eq(userCoach.userId, input),
        with: {
          certifications: {
            with: {
              modules: true,
              activityGroups: true,
            },
          },
        },
      })
    ),
  getCertificationById: protectedProcedure.input(z.cuid()).query(({ input }) =>
    db.query.certification.findFirst({
      where: eq(certification.id, input),
      with: {
        activityGroups: true,
        modules: true,
      },
    })
  ),
  getCertificationGroups: protectedProcedure.query(({}) =>
    db.query.certificationGroup.findMany({
      with: { modules: { with: { activityGroups: true } } },
    })
  ),
  getCertificationGroupById: protectedProcedure
    .input(z.cuid())
    .query(({ input }) =>
      db.query.certificationGroup.findFirst({
        where: eq(certificationGroup.id, input),
        with: { modules: { with: { activityGroups: true } } },
      })
    ),
  // createGroup: protectedProcedure
  //   .input(
  //     z.object({
  //       name: z.string(),
  //       modules: z.array(
  //         z.object({
  //           name: z.string(),
  //           activityIds: z.array(z.cuid()),
  //         })
  //       ),
  //     })
  //   )
  //   .mutation(({ input }) =>
  //     db.query.$transaction(async (tx) => {
  //       const group = await tx.certificationGroup.create({
  //         data: {
  //           name: input.name,
  //         },
  //       });
  //       for (const mod of input.modules) {
  //         await tx.certificationModule.create({
  //           data: {
  //             name: mod.name,
  //             certificationGroupId: group.id,
  //             activityGroups: {
  //               connect: mod.activityIds.map((id) => ({ id })),
  //             },
  //           },
  //         });
  //       }
  //       return group;
  //     })
  //   ),
  // updateGroup: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.cuid(),
  //       name: z.string(),
  //     })
  //   )
  //   .mutation(({ ctx, input }) =>
  //     db.query.certificationGroup.update({
  //       where: { id: input.id },
  //       data: {
  //         name: input.name,
  //       },
  //     })
  //   ),
  // updateActivitiesForModule: protectedProcedure
  //   .input(
  //     z.object({
  //       moduleId: z.cuid(),
  //       activityIds: z.array(z.cuid()),
  //     })
  //   )
  //   .mutation(({ ctx, input }) =>
  //     db.query.certificationModule.update({
  //       where: { id: input.moduleId },
  //       data: {
  //         activityGroups: {
  //           connect: input.activityIds.map((a) => ({ id: a })),
  //         },
  //       },
  //     })
  //   ),

  // deleteGroup: protectedProcedure
  //   .input(z.cuid())
  //   .mutation(async ({ ctx, input }) => {
  //     if (ctx.session.user.role !== Role.ADMIN)
  //       throw new TRPCError({
  //         code: "UNAUTHORIZED",
  //         message: "You are not authorized to delete this group",
  //       });

  //     return db.query.certificationGroup.delete({
  //       where: { id: input },
  //     });
  //   }),
  // createModule: protectedProcedure
  //   .input(
  //     z.object({
  //       name: z.string(),
  //       groupId: z.cuid(),
  //       activityIds: z.array(z.cuid()),
  //     })
  //   )
  //   .mutation(({ ctx, input }) =>
  //     db.query.certificationModule.create({
  //       data: {
  //         name: input.name,
  //         certificationGroupId: input.groupId,
  //         activityGroups: {
  //           connect: input.activityIds.map((id) => ({ id })),
  //         },
  //       },
  //     })
  //   ),
  // updateModule: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.cuid(),
  //       name: z.string(),
  //       activityIds: z.array(z.cuid()),
  //     })
  //   )
  //   .mutation(({ ctx, input }) =>
  //     db.query.certificationModule.update({
  //       where: { id: input.id },
  //       data: {
  //         name: input.name,
  //         activityGroups: {
  //           connect: input.activityIds.map((id) => ({ id })),
  //         },
  //       },
  //     })
  //   ),
  // deleteModule: protectedProcedure
  //   .input(z.cuid())
  //   .mutation(async ({ ctx, input }) => {
  //     return db.query.certificationModule.delete({
  //       where: { id: input },
  //     });
  //   }),
  getCoachData: protectedProcedure.input(z.cuid()).query(({ input }) =>
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
  getOfferById: protectedProcedure.input(z.cuid()).query(({ input }) =>
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
      return db.query.coachingPrice.findMany({
        where: {
          target: "COMPANY",
          coach: {
            coachingActivities: input?.activityName
              ? {
                  some: { name: { contains: input.activityName } },
                }
              : undefined,
            AND: [
              { longitude: { gte: bbox?.[0]?.[0] ?? LONGITUDE } },
              { longitude: { lte: bbox?.[1]?.[0] ?? LONGITUDE } },
              { latitude: { gte: bbox?.[1]?.[1] ?? LATITUDE } },
              { latitude: { lte: bbox?.[0]?.[1] ?? LATITUDE } },
            ],
          },
          AND: [
            { perHourPhysical: { gte: input.priceMin } },
            { perHourPhysical: { lte: input.priceMax } },
          ],
        },
      });
    }),
  getOfferWithDetails: publicProcedure
    .input(z.cuid())
    .query(async ({ input }) => {
      const offer = await db.query.coachingPrice.findFirst({
        where: {
          id: input,
        },
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
  getCoachOffers: protectedProcedure.input(z.cuid()).query(({ input }) =>
    db.query.coachingPrice.findMany({
      where: { coachId: input },
      with: {
        coachingLevel: true,
      },
    })
  ),
  createCoachOffer: protectedProcedure
    .input(OfferData.omit({ id: true }))
    .mutation(async ({ input }) => {
      const pricing = await db.query.pricing.findFirst({
        where: {
          users: {
            some: {
              id: input.coachId,
            },
          },
        },
        with: {
          features: true,
        },
      });
      const target = pricing?.features.find(
        (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY"
      )
        ? input.target
        : "INDIVIDUAL";
      return db.query.coachingPrice.create({
        data: {
          name: input.name,
          description: input.description,
          target,
          excludingTaxes: input.excludingTaxes,
          coachId: input.coachId,
          inHouse: input.inHouse,
          physical: input.physical,
          myPlace: input.myPlace,
          publicPlace: input.publicPlace,
          startDate: input.startDate,
          webcam: input.webcam,
          freeHours: input.freeHours,
          perDayPhysical: input.perDayPhysical,
          perDayWebcam: input.perDayWebcam,
          perHourPhysical: input.perHourPhysical,
          perHourWebcam: input.perHourWebcam,
          travelFee: input.travelFee,
          travelLimit: input.travelLimit,
          packs: {
            createMany: {
              data: input.packs.map((pack) => ({
                nbHours: pack.nbHours,
                packPrice: pack.packPrice,
              })),
            },
          },
          coachingLevel: {
            createMany: {
              data: input.levels.map((level) => ({
                level,
              })),
            },
          },
        },
      });
    }),
  updateCoachOffer: protectedProcedure
    .input(OfferData.partial())
    .mutation(async ({ input }) => {
      const pricing = await db.query.pricing.findFirst({
        where: {
          users: {
            some: {
              id: input.coachId,
            },
          },
        },
        with: {
          features: true,
        },
      });
      const target = pricing?.features.find(
        (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY"
      )
        ? input.target ?? "INDIVIDUAL"
        : "INDIVIDUAL";
      await db.query.coachingPricePack.deleteMany({
        where: {
          coachingPriceId: input.id,
        },
      });
      await db.query.coachingLevel.deleteMany({
        where: {
          offerId: input.id,
        },
      });
      return db.query.coachingPrice.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          target,
          excludingTaxes: input.excludingTaxes,
          coachId: input.coachId,
          inHouse: input.inHouse,
          physical: input.physical,
          myPlace: input.myPlace,
          publicPlace: input.publicPlace,
          startDate: input.startDate,
          webcam: input.webcam,
          freeHours: input.freeHours,
          perDayPhysical: input.perDayPhysical,
          perDayWebcam: input.perDayWebcam,
          perHourPhysical: input.perHourPhysical,
          perHourWebcam: input.perHourWebcam,
          travelFee: input.travelFee,
          travelLimit: input.travelLimit,
          packs: {
            createMany: {
              data:
                input?.packs?.map((pack) => ({
                  nbHours: pack.nbHours,
                  packPrice: pack.packPrice,
                })) ?? [],
            },
          },
          coachingLevel: {
            createMany: {
              data:
                input?.levels?.map((level) => ({
                  level,
                })) ?? [],
            },
          },
        },
      });
    }),
  deleteCoachOffer: protectedProcedure
    .input(z.cuid())
    .mutation(({ input }) =>
      db.query.coachingPrice.delete({ where: { id: input } })
    ),
  getOfferActivityByName: publicProcedure.input(z.string()).query(({ input }) =>
    db.query.coachingActivity.findMany({
      where: { name: { contains: input } },
      take: 25,
      distinct: "name",
    })
  ),
});
