import { type PromptTranslations, type ResponseTranslations } from "./gemini";
import {
  getConfiguredProvider,
  isLLMConfigured,
  processWithLLM,
  sendFunctionResultsToLLM,
  type LLMFunctionCall,
  type LLMMessage,
} from "./provider";

// Default response translations (English fallback)
const DEFAULT_RESPONSES: ResponseTranslations = {
  "not-configured":
    "I'm sorry, but the AI assistant is not currently configured. Please contact support.",
  "unable-to-process":
    "I'm sorry, but I'm unable to process your request right now. Please try again later.",
  "results-found":
    "I found some results for you. Please check the details above.",
  "results-found-fallback": "I found some results for you:",
  "default-greeting":
    "I'm here to help you find fitness clubs and coaches. What are you looking for?",
  "error-processing":
    "I apologize, but I encountered an error processing your request. Please try again.",
  "rate-limit-exceeded":
    "The service is temporarily overloaded. Please try again in a few minutes.",
};

// Types for search results
export type ClubResult = {
  siteId: string;
  siteName: string;
  siteAddress: string;
  latitude: number | null;
  longitude: number | null;
  clubId: string;
  clubName: string;
  activityGroups: string[];
  pageId?: string;
  pagePublished: boolean;
  distance: number;
};

export type CoachResult = {
  id: string;
  userId: string;
  publicName: string | null;
  description: string | null;
  rating: number | null;
  coachingActivities: string[] | null;
  latitude: number | null;
  longitude: number | null;
  range: number | null;
  pageId?: string;
  pagePublished?: boolean;
  userName: string | null;
  userImage: string | null;
  distance: number;
};

export type LocationResult = {
  lat: number;
  lng: number;
  address: string;
};

export type CompanyOfferResult = {
  id: string;
  name: string;
  description: string | null;
  coachId: string;
  coachName: string;
  coachAddress: string | null;
  physical: boolean | null;
  webcam: boolean | null;
  inHouse: boolean | null;
  perHourPhysical: number | null;
  perDayPhysical: number | null;
  perHourWebcam: number | null;
  perDayWebcam: number | null;
  freeHours: number | null;
  distance: number;
};

export type AssistantMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: LLMFunctionCall[];
  results?: {
    clubs?: ClubResult[];
    coaches?: CoachResult[];
    locations?: LocationResult[];
    companyOffers?: CompanyOfferResult[];
  };
};

// Tool executor type
type ToolExecutor = {
  searchClubs: (args: {
    activity?: string;
    lat: number;
    lng: number;
    radiusKm?: number;
    limit?: number;
  }) => Promise<ClubResult[]>;
  searchCoaches: (args: {
    activity?: string;
    lat: number;
    lng: number;
    radiusKm?: number;
    limit?: number;
  }) => Promise<CoachResult[]>;
  resolveLocation: (args: { address: string }) => Promise<LocationResult[]>;
  searchCompanyOffers: (args: {
    activity?: string;
    lat: number;
    lng: number;
    radiusKm?: number;
    priceMin?: number;
    priceMax?: number;
  }) => Promise<CompanyOfferResult[]>;
};

// Execute tool calls and return results
async function executeToolCalls(
  functionCalls: LLMFunctionCall[],
  executor: ToolExecutor,
): Promise<{
  clubs?: ClubResult[];
  coaches?: CoachResult[];
  locations?: LocationResult[];
  companyOffers?: CompanyOfferResult[];
}> {
  const results: {
    clubs?: ClubResult[];
    coaches?: CoachResult[];
    locations?: LocationResult[];
    companyOffers?: CompanyOfferResult[];
  } = {};

  for (const call of functionCalls) {
    switch (call.name) {
      case "search_clubs": {
        const args = call.args as {
          activity?: string;
          lat: number;
          lng: number;
          radiusKm?: number;
          limit?: number;
        };
        results.clubs = await executor.searchClubs(args);
        break;
      }
      case "search_coaches": {
        const args = call.args as {
          activity?: string;
          lat: number;
          lng: number;
          radiusKm?: number;
          limit?: number;
        };
        results.coaches = await executor.searchCoaches(args);
        break;
      }
      case "resolve_location": {
        const args = call.args as { address: string };
        results.locations = await executor.resolveLocation(args);
        break;
      }
      case "search_company_offers": {
        const args = call.args as {
          activity?: string;
          lat: number;
          lng: number;
          radiusKm?: number;
          priceMin?: number;
          priceMax?: number;
        };
        results.companyOffers = await executor.searchCompanyOffers(args);
        break;
      }
    }
  }

  return results;
}

