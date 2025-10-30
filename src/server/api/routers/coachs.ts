import { and, eq, gte, ilike, lte, or, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  coachCertification,
  selectedModuleForCoach,
  certificationOrganism,
  certificationModule,
  certificationModuleActivityGroups,
  certificationOrganismModules,
  coachingLevel,
  coachingPrice,
  coachingPricePack,
} from "@/db/schema/coach";
import {
  coachingLevelListEnum,
  CoachingTargetEnum,
  coachingTargetEnum,
} from "@/db/schema/enums";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { LATITUDE, LONGITUDE, DEFAULT_RANGE } from "@/lib/defaultValues";
import { page, pageSection, pageSectionElement } from "@/db/schema/page";
import { calculateBBox, calculateDistance } from "@/lib/distance";
import { club, coachingActivity } from "@/db/schema/club";
import { isAdmin } from "@/server/lib/userTools";
import { userCoach } from "@/db/schema/user";
import { user } from "@/db/schema/auth";
import { isCUID } from "@/lib/utils";
import { getDocUrl } from "./files";
import { db } from "@/db";

const CertificationData = z.object({
  id: z.cuid2(),
  name: z.string(),
  obtainedIn: z.date(),
  documentUrl: z.string().optional(),
  userId: z.string(),
  modules: z.array(z.cuid2()),
  activityGroups: z.array(z.cuid2()),
});

const OfferData = z.object({
  coachId: z.string(),
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
    }),
  ),
});

