import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getOffersForCompanies,
  searchClubsByActivityAndLocation,
  searchCoachesByActivityAndLocation,
} from "@/db/dal/coaching";
import { env } from "@/env";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { calculateDistance } from "@/lib/distance";
import {
  processAssistantMessage,
  type AssistantMessage,
} from "@/lib/llm/assistant";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

import type {
  PromptTranslations,
  ResponseTranslations,
} from "@/lib/llm/gemini";

// Import translations directly
import { ActivityId } from "@/db/types";
import enMessages from "../../../../messages/en.json";
import frMessages from "../../../../messages/fr.json";

// Get prompt translations based on locale
function getPromptTranslations(locale: string): PromptTranslations {
  const messages = locale === "fr" ? frMessages : enMessages;
  return messages.assistant.prompt as PromptTranslations;
}

// Get response translations based on locale
function getResponseTranslations(locale: string): ResponseTranslations {
  const messages = locale === "fr" ? frMessages : enMessages;
  return messages.assistant.responses as ResponseTranslations;
}

// Initialize Convex HTTP client only if URL is configured
const convexUrl = env.CONVEX_URL ?? process.env.CONVEX_URL;
const convexHttpClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// Request schema
const requestSchema = z.object({
  sessionId: z.string().nullish(), // Allow null, undefined, or string
  message: z.string().min(1).max(2000),
  userId: z.string().nullish(),
  locale: z.string().default("fr"), // Default to French
});

// MapQuest geocoding function (server-side)
async function resolveLocation(
  address: string,
): Promise<Array<{ lat: number; lng: number; address: string }>> {
  const url = new URL("http://www.mapquestapi.com/geocoding/v1/address");
  url.searchParams.append("key", env.NEXT_PUBLIC_MAPQUEST_KEY);
  url.searchParams.append("location", address);

  const response = await fetch(url.href);
  const data = await response.json();

  const locations =
    data.results?.[0]?.locations?.map(
      (location: {
        street: string;
        postalCode: string;
        adminArea5: string;
        adminArea3: string;
        adminArea1: string;
        latLng: { lat: number; lng: number };
      }) => {
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
      },
    ) ?? [];

  return locations;
}