// Format results for the model to summarize
function formatResultsForModel(results: {
  clubs?: ClubResult[];
  coaches?: CoachResult[];
  locations?: LocationResult[];
  companyOffers?: CompanyOfferResult[];
}): string {
  const parts: string[] = [];

  if (results.locations && results.locations.length > 0) {
    parts.push(
      `Location resolved: ${results.locations[0].address} (${results.locations[0].lat}, ${results.locations[0].lng})`,
    );
  }

  if (results.clubs && results.clubs.length > 0) {
    parts.push(`Found ${results.clubs.length} clubs:`);
    results.clubs.slice(0, 10).forEach((club, i) => {
      const pageUrl = club.pagePublished
        ? `/presentation-page/club/${club.clubId}/${club.pageId}`
        : null;
      parts.push(
        `${i + 1}. ${club.clubName} (${club.siteName}) - ${club.distance.toFixed(1)}km away - Activities: ${club.activityGroups.join(", ")}${pageUrl ? ` - Profile: ${pageUrl}` : ""}`,
      );
    });
  }

  if (results.coaches && results.coaches.length > 0) {
    parts.push(`Found ${results.coaches.length} coaches:`);
    results.coaches.slice(0, 10).forEach((coach, i) => {
      const pageUrl = coach.pagePublished
        ? `/presentation-page/coach/${coach.userId}/${coach.pageId}`
        : null;
      const activities = coach.coachingActivities?.join(", ") || "Various";
      const rating = coach.rating ? ` - Rating: ${coach.rating}/5` : "";
      parts.push(
        `${i + 1}. ${coach.publicName || coach.userName || "Coach"} - ${coach.distance.toFixed(1)}km away - Specialties: ${activities}${rating}${pageUrl ? ` - Profile: ${pageUrl}` : ""}`,
      );
    });
  }

  if (results.companyOffers && results.companyOffers.length > 0) {
    parts.push(`Found ${results.companyOffers.length} company offers:`);
    results.companyOffers.slice(0, 10).forEach((offer, i) => {
      const offerUrl = `/company/${offer.id}`;
      const options: string[] = [];
      if (offer.physical) options.push("physical");
      if (offer.webcam) options.push("webcam");
      if (offer.inHouse) options.push("in-house");
      const prices: string[] = [];
      if (offer.perHourPhysical)
        prices.push(`${offer.perHourPhysical}€/h physical`);
      if (offer.perDayPhysical)
        prices.push(`${offer.perDayPhysical}€/day physical`);
      if (offer.perHourWebcam) prices.push(`${offer.perHourWebcam}€/h webcam`);
      if (offer.perDayWebcam) prices.push(`${offer.perDayWebcam}€/day webcam`);
      const freeHours = offer.freeHours
        ? ` - Free trial: ${offer.freeHours}h`
        : "";
      parts.push(
        `${i + 1}. ${offer.name} by ${offer.coachName} - ${offer.distance.toFixed(1)}km away - Options: ${options.join(", ")} - Prices: ${prices.join(", ")}${freeHours} - Details: ${offerUrl}`,
      );
    });
  }

  if (parts.length === 0) {
    return "No results found for this search.";
  }

  return parts.join("\n");
}

// Main orchestration function
export async function processAssistantMessage(
  messages: AssistantMessage[],
  executor: ToolExecutor,
  promptTranslations?: PromptTranslations,
  responseTranslations?: ResponseTranslations,
): Promise<AssistantMessage> {
  const responses = responseTranslations ?? DEFAULT_RESPONSES;

  // Check if any LLM is configured
  if (!isLLMConfigured()) {
    return {
      role: "assistant",
      content: responses["not-configured"],
    };
  }

  try {
    const provider = getConfiguredProvider();
    // Convert messages to LLM format
    const llmMessages: LLMMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Process with the configured LLM
    const response = await processWithLLM(llmMessages, promptTranslations);

    if (response.functionCalls.length > 0) {
      // Execute tool calls
      const results = await executeToolCalls(response.functionCalls, executor);

      // Format results for the model
      const resultsText = formatResultsForModel(results);

      try {
        // Send results back to the model for summarization
        const summaryText = await sendFunctionResultsToLLM(
          llmMessages,
          response.functionCalls[0].name,
          resultsText,
          promptTranslations,
        );

        return {
          role: "assistant",
          content: summaryText || responses["results-found"],
          toolCalls: response.functionCalls,
          results,
        };
      } catch (funcError) {
        // If sending function response fails, check if it's a rate limit error
        console.error("Error sending function response:", funcError);
        const isRateLimit =
          funcError instanceof Error && funcError.message.includes("429");

        if (isRateLimit) {
          return {
            role: "assistant",
            content: `${responses["results-found-fallback"]}\n\n${resultsText}\n\n_(${responses["rate-limit-exceeded"]})_`,
            toolCalls: response.functionCalls,
            results,
          };
        }

        return {
          role: "assistant",
          content: `${responses["results-found-fallback"]}\n\n${resultsText}`,
          toolCalls: response.functionCalls,
          results,
        };
      }
    }

    // No function calls, return the text response
    return {
      role: "assistant",
      content: response.content || responses["default-greeting"],
    };
  } catch (error) {
    console.error("Error processing assistant message:", error);

    // Check if it's a rate limit error
    const isRateLimit = error instanceof Error && error.message.includes("429");

    return {
      role: "assistant",
      content: isRateLimit
        ? responses["rate-limit-exceeded"]
        : responses["error-processing"],
    };
  }
}

// Create a tool executor from tRPC caller
export function createToolExecutor(trpcCaller: {
  assistant: {
    searchClubs: {
      query: (input: {
        activity?: string;
        lat: number;
        lng: number;
        radiusKm?: number;
        limit?: number;
      }) => Promise<ClubResult[]>;
    };
    searchCoaches: {
      query: (input: {
        activity?: string;
        lat: number;
        lng: number;
        radiusKm?: number;
        limit?: number;
      }) => Promise<CoachResult[]>;
    };
    resolveLocation: {
      query: (input: { address: string }) => Promise<LocationResult[]>;
    };
    searchCompanyOffers: {
      query: (input: {
        activity?: string;
        lat: number;
        lng: number;
        radiusKm?: number;
        priceMin?: number;
        priceMax?: number;
      }) => Promise<CompanyOfferResult[]>;
    };
  };
}): ToolExecutor {
  return {
    searchClubs: (args) => trpcCaller.assistant.searchClubs.query(args),
    searchCoaches: (args) => trpcCaller.assistant.searchCoaches.query(args),
    resolveLocation: (args) => trpcCaller.assistant.resolveLocation.query(args),
    searchCompanyOffers: (args) =>
      trpcCaller.assistant.searchCompanyOffers.query(args),
  };
}
