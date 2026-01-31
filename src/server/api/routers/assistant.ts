import { z } from "zod";

import {
  getOffersForCompanies,
  searchClubsByActivityAndLocation,
  searchCoachesByActivityAndLocation,
} from "@/db/dal/coaching";
import { ZodActivityId } from "@/db/types";
import { env } from "@/env";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { calculateDistance } from "@/lib/distance";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/server";

// Default search parameters
const DEFAULT_RADIUS_KM = 20;
const DEFAULT_COMPANY_RADIUS_KM = 25;
const DEFAULT_LIMIT = 20;

// Input schema for search procedures
const searchInputSchema = z.object({
  activity: ZodActivityId.optional(),
  lat: z.number().default(LATITUDE),
  lng: z.number().default(LONGITUDE),
  radiusKm: z.number().min(1).max(100).default(DEFAULT_RADIUS_KM),
  limit: z.number().min(1).max(50).default(DEFAULT_LIMIT),
});

// Input schema for location resolution
const locationInputSchema = z.object({
  address: z.string().min(1),
});

// Input schema for company offers search
const companyOffersInputSchema = z.object({
  activity: ZodActivityId.optional(),
  lat: z.number().default(LATITUDE),
  lng: z.number().default(LONGITUDE),
  radiusKm: z.number().min(1).max(100).default(DEFAULT_COMPANY_RADIUS_KM),
  priceMin: z.number().min(0).default(0),
  priceMax: z.number().max(5000).default(1000),
});

// MapQuest geocoding response type
type MapQuestLocation = {
  street: string;
  postalCode: string;
  adminArea5: string;
  adminArea3: string;
  adminArea1: string;
  latLng: { lat: number; lng: number };
};

type MapQuestResponse = {
  results?: Array<{
    locations?: MapQuestLocation[];
  }>;
};

export const assistantRouter = createTRPCRouter({
  // Search for coaches by activity and location
  searchCoaches: publicProcedure
    .input(searchInputSchema)
    .query(async ({ input }) => {
      const coaches = await searchCoachesByActivityAndLocation({
        activity: input.activity,
        lat: input.lat,
        lng: input.lng,
        radiusKm: input.radiusKm,
        limit: input.limit,
      });

      // Add distance to each coach
      return coaches.map((coach) => ({
        id: coach.id,
        userId: coach.userId,
        publicName: coach.publicName,
        description: coach.description,
        rating: coach.rating,
        coachingActivities: coach.coachingActivities,
        latitude: coach.latitude,
        longitude: coach.longitude,
        range: coach.range,
        pageId: coach.page?.id,
        pagePublished: coach.page?.published,
        userName: coach.user?.name,
        userImage: coach.user?.image,
        distance: calculateDistance(
          input.lng,
          input.lat,
          coach.longitude ?? LONGITUDE,
          coach.latitude ?? LATITUDE,
        ),
      }));
    }),

  // Search for clubs by activity and location
  searchClubs: publicProcedure
    .input(searchInputSchema)
    .query(async ({ input }) => {
      const sites = await searchClubsByActivityAndLocation({
        activity: input.activity,
        lat: input.lat,
        lng: input.lng,
        radiusKm: input.radiusKm,
        limit: input.limit,
      });

      // Add distance and transform data
      return sites.map((site) => {
        // Get activity groups from club activities
        const activityGroupsName = [
          ...new Set(site.club.activities.map((a) => a.group.name)),
        ].sort();

        // Find the home page if published
        const homePage = site.club.pages.find(
          (p) => p.target === "HOME" && p.published,
        );

        return {
          siteId: site.id,
          siteName: site.name,
          siteAddress: site.address,
          latitude: site.latitude,
          longitude: site.longitude,
          clubId: site.clubId,
          clubName: site.club.name,
          activityGroupsName,
          pageId: homePage?.id,
          pagePublished: !!homePage,
          distance: calculateDistance(
            input.lng,
            input.lat,
            site.longitude ?? LONGITUDE,
            site.latitude ?? LATITUDE,
          ),
        };
      });
    }),

  // Resolve address to coordinates using MapQuest
  resolveLocation: publicProcedure
    .input(locationInputSchema)
    .query(async ({ input }) => {
      const url = new URL("http://www.mapquestapi.com/geocoding/v1/address");
      url.searchParams.append("key", env.NEXT_PUBLIC_MAPQUEST_KEY);
      url.searchParams.append("location", input.address);

      const response = await fetch(url.href);
      const data: MapQuestResponse = await response.json();

      const locations =
        data.results?.[0]?.locations?.map((location: MapQuestLocation) => {
          const chunks: string[] = [];
          if (location.street) chunks.push(location.street);
          if (location.postalCode) chunks.push(location.postalCode);
          if (location.adminArea5) chunks.push(location.adminArea5);
          if (location.adminArea3) chunks.push(location.adminArea3);
          if (location.adminArea1) chunks.push(location.adminArea1);

          return {
            lat: location.latLng.lat,
            lng: location.latLng.lng,
            address: chunks.join(", "),
          };
        }) ?? [];

      return locations;
    }),

  // Search for company coaching offers by location and price
  searchCompanyOffers: publicProcedure
    .input(companyOffersInputSchema)
    .query(async ({ input }) => {
      const offers = await getOffersForCompanies(
        input.lng,
        input.lat,
        input.radiusKm,
        input.priceMin,
        input.priceMax,
      );

      // Transform and add distance to each offer
      return offers.map((offer) => {
        const coachLat = offer.user_coaches?.latitude ?? LATITUDE;
        const coachLng = offer.user_coaches?.longitude ?? LONGITUDE;

        return {
          id: offer.CoachingPrice.id,
          name: offer.CoachingPrice.name,
          description: offer.CoachingPrice.description,
          coachUserId: offer.CoachingPrice.coachUserId,
          coachName: offer.user_coaches?.publicName ?? "Coach",
          coachAddress: offer.user_coaches?.searchAddress,
          physical: offer.CoachingPrice.physical,
          webcam: offer.CoachingPrice.webcam,
          inHouse: offer.CoachingPrice.inHouse,
          perHourPhysical: offer.CoachingPrice.perHourPhysical,
          perDayPhysical: offer.CoachingPrice.perDayPhysical,
          perHourWebcam: offer.CoachingPrice.perHourWebcam,
          perDayWebcam: offer.CoachingPrice.perDayWebcam,
          freeHours: offer.CoachingPrice.freeHours,
          distance: calculateDistance(input.lng, input.lat, coachLng, coachLat),
        };
      });
    }),

  // Get list of available activity groups for autocomplete
  getActivityGroups: publicProcedure.query(async () => {
    // This will be used for the assistant to know what activities are available
    const { getAllActivityGroups } = await import("@/db/dal/activities");
    const groups = await getAllActivityGroups();
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
    }));
  }),
});