// Tool executor implementation
const toolExecutor = {
  searchClubs: async (args: {
    activity?: ActivityId;
    lat: number;
    lng: number;
    radiusKm?: number;
    limit?: number;
  }) => {
    const sites = await searchClubsByActivityAndLocation({
      activity: args.activity,
      lat: args.lat,
      lng: args.lng,
      radiusKm: args.radiusKm,
      limit: args.limit,
    });

    return sites.map((site) => {
      const activityGroupsName = [
        ...new Set(site.club.activities.map((a) => a.group.name)),
      ].sort();

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
          args.lng,
          args.lat,
          site.longitude ?? LONGITUDE,
          site.latitude ?? LATITUDE,
        ),
      };
    });
  },

  searchCoaches: async (args: {
    activity?: ActivityId;
    lat: number;
    lng: number;
    radiusKm?: number;
    limit?: number;
  }) => {
    const coaches = await searchCoachesByActivityAndLocation({
      activity: args.activity,
      lat: args.lat,
      lng: args.lng,
      radiusKm: args.radiusKm,
      limit: args.limit,
    });

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
      pagePublished: coach.page?.published ?? undefined,
      userName: coach.user?.name ?? null,
      userImage: coach.user?.image ?? null,
      distance: calculateDistance(
        args.lng,
        args.lat,
        coach.longitude ?? LONGITUDE,
        coach.latitude ?? LATITUDE,
      ),
    }));
  },

  resolveLocation: async (args: { address: string }) => {
    return resolveLocation(args.address);
  },

  searchCompanyOffers: async (args: {
    activity?: ActivityId;
    lat: number;
    lng: number;
    radiusKm?: number;
    priceMin?: number;
    priceMax?: number;
  }) => {
    const offers = await getOffersForCompanies(
      args.lng,
      args.lat,
      args.radiusKm ?? 25,
      args.priceMin ?? 0,
      args.priceMax ?? 1000,
    );

    return offers.map((offer) => {
      const coachLat = offer.user_coaches?.latitude ?? LATITUDE;
      const coachLng = offer.user_coaches?.longitude ?? LONGITUDE;

      return {
        id: offer.CoachingPrice.id,
        name: offer.CoachingPrice.name,
        description: offer.CoachingPrice.description,
        coachUserId: offer.CoachingPrice.coachUserId,
        coachName: offer.user_coaches?.publicName ?? "Coach",
        coachAddress: offer.user_coaches?.searchAddress ?? null,
        physical: offer.CoachingPrice.physical,
        webcam: offer.CoachingPrice.webcam,
        inHouse: offer.CoachingPrice.inHouse,
        perHourPhysical: offer.CoachingPrice.perHourPhysical,
        perDayPhysical: offer.CoachingPrice.perDayPhysical,
        perHourWebcam: offer.CoachingPrice.perHourWebcam,
        perDayWebcam: offer.CoachingPrice.perDayWebcam,
        freeHours: offer.CoachingPrice.freeHours,
        distance: calculateDistance(args.lng, args.lat, coachLng, coachLat),
      };
    });
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, userId, locale } = requestSchema.parse(body);

    // Get translations based on locale
    const promptTranslations = getPromptTranslations(locale);
    const responseTranslations = getResponseTranslations(locale);

    // Only record conversations for logged-in users (when userId is provided)
    const shouldRecordConversation = !!convexHttpClient && !!userId;

    let actualSessionId: Id<"assistantSessions"> | null = null;
    let messages: AssistantMessage[] = [];

    if (shouldRecordConversation && convexHttpClient) {
      // Get or create session for the logged-in user
      if (sessionId) {
        actualSessionId = sessionId as Id<"assistantSessions">;
      } else {
        actualSessionId = await convexHttpClient.mutation(
          api.assistant.createSession,
          { userId },
        );
      }

      // Load existing messages
      const existingMessages = await convexHttpClient.query(
        api.assistant.getRecentMessages,
        {
          sessionId: actualSessionId,
          limit: 20,
        },
      );

      messages = existingMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        toolCalls: m.toolCalls,
        results: m.results,
      }));

      // Save user message
      await convexHttpClient.mutation(api.assistant.addMessage, {
        sessionId: actualSessionId,
        role: "user",
        content: message,
      });
    }

    // Add the new user message
    messages.push({
      role: "user",
      content: message,
    });

    // Process with LLM
    const assistantResponse = await processAssistantMessage(
      messages,
      toolExecutor,
      promptTranslations,
      responseTranslations,
    );

    if (shouldRecordConversation && convexHttpClient && actualSessionId) {
      // Save assistant response
      await convexHttpClient.mutation(api.assistant.addMessage, {
        sessionId: actualSessionId,
        role: "assistant",
        content: assistantResponse.content,
        toolCalls: assistantResponse.toolCalls,
        results: assistantResponse.results,
      });
    }

    return NextResponse.json({
      sessionId: actualSessionId,
      message: assistantResponse,
    });
  } catch (error) {
    console.error("Assistant API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    // Log more details for debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);

    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}

// GET endpoint to fetch session messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    if (!convexHttpClient) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await convexHttpClient.query(api.assistant.getMessages, {
      sessionId: sessionId as Id<"assistantSessions">,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        results: m.results,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Assistant GET error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE endpoint to delete a session and all its messages
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    if (!convexHttpClient) {
      // If Convex is not configured, just return success
      return NextResponse.json({ success: true });
    }

    await convexHttpClient.mutation(api.assistant.deleteSession, {
      sessionId: sessionId as Id<"assistantSessions">,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assistant DELETE error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
