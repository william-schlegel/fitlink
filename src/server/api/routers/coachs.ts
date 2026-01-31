import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@/db";
import {
  createCertification as dalCreateCertification,
  createCoachOffer as dalCreateCoachOffer,
  createModule as dalCreateModule,
  createOrganism as dalCreateOrganism,
  deleteModule as dalDeleteModule,
  deleteOrganism as dalDeleteOrganism,
  // Coaching
  getCoachById as dalGetCoachById,
  getCoachsForClub as dalGetCoachsForClub,
  getOfferActivityByName as dalGetOfferActivityByName,
  updateCertification as dalUpdateCertification,
  updateCoachOffer as dalUpdateCoachOffer,
  updateModule as dalUpdateModule,
  updateOrganism as dalUpdateOrganism,
  deleteCertification,
  deleteCoachOffer,
  deleteModuleActivityGroups,
  deleteOrganismModuleLinks,
  deleteSelectedModulesForCertification,
  getAllCoaches,
  // Certifications
  getCertificationById,
  getCertificationOrganismById,
  getCertificationOrganisms,
  getCertificationsForCoach,
  getCoachData,
  getCoachHomePage,
  getCoachOffers,
  getCoachsFromDistance,
  getCoachWithCertifications,
  getModulesByIds,
  getOfferById,
  getOffersForCompanies,
  getOfferWithDetails,
  getSelectedModulesForCertifications,
  getSelectedModulesForCoach,
  getUserWithPricingForOffer,
  insertModuleActivityGroups,
  insertSelectedModulesForCoach,
  linkModuleToOrganism,
  updateActivitiesForModule,
} from "@/db/dal";
import { coachingLevelListEnum, coachingTargetEnum } from "@/db/schema/enums";
import { ZodActivityGroupId, ZodClubId, ZodUserId } from "@/db/types";
import { DEFAULT_RANGE, LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { calculateDistance } from "@/lib/distance";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { isCUID } from "@/lib/utils";
import { updateCertificationSchema, updateCoachOfferSchema } from "@/schemas";
import { isAdmin } from "@/server/lib/userTools";

const CertificationData = z.object({
  id: z.cuid2(),
  name: z.string(),
  obtainedIn: z.date(),
  documentUrl: z.string().optional(),
  coachUserId: ZodUserId,
  modules: z.array(z.cuid2()),
  activityGroups: z.array(ZodActivityGroupId),
});

const OfferData = z.object({
  userId: ZodUserId,
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
  getCoachById: protectedProcedure
    .input(z.object({ userId: ZodUserId }))
    .query(async ({ input }) => {
      const coach = await dalGetCoachById(input.userId);
      if (!coach) return null;

      const certifications = coach.coachData?.certifications ?? [];
      const certificationIds = certifications.map((c) => c.id);

      let selectedModules: Array<{
        certificationId: string;
        module: { id: string; name: string };
      }> = [];

      if (certificationIds.length > 0 && input.userId) {
        const modules = await getSelectedModulesForCoach(
          input.userId,
          certificationIds,
        );

        selectedModules = modules.map((sm) => ({
          certificationId: sm.certificationId,
          module: {
            id: sm.module.id,
            name: sm.module.name,
          },
        }));
      }

      const modulesByCertification = new Map<
        string,
        Array<{ id: string; name: string }>
      >();
      for (const sm of selectedModules) {
        if (!modulesByCertification.has(sm.certificationId)) {
          modulesByCertification.set(sm.certificationId, []);
        }
        modulesByCertification.get(sm.certificationId)!.push(sm.module);
      }

      const pages = await getCoachHomePage(coach?.id ?? "");
      const imageData = pages[0];
      const imgData = imageData?.sections?.[0]?.elements?.[0]?.imageUrls?.[0];
      const imageUrl = imgData ?? coach.image ?? "/images/dummy.jpg";

      const certificationModules = certifications.map((cert) => ({
        id: cert.id,
        name: cert.name,
        modules: modulesByCertification.get(cert.id) ?? [],
      }));

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
      const coachs = await getCoachsFromDistance(
        input.locationLng,
        input.locationLat,
        input.range,
      );
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
      return db.transaction(async (tx) => {
        const certif = await dalCreateCertification(
          {
            name: input.name,
            obtainedIn: input.obtainedIn,
            coachUserId: input.coachUserId,
            documentUrl: input.documentUrl,
          },
          tx,
        );

        const certifId = certif[0].id;

        if (input.modules.length) {
          const modules = await getModulesByIds(input.modules, tx);
          const byId = new Map(modules.map((m) => [m.id, m]));
          await insertSelectedModulesForCoach(
            input.modules
              .map((m) => byId.get(m))
              .filter(
                (m): m is { id: string; certificationOrganismId: string } =>
                  Boolean(m),
              )
              .map((m) => ({
                coachUserId: input.coachUserId,
                certificationId: certifId,
                certificationModuleId: m.id,
                certificationOrganismId: m.certificationOrganismId,
              })),
            tx,
          );
        }
        return certif;
      });
    }),

  updateCertification: protectedProcedure
    .input(updateCertificationSchema)
    .mutation(({ input }) =>
      db.transaction(async (tx) => {
        const certifId = input.id;
        if (!certifId || !isCUID(certifId))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid certification id",
          });
        const certif = await dalUpdateCertification(
          {
            id: certifId,
            name: input.name,
            obtainedIn: input.obtainedIn,
            coachUserId: input.coachUserId,
          },
          tx,
        );
        await deleteSelectedModulesForCertification(certifId, tx);
        if (input.modules?.length) {
          const modules = await getModulesByIds(input.modules, tx);
          const byId = new Map(modules.map((m) => [m.id, m]));
          await insertSelectedModulesForCoach(
            input.modules
              .map((m) => byId.get(m))
              .filter(
                (m): m is { id: string; certificationOrganismId: string } =>
                  Boolean(m),
              )
              .map((m) => ({
                coachUserId: input.coachUserId,
                certificationId: certifId,
                certificationModuleId: m.id,
                certificationOrganismId: m.certificationOrganismId,
              })),
            tx,
          );
        }

        return certif;
      }),
    ),

  deleteCertification: protectedProcedure
    .input(z.cuid2())
    .mutation(({ input }) => deleteCertification(input)),

  getAllCoachs: publicProcedure.query(() => getAllCoaches()),

  getCoachsForClub: publicProcedure
    .input(z.object({ clubId: ZodClubId }))
    .query(async ({ input }) => {
      const clb = await dalGetCoachsForClub(input.clubId);
      return (
        clb?.coaches.map(
          (c: { coach: { user: { id: string; name: string } } }) =>
            c.coach.user,
        ) ?? []
      );
    }),

  getCertificationsForCoach: protectedProcedure
    .input(z.object({ coachUserId: ZodUserId }))
    .query(async ({ input }) => {
      const coach = await getCoachWithCertifications(input.coachUserId);
      if (!coach) return null;

      const certifications = await getCertificationsForCoach(coach.userId);
      const certificationIds = certifications.map((c) => c.id);
      const selectedModules =
        certificationIds.length > 0
          ? await getSelectedModulesForCertifications(
              coach.userId,
              certificationIds,
            )
          : [];

      const selectedModulesGroups = new Map<string, typeof selectedModules>();
      for (const sm of selectedModules) {
        if (!selectedModulesGroups.has(sm.certificationId)) {
          selectedModulesGroups.set(sm.certificationId, []);
        }
        selectedModulesGroups.get(sm.certificationId)!.push(sm);
      }

      const certificationsWithModules = certifications.map((c) => {
        const modules = selectedModulesGroups.get(c.id) ?? [];
        return {
          ...c,
          modules: modules.map((cm) => cm.module),
          activityGroups: modules
            .flatMap((cm) =>
              cm.module.activityGroups.map((g) => g.activityGroup),
            )
            .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i),
        };
      });

      return {
        ...coach,
        certifications: certificationsWithModules,
      };
    }),

  getCertificationById: protectedProcedure
    .input(z.object({ certificationId: z.cuid2() }))
    .query(async ({ input }) => {
      const cert = await getCertificationById(input.certificationId);
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
    const organisms = await getCertificationOrganisms();

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
    .input(z.object({ certificationOrganismId: z.cuid2() }))
    .query(async ({ input }) => {
      const cg = await getCertificationOrganismById(
        input.certificationOrganismId,
      );
      if (!cg) return null;
      type CoachWithCount = {
        id: string;
        name: string;
        count: number;
      };
      const coaches = new Map<string, CoachWithCount>(
        cg.selectedModulesForCoach.reduce((acc, c) => {
          const userId = c.coach.user.id;
          if (acc.has(userId)) {
            const entry = acc.get(userId);
            entry.count += 1;
          } else {
            acc.set(userId, { ...c.coach.user, count: 1 });
          }
          return acc;
        }, new Map()),
      );

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
        coaches: Array.from(coaches.values()),
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
        const organism = await dalCreateOrganism(input.name, tx);
        const organismId = organism[0].id;
        for (const mod of input.modules) {
          const newModule = await dalCreateModule(
            {
              name: mod.name,
              certificationOrganismId: organismId,
            },
            tx,
          );
          const moduleId = newModule[0].id;
          await linkModuleToOrganism(organismId, moduleId, tx);
          if (mod.activityIds.length > 0) {
            await insertModuleActivityGroups(moduleId, mod.activityIds, tx);
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
        const organism = await dalUpdateOrganism(input.id, input.name, tx);
        await deleteOrganismModuleLinks(input.id, tx).catch(() => {
          console.error("error deleting organism-module links");
        });
        for (const mod of input.modules) {
          const newModule = await dalCreateModule(
            {
              name: mod.name,
              certificationOrganismId: input.id,
            },
            tx,
          );
          const moduleId = newModule[0].id;
          await linkModuleToOrganism(input.id, moduleId, tx);
          if (mod.activityIds.length > 0) {
            await insertModuleActivityGroups(moduleId, mod.activityIds, tx);
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
      updateActivitiesForModule(input.moduleId, input.activityIds),
    ),

  deleteOrganism: protectedProcedure
    .input(z.object({ organismId: z.cuid2() }))
    .mutation(async ({ input }) => {
      await isAdmin(true);
      return dalDeleteOrganism(input.organismId);
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
        const mod = await dalCreateModule(
          {
            name: input.name,
            certificationOrganismId: input.organismId,
          },
          tx,
        );
        await linkModuleToOrganism(input.organismId, mod[0].id, tx);
        if (input.activityIds.length) {
          await insertModuleActivityGroups(mod[0].id, input.activityIds, tx);
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
    .mutation(({ input }) => dalUpdateModule(input.id, input.name)),

  deleteModule: protectedProcedure
    .input(z.cuid2())
    .mutation(async ({ input }) => {
      await deleteModuleActivityGroups(input);
      return dalDeleteModule(input);
    }),

  getCoachData: protectedProcedure
    .input(z.object({ coachUserId: ZodUserId }))
    .query(({ input }) => getCoachData(input.coachUserId)),

  getOfferById: protectedProcedure
    .input(z.object({ offerId: z.cuid2() }))
    .query(({ input }) => getOfferById(input.offerId)),

  getOffersForCompanies: publicProcedure
    .input(
      z.object({
        locationLng: z.number().default(LONGITUDE),
        locationLat: z.number().default(LATITUDE),
        activityName: z.string().optional(),
        range: z.number().max(100).default(25),
        priceMin: z.number().min(0).default(0),
        priceMax: z.number().max(5000).default(1000),
      }),
    )
    .query(({ input }) =>
      getOffersForCompanies(
        input.locationLng,
        input.locationLat,
        input.range,
        input.priceMin,
        input.priceMax,
      ),
    ),

  getOfferWithDetails: publicProcedure
    .input(z.object({ offerId: z.cuid2() }))
    .query(async ({ input }) => {
      const offer = await getOfferWithDetails(input.offerId);
      const pageImage =
        offer?.coach.page?.sections?.[0]?.elements?.[0]?.imageUrls?.[0];
      const imageUrl =
        pageImage ?? offer?.coach.user.image ?? "/images/dummy.jpg";

      return { ...offer, imageUrl };
    }),

  getCoachOffers: protectedProcedure
    .input(z.object({ coachUserId: ZodUserId }))
    .query(({ input }) => getCoachOffers(input.coachUserId)),

  createCoachOffer: protectedProcedure
    .input(OfferData.omit({ id: true }))
    .mutation(async ({ input }) => {
      const u = await getUserWithPricingForOffer(input.userId);
      const pricingData = u?.pricing;
      const target = pricingData?.features.find(
        (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY",
      )
        ? input.target
        : "INDIVIDUAL";

      return dalCreateCoachOffer({ ...input, target });
    }),

  updateCoachOffer: protectedProcedure
    .input(updateCoachOfferSchema)
    .mutation(async ({ input }) => {
      const u = await getUserWithPricingForOffer(input.coachId);
      const pricingData = u?.pricing;
      const target = pricingData?.features.find(
        (f: { feature: string }) => f.feature === "COACH_OFFER_COMPANY",
      )
        ? (input.target ?? "INDIVIDUAL")
        : "INDIVIDUAL";

      return dalUpdateCoachOffer({
        ...input,
        target,
      });
    }),

  deleteCoachOffer: protectedProcedure
    .input(z.object({ offerId: z.cuid2() }))
    .mutation(({ input }) => deleteCoachOffer(input.offerId)),

  getOfferActivityByName: publicProcedure
    .input(z.object({ activityName: z.string() }))
    .query(async ({ input }) => {
      const coaches = await dalGetOfferActivityByName(input.activityName);

      const allActivities = new Set<string>();
      coaches.forEach((coach) => {
        if (coach.coachingActivities) {
          coach.coachingActivities.forEach((activity) => {
            if (
              activity.toLowerCase().includes(input.activityName.toLowerCase())
            ) {
              allActivities.add(activity);
            }
          });
        }
      });

      return Array.from(allActivities)
        .slice(0, 25)
        .map((name) => ({ id: name, name }));
    }),
});
