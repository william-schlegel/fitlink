import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";

import { env } from "@/env";

// Define types locally since they may not be exported in newer SDK versions
export type Part =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: unknown } };

export type Content = {
  role: "user" | "model" | "function";
  parts: Part[];
};

// Schema type constants (replaces FunctionDeclarationSchemaType enum)
const SchemaType = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
  BOOLEAN: "BOOLEAN",
} as const;

// Tool type definition
type FunctionDeclarationSchema = {
  type: string;
  description?: string;
  properties?: Record<string, FunctionDeclarationSchema>;
  required?: string[];
  items?: FunctionDeclarationSchema;
};

type FunctionDeclaration = {
  name: string;
  description: string;
  parameters?: FunctionDeclarationSchema;
};

type Tool = {
  functionDeclarations: FunctionDeclaration[];
};

// Initialize Gemini client
const apiKey = env.GOOGLE_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Tool definitions for the assistant
export const assistantTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_clubs",
        description:
          "Search for fitness clubs near a location. Use this when the user wants to find a gym, fitness center, or sports club.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            activity: {
              type: SchemaType.STRING,
              description:
                "The activity or sport the user is interested in (e.g., yoga, swimming, fitness, pilates)",
            },
            lat: {
              type: SchemaType.NUMBER,
              description: "Latitude of the search location",
            },
            lng: {
              type: SchemaType.NUMBER,
              description: "Longitude of the search location",
            },
            radiusKm: {
              type: SchemaType.NUMBER,
              description: "Search radius in kilometers (default: 20)",
            },
            limit: {
              type: SchemaType.NUMBER,
              description: "Maximum number of results (default: 20)",
            },
          },
          required: ["lat", "lng"],
        },
      },
      {
        name: "search_coaches",
        description:
          "Search for personal trainers or coaches near a location. Use this when the user wants to find a personal trainer, fitness coach, or sports instructor.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            activity: {
              type: SchemaType.STRING,
              description:
                "The activity or specialty the user is interested in (e.g., personal training, nutrition, yoga, CrossFit)",
            },
            lat: {
              type: SchemaType.NUMBER,
              description: "Latitude of the search location",
            },
            lng: {
              type: SchemaType.NUMBER,
              description: "Longitude of the search location",
            },
            radiusKm: {
              type: SchemaType.NUMBER,
              description: "Search radius in kilometers (default: 20)",
            },
            limit: {
              type: SchemaType.NUMBER,
              description: "Maximum number of results (default: 20)",
            },
          },
          required: ["lat", "lng"],
        },
      },
      {
        name: "resolve_location",
        description:
          "Convert an address or city name to geographic coordinates. Use this when the user provides a location as text.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            address: {
              type: SchemaType.STRING,
              description:
                "The address or city name to geocode (e.g., 'Paris, France', '12eme arrondissement Paris')",
            },
          },
          required: ["address"],
        },
      },
      {
        name: "search_company_offers",
        description:
          "Search for coaching offers for companies and their employees. Use this when the user mentions their company, business, employees, or wants corporate wellness/fitness programs.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            activity: {
              type: SchemaType.STRING,
              description:
                "The activity or sport the company is interested in (e.g., yoga, fitness, team building)",
            },
            lat: {
              type: SchemaType.NUMBER,
              description: "Latitude of the company location",
            },
            lng: {
              type: SchemaType.NUMBER,
              description: "Longitude of the company location",
            },
            radiusKm: {
              type: SchemaType.NUMBER,
              description: "Search radius in kilometers (default: 25)",
            },
            priceMin: {
              type: SchemaType.NUMBER,
              description: "Minimum price per hour in euros (default: 0)",
            },
            priceMax: {
              type: SchemaType.NUMBER,
              description: "Maximum price per hour in euros (default: 1000)",
            },
          },
          required: ["lat", "lng"],
        },
      },
    ],
  },
];

// Type for prompt translations
export type PromptTranslations = {
  role: string;
  "help-find": string;
  "help-find-1": string;
  "help-find-2": string;
  "help-find-3"?: string;
  "conversation-flow": string;
  "conversation-flow-1": string;
  "conversation-flow-2": string;
  "conversation-flow-3": string;
  "conversation-flow-4": string;
  "conversation-flow-5": string;
  "conversation-flow-6"?: string;
  "location-handling": string;
  "location-handling-1": string;
  "location-handling-2": string;
  "location-handling-3": string;
  "location-handling-4": string;
  guardrails: string;
  "guardrails-1": string;
  "guardrails-2": string;
  "guardrails-3": string;
  "guardrails-4": string;
  "guardrails-5": string;
  "response-format": string;
  "response-format-1": string;
  "response-format-2": string;
  "response-format-3": string;
  "response-format-4": string;
  language: string;
  "language-1": string;
  "language-2": string;
};