export const coachRouter = createTRPCRouter({
  getCoachById: protectedProcedure.input(z.cuid2()).query(async ({ input }) => {
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
                activityGroups: true,
                selectedModuleForCoach: {
                  with: {
                    module: true,
                  },
                },
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
      imageUrl = await getDocUrl(input, imgData.id);
    }
    const certificationModules = coach.coachData?.certifications?.map(
      (cert) => ({
        id: cert.id,
        name: cert.name,
        modules: cert.selectedModuleForCoach.flatMap((mod) => ({
          id: mod.module.id,
          name: mod.module.name,
        })),
      }),
    );

    return {
      ...coach,
      certificationModules,
      imageUrl: imageUrl ?? "/images/dummy.jpg",
    };
  }),
  getCoachsFromDistance: publicProcedure
    .input(
      z.object({
        locationLng: z.number().default(LONGITUDE),
        locationLat: z.number().default(LATITUDE),
        range: z.number().max(100).default(DEFAULT_RANGE),
      }),
    )
    .query(async ({ input }) => {
      const bbox = calculateBBox(
        input.locationLng,
        input.locationLat,
        input.range,
      );
      const coachs = await db.query.userCoach.findMany({
        where: and(
          gte(userCoach.longitude, bbox?.[0]?.[0] ?? LONGITUDE),
          lte(userCoach.longitude, bbox?.[1]?.[0] ?? LONGITUDE),
          gte(userCoach.latitude, bbox?.[1]?.[1] ?? LATITUDE),
          lte(userCoach.latitude, bbox?.[0]?.[1] ?? LATITUDE),
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
            c.latitude ?? 0,
          ),
        }))
        .filter(
          (c) =>
            c.distance <= input.range &&
            c.distance <= (c.range ?? DEFAULT_RANGE),
        );
    }),
  createCertification: protectedProcedure
    .input(CertificationData.omit({ id: true }))
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const certif = await tx
          .insert(coachCertification)
          .values({
            name: input.name,
            obtainedIn: input.obtainedIn,
            coachId: input.userId,
            documentUrl: input.documentUrl,
          })
          .returning();

        const certifId = certif[0].id;

        if (input.modules.length) {
          const coach = await tx.query.userCoach.findFirst({
            where: eq(userCoach.userId, input.userId),
            columns: { id: true },
          });
          const modules = await tx.query.certificationModule.findMany({
            where: inArray(certificationModule.id, input.modules),
            columns: { id: true, certificationOrganismId: true },
          });
          const byId = new Map(modules.map((m) => [m.id, m]));
          await tx.insert(selectedModuleForCoach).values(
            input.modules
              .map((m) => byId.get(m))
              .filter(
                (m): m is { id: string; certificationOrganismId: string } =>
                  Boolean(m),
              )
              .map((m) => ({
                coachId: coach?.id ?? "",
                certificationId: certifId,
                certificationModuleId: m.id,
                certificationOrganismId: m.certificationOrganismId,
              })),
          );
        }

        // coach: {
        //   connect: {
        //     userId: input.userId,
        //   },
        // },

        // if (input.documentId) {
        //   await tx
        //     .update(coachCertification)
        //     .set({
        //       documentId: input.documentId,
        //     })
        //     .where(eq(coachCertification.id, certifId));
        // }
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
          .update(coachCertification)
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
          .where(eq(coachCertification.id, certifId))
          .returning();
        await tx
          .delete(selectedModuleForCoach)
          .where(eq(selectedModuleForCoach.certificationId, certifId));
        if (input.modules?.length) {
          const coach = await tx.query.userCoach.findFirst({
            where: eq(userCoach.userId, input.userId ?? ""),
            columns: { id: true },
          });
          const modules = await tx.query.certificationModule.findMany({
            where: inArray(certificationModule.id, input.modules),
            columns: { id: true, certificationOrganismId: true },
          });
          const byId = new Map(modules.map((m) => [m.id, m]));
          await tx.insert(selectedModuleForCoach).values(
            input.modules
              .map((m) => byId.get(m))
              .filter(
                (m): m is { id: string; certificationOrganismId: string } =>
                  Boolean(m),
              )
              .map((m) => ({
                coachId: coach?.id ?? "",
                certificationId: certifId,
                certificationModuleId: m.id,
                certificationOrganismId: m.certificationOrganismId,
              })),
          );
        }

        return certif;
      }),
    ),
  deleteCertification: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) =>
      db.delete(coachCertification).where(eq(coachCertification.id, input)),
    ),
  getAllCoachs: publicProcedure.query(() =>
    db.query.user.findMany({
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
    }),
  ),
  getCoachsForClub: publicProcedure
    .input(z.cuid2())
    .query(async ({ input }) => {
      const clb = await db.query.club.findFirst({
        where: eq(club.id, input),
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
          (c: { coach: { user: { id: string; name: string } } }) =>
            c.coach.user,
        ) ?? []
      );
    }),

  getCertificationsForCoach: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const coach = await db.query.userCoach.findFirst({
        where: eq(userCoach.userId, input),
        columns: {
          id: true,
          userId: true,
          publicName: true,
          description: true,
          aboutMe: true,
          searchAddress: true,
          latitude: true,
          longitude: true,
          range: true,
          facebookLink: true,
          twitterLink: true,
          youtubeLink: true,
          instagramLink: true,
          rating: true,
          pageStyle: true,
        },
      });
      if (!coach) return null;

      const certifications = await db.query.coachCertification.findMany({
        where: eq(coachCertification.coachId, input),
        with: {
          selectedModuleForCoach: {
            with: {
              module: {
                with: {
                  activityGroups: {
                    with: { activityGroup: true },
                  },
                },
              },
            },
          },
        },
      });

      const certificationsWithModules = certifications.map((c) => ({
        ...c,
        modules: (c.selectedModuleForCoach ?? []).map((cm) => cm.module),
        activityGroups: (c.selectedModuleForCoach ?? [])
          .flatMap((cm) => cm.module.activityGroups.map((g) => g.activityGroup))
          .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i),
      }));

      return {
        ...coach,
        certifications: certificationsWithModules,
      };
    }),

  getCertificationById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => {
      const cert = await db.query.coachCertification.findFirst({
        where: eq(coachCertification.id, input),
        with: {
          selectedModuleForCoach: {
            with: {
              module: {
                with: {
                  activityGroups: {
                    with: { activityGroup: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!cert) return cert;
      return {
        ...cert,
        modules: (cert.selectedModuleForCoach ?? []).map((cm) => cm.module),
        activityGroups: (
          cert.selectedModuleForCoach?.flatMap((cm) =>
            cm.module.activityGroups.map((g) => g.activityGroup),
          ) ?? []
        ).filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i),
      };
    }),
  getCertificationOrganisms: protectedProcedure.query(async () => {
    const organisms = await db.query.certificationOrganism.findMany({
      with: {
        modules: {
          with: {
            module: {
              with: {
                activityGroups: {
                  with: { activityGroup: true },
                },
              },
            },
          },
        },
      },
    });
    // const organisms = await db.select()
    // .from(certificationOrganism)
    // .leftJoin(certificationModule,
    //   eq(certificationOrganism.id,
    //     certificationModule.certificationOrganismId))
    //     .leftJoin(certificationModuleActivityGroups, eq(certificationModule.id, certificationModuleActivityGroups.certificationModuleId))
    //     .leftJoin(activityGroup, eq(certificationModuleActivityGroups.activityGroupId, activityGroup.id))

    return organisms.map((organism) => ({
      id: organism.id,
      name: organism.name,
      modules: organism.modules.map((link) => ({
        id: link.module.id,
        name: link.module.name,
        activities: link.module.activityGroups.map((g) => ({
          id: g.activityGroup.id,
          name: g.activityGroup.name,
        })),
      })),
    }));
  }),
  getCertificationOrganismById: protectedProcedure
    .input(z.cuid2())
    .query(async ({ input }) => {
      const cg = await db.query.certificationOrganism.findFirst({
        where: eq(certificationOrganism.id, input),
        with: {
          modules: {
            with: {
              module: {
                with: {
                  activityGroups: {
                    with: { activityGroup: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!cg) return null;
      return {
        id: cg.id,
        name: cg.name,
        modules: cg.modules.map((link) => ({
          id: link.module.id,
          name: link.module.name,
          activities: link.module.activityGroups.map((g) => ({
            id: g.activityGroup.id,
            name: g.activityGroup.name,
          })),
        })),
      };
    }),
  createOrganism: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        modules: z.array(
          z.object({
            name: z.string(),
            activityIds: z.array(z.cuid2()),
          }),
        ),
      }),
    )
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const organism = await tx
          .insert(certificationOrganism)
          .values({
            name: input.name,
          })
          .returning();
        const organismId = organism[0].id;
        for (const mod of input.modules) {
          const [newModule] = await tx
            .insert(certificationModule)
            .values({
              name: mod.name,
              certificationOrganismId: organismId,
            })
            .returning();
          const moduleId = newModule.id;
          await tx.insert(certificationOrganismModules).values({
            certificationOrganismId: organismId,
            certificationModuleId: moduleId,
          });
          if (mod.activityIds.length > 0) {
            await tx.insert(certificationModuleActivityGroups).values(
              mod.activityIds.map((id) => ({
                certificationModuleId: moduleId,
                activityGroupId: id,
              })),
            );
          }
        }
        return organism;
      }),
    ),
  updateOrganism: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
        modules: z.array(
          z.object({
            name: z.string(),
            activityIds: z.array(z.cuid2()),
          }),
        ),
      }),
    )
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const organism = await tx
          .update(certificationOrganism)
          .set({
            name: input.name,
          })
          .where(eq(certificationOrganism.id, input.id))
          .returning();
        // Remove existing module links for this organism
        await tx
          .delete(certificationOrganismModules)
          .where(
            eq(certificationOrganismModules.certificationOrganismId, input.id),
          )
          .catch(() => {
            console.error("error deleting organism-module links");
          });
        // Recreate modules and links
        for (const mod of input.modules) {
          const [newModule] = await tx
            .insert(certificationModule)
            .values({
              name: mod.name,
              certificationOrganismId: input.id,
            })
            .returning();
          const moduleId = newModule.id;
          await tx.insert(certificationOrganismModules).values({
            certificationOrganismId: input.id,
            certificationModuleId: moduleId,
          });
          if (mod.activityIds.length > 0) {
            await tx.insert(certificationModuleActivityGroups).values(
              mod.activityIds.map((id) => ({
                certificationModuleId: moduleId,
                activityGroupId: id,
              })),
            );
          }
        }
        return organism;
      }),
    ),

  updateActivitiesForModule: protectedProcedure
    .input(
      z.object({
        moduleId: z.cuid2(),
        activityIds: z.array(z.cuid2()),
      }),
    )
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        await tx
          .delete(certificationModuleActivityGroups)
          .where(
            eq(
              certificationModuleActivityGroups.certificationModuleId,
              input.moduleId,
            ),
          );
        await tx.insert(certificationModuleActivityGroups).values(
          input.activityIds.map((id) => ({
            certificationModuleId: input.moduleId,
            activityGroupId: id,
          })),
        );
      }),
    ),

  deleteOrganism: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      await isAdmin(true);
      return db
        .delete(certificationOrganism)
        .where(eq(certificationOrganism.id, input))
        .returning();
    }),
  createModule: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        organismId: z.cuid2(),
        activityIds: z.array(z.cuid2()),
      }),
    )
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const [mod] = await tx
          .insert(certificationModule)
          .values({
            name: input.name,
            certificationOrganismId: input.organismId,
          })
          .returning();
        await tx.insert(certificationOrganismModules).values({
          certificationOrganismId: input.organismId,
          certificationModuleId: mod.id,
        });
        if (input.activityIds.length) {
          await tx.insert(certificationModuleActivityGroups).values(
            input.activityIds.map((id) => ({
              certificationModuleId: mod.id,
              activityGroupId: id,
            })),
          );
        }
        return mod;
      }),
    ),
  updateModule: protectedProcedure
    .input(
      z.object({
        id: z.cuid2(),
        name: z.string(),
        activityIds: z.array(z.cuid2()),
      }),
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
        .returning(),
    ),

  deleteModule: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      db.transaction(async (tx) => {
        await tx
          .delete(certificationModuleActivityGroups)
          .where(
            eq(certificationModuleActivityGroups.certificationModuleId, input),
          );
        return tx
          .delete(certificationModule)
          .where(eq(certificationModule.id, input))
          .returning();
      });
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
    }),
  ),
  getOfferById: protectedProcedure.input(z.cuid2()).query(({ input }) =>
    db.query.coachingPrice.findFirst({
      where: eq(coachingPrice.id, input),
      with: {
        packs: true,
        coachingLevel: true,
      },
    }),
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
      }),
    )
    .query(async ({ input }) => {
      const bbox = calculateBBox(
        input.locationLng,
        input.locationLat,
        input.range,
      );
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
      const cp = await db
        .select()
        .from(coachingPrice)
        .where(
          and(
            eq(coachingPrice.target, "COMPANY"),
            eq(coachingPrice.perHourPhysical, input.priceMin),
            eq(coachingPrice.perHourPhysical, input.priceMax),
          ),
        )
        .leftJoin(uc, eq(coachingPrice.coachId, uc.userId));
      return cp;
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
  getCoachOffers: protectedProcedure.input(z.string()).query(({ input }) =>
    db.query.coachingPrice.findMany({
      where: eq(coachingPrice.coachId, input),
      with: {
        coachingLevel: true,
      },
    }),
  ),
  createCoachOffer: protectedProcedure
    .input(OfferData.omit({ id: true }))
    .mutation(async ({ input }) => {
      const u = await db.query.user.findFirst({
        where: eq(user.id, input.coachId),
        with: {
          pricing: {
            with: { features: true },
          },
        },
      });
      console.log("u", u);

      const pricingData = u?.pricing;
      const target: CoachingTargetEnum = pricingData?.features.find(
        (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY",
      )
        ? input.target
        : "INDIVIDUAL";

      console.log("input", input);
      return db.transaction(async (tx) => {
        const [cp] = await tx
          .insert(coachingPrice)
          .values({
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
          })
          .returning();
        console.log("cp", cp);
        if (input.packs.length)
          await tx.insert(coachingPricePack).values(
            input.packs.map((pack) => ({
              coachingPriceId: cp.id,
              nbHours: pack.nbHours,
              packPrice: pack.packPrice,
            })),
          );
        if (input.levels.length)
          await tx.insert(coachingLevel).values(
            input.levels.map((level) => ({
              level,
              offerId: cp.id,
            })),
          );
        return coachingPrice;
      });
    }),
  updateCoachOffer: protectedProcedure
    .input(OfferData.partial())
    .mutation(async ({ input }) => {
      const u = await db.query.user.findFirst({
        where: eq(user.id, input.coachId ?? ""),
        with: {
          pricing: {
            with: { features: true },
          },
        },
      });

      const pricingData = u?.pricing;
      const target = pricingData?.features.find(
        (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY",
      )
        ? (input.target ?? "INDIVIDUAL")
        : "INDIVIDUAL";
      return db.transaction(async (tx) => {
        await tx
          .delete(coachingPricePack)
          .where(eq(coachingPricePack.coachingPriceId, input.id ?? ""));
        await tx
          .delete(coachingLevel)
          .where(eq(coachingLevel.offerId, input.id ?? ""));
        const [cp] = await tx
          .update(coachingPrice)
          .set({
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
          })
          .where(eq(coachingPrice.id, input.id ?? ""))
          .returning();
        if (input.packs?.length)
          await tx.insert(coachingPricePack).values(
            input.packs?.map((pack) => ({
              coachingPriceId: cp.id,
              nbHours: pack.nbHours,
              packPrice: pack.packPrice,
            })) ?? [],
          );
        if (input.levels?.length)
          await tx.insert(coachingLevel).values(
            input.levels?.map((level) => ({
              level,
              offerId: cp.id,
            })) ?? [],
          );
        return cp;
      });
    }),

  deleteCoachOffer: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) =>
      db.delete(coachingPrice).where(eq(coachingPrice.id, input)),
    ),
  getOfferActivityByName: publicProcedure.input(z.string()).query(({ input }) =>
    db
      .selectDistinctOn([coachingActivity.name])
      .from(coachingActivity)
      .where(ilike(coachingActivity.name, `%${input}%`))
      .limit(25),
  ),
});