// Type for response translations
export type ResponseTranslations = {
  "not-configured": string;
  "unable-to-process": string;
  "results-found": string;
  "results-found-fallback": string;
  "default-greeting": string;
  "error-processing": string;
  "rate-limit-exceeded": string;
};

// Build system prompt from translations
export function buildSystemPrompt(t: PromptTranslations): string {
  const helpFind3 = t["help-find-3"] ? `\n3. ${t["help-find-3"]}` : "";
  const conversationFlow6 = t["conversation-flow-6"]
    ? `\n6. ${t["conversation-flow-6"]}`
    : "";

  return `${t.role}

${t["help-find"]}
1. ${t["help-find-1"]}
2. ${t["help-find-2"]}${helpFind3}

${t["conversation-flow"]}
1. ${t["conversation-flow-1"]}
2. ${t["conversation-flow-2"]}
3. ${t["conversation-flow-3"]}
4. ${t["conversation-flow-4"]}
5. ${t["conversation-flow-5"]}${conversationFlow6}

${t["location-handling"]}
- ${t["location-handling-1"]}
- ${t["location-handling-2"]}
- ${t["location-handling-3"]}
- ${t["location-handling-4"]}

${t.guardrails}
- ${t["guardrails-1"]}
- ${t["guardrails-2"]}
- ${t["guardrails-3"]}
- ${t["guardrails-4"]}
- ${t["guardrails-5"]}

${t["response-format"]}
- ${t["response-format-1"]}
- ${t["response-format-2"]}
- ${t["response-format-3"]}
- ${t["response-format-4"]}

${t.language}
- ${t["language-1"]}
- ${t["language-2"]}`;
}

// Default English system prompt (fallback)
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful fitness assistant for Fitlink, a platform that helps users find fitness clubs and personal coaches near them.

Your role is to help users find:
1. Fitness clubs, gyms, and sports centers
2. Personal trainers and coaches

CONVERSATION FLOW:
1. Greet the user and ask what they're looking for (club or coach)
2. Ask about their preferred activity (yoga, fitness, swimming, etc.)
3. Ask for their location (city, address, or they can share their current location)
4. Use the appropriate search tool to find results
5. Present the results in a friendly, organized way with links to profiles

LOCATION HANDLING:
- If the user mentions a city, use resolve_location to get coordinates
- For Paris arrondissements (e.g., "12eme", "12th arrondissement"), search for "Paris 12, France"
- If the user shares coordinates directly, use them
- Default search radius is 20km unless specified otherwise

GUARDRAILS:
- Only help with fitness-related queries (clubs, coaches, activities)
- Politely decline requests unrelated to fitness/sports
- Never share personal information about users
- Be encouraging and supportive about fitness goals

RESPONSE FORMAT:
- Be concise and friendly
- When presenting results, include: name, distance, activities offered, and a link to their profile
- Offer to refine the search if the user isn't satisfied
- Suggest follow-up actions (e.g., "Would you like me to search for coaches instead?" or "Should I look in a different area?")

LANGUAGE:
- Default language is French. Always respond in French unless the user writes in another language.
- If the user writes in English or another language, respond in that language.
- Support both French and English fluently.`;

// Get the Gemini model with tools
export function getAssistantModel(
  promptTranslations?: PromptTranslations,
): GenerativeModel | null {
  if (!genAI) {
    console.warn("Gemini API key not configured");
    return null;
  }

  const systemPrompt = promptTranslations
    ? buildSystemPrompt(promptTranslations)
    : DEFAULT_SYSTEM_PROMPT;

  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // @ts-expect-error - Tool types differ between SDK versions
    tools: assistantTools,
    systemInstruction: systemPrompt,
  });
}

// Convert messages to Gemini format
export function toGeminiContent(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
): Content[] {
  return messages
    .filter((m) => m.role !== "system") // System messages are handled separately
    .map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    }));
}

// Type for function call results
export type FunctionCallResult = {
  name: string;
  args: Record<string, unknown>;
};

// Extract function calls from response
export function extractFunctionCalls(
  response: Awaited<ReturnType<GenerativeModel["generateContent"]>>,
): FunctionCallResult[] {
  const candidate = response.response.candidates?.[0];
  if (!candidate) return [];

  const functionCalls: FunctionCallResult[] = [];

  for (const part of candidate.content.parts) {
    if ("functionCall" in part && part.functionCall) {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args as Record<string, unknown>,
      });
    }
  }

  return functionCalls;
}

// Check if Gemini is configured
export function isGeminiConfigured(): boolean {
  return !!genAI;
}
