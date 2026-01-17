import { env } from "@/env";

import { buildSystemPrompt, DEFAULT_SYSTEM_PROMPT } from "./gemini";

import type { PromptTranslations } from "./gemini";

// Hugging Face Inference API configuration (OpenAI-compatible endpoint)
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
// Using Qwen which is available as a chat model on HF inference
const HF_MODEL = "Qwen/Qwen2.5-72B-Instruct";

const apiKey = env.HUGGINGFACE_API_KEY;

// Tool definitions in a format suitable for Mistral/HF models
export const hfToolDefinitions = [
  {
    type: "function",
    function: {
      name: "search_clubs",
      description:
        "Search for fitness clubs near a location. Use this when the user wants to find a gym, fitness center, or sports club.",
      parameters: {
        type: "object",
        properties: {
          activity: {
            type: "string",
            description:
              "The activity or sport the user is interested in (e.g., yoga, swimming, fitness, pilates)",
          },
          lat: {
            type: "number",
            description: "Latitude of the search location",
          },
          lng: {
            type: "number",
            description: "Longitude of the search location",
          },
          radiusKm: {
            type: "number",
            description: "Search radius in kilometers (default: 20)",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default: 20)",
          },
        },
        required: ["lat", "lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_coaches",
      description:
        "Search for personal trainers or coaches near a location. Use this when the user wants to find a personal trainer, fitness coach, or sports instructor.",
      parameters: {
        type: "object",
        properties: {
          activity: {
            type: "string",
            description:
              "The activity or specialty the user is interested in (e.g., personal training, nutrition, yoga, CrossFit)",
          },
          lat: {
            type: "number",
            description: "Latitude of the search location",
          },
          lng: {
            type: "number",
            description: "Longitude of the search location",
          },
          radiusKm: {
            type: "number",
            description: "Search radius in kilometers (default: 20)",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default: 20)",
          },
        },
        required: ["lat", "lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resolve_location",
      description:
        "Convert an address or city name to geographic coordinates. Use this when the user provides a location as text.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description:
              "The address or city name to geocode (e.g., 'Paris, France', '12eme arrondissement Paris')",
          },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_company_offers",
      description:
        "Search for coaching offers for companies and their employees. Use this when the user mentions their company, business, employees, or wants corporate wellness/fitness programs.",
      parameters: {
        type: "object",
        properties: {
          activity: {
            type: "string",
            description:
              "The activity or sport the company is interested in (e.g., yoga, fitness, team building)",
          },
          lat: {
            type: "number",
            description: "Latitude of the company location",
          },
          lng: {
            type: "number",
            description: "Longitude of the company location",
          },
          radiusKm: {
            type: "number",
            description: "Search radius in kilometers (default: 25)",
          },
          priceMin: {
            type: "number",
            description: "Minimum price per hour in euros (default: 0)",
          },
          priceMax: {
            type: "number",
            description: "Maximum price per hour in euros (default: 1000)",
          },
        },
        required: ["lat", "lng"],
      },
    },
  },
];

export type HFMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
};

export type HFFunctionCall = {
  name: string;
  args: Record<string, unknown>;
};

// Check if Hugging Face is configured
export function isHuggingFaceConfigured(): boolean {
  return !!apiKey;
}

// Convert messages to HF format
export function toHFMessages(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  promptTranslations?: PromptTranslations,
): HFMessage[] {
  const systemPrompt = promptTranslations
    ? buildSystemPrompt(promptTranslations)
    : DEFAULT_SYSTEM_PROMPT;

  // Add system message at the beginning
  const hfMessages: HFMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  // Add conversation messages
  for (const m of messages) {
    if (m.role !== "system") {
      hfMessages.push({
        role: m.role,
        content: m.content,
      });
    }
  }

  return hfMessages;
}

// Call Hugging Face API (OpenAI-compatible format)
export async function callHuggingFace(
  messages: HFMessage[],
  includeTools: boolean = true,
): Promise<{
  content: string;
  functionCalls: HFFunctionCall[];
}> {
  if (!apiKey) {
    throw new Error("Hugging Face API key not configured");
  }

  // Convert messages to OpenAI format
  const openAIMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Build request body
  const requestBody: Record<string, unknown> = {
    model: HF_MODEL,
    messages: openAIMessages,
    max_tokens: 1024,
    temperature: 0.7,
  };

  // Add tools if needed
  if (includeTools) {
    requestBody.tools = hfToolDefinitions;
    requestBody.tool_choice = "auto";
  }

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Hugging Face API error:", error);
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Extract content and function calls from OpenAI-format response
  const choice = data.choices?.[0];
  const message = choice?.message;

  const content = message?.content || "";
  const functionCalls: HFFunctionCall[] = [];

  // Check for tool calls in the response
  if (message?.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.function) {
        try {
          const args =
            typeof toolCall.function.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
          functionCalls.push({
            name: toolCall.function.name,
            args,
          });
        } catch (e) {
          console.error("Failed to parse tool call arguments:", e);
        }
      }
    }
  }

  // Also check for function calls in the content (fallback)
  if (functionCalls.length === 0 && content) {
    const parsed = parseHFResponse(content);
    if (parsed.functionCalls.length > 0) {
      return parsed;
    }
  }

  return { content, functionCalls };
}

// Build Mistral-style prompt
function buildMistralPrompt(
  messages: HFMessage[],
  includeTools: boolean,
): string {
  let prompt = "";

  // Add tool definitions if needed
  if (includeTools) {
    prompt += `[AVAILABLE_TOOLS] ${JSON.stringify(hfToolDefinitions)}[/AVAILABLE_TOOLS]`;
  }

  for (const msg of messages) {
    if (msg.role === "system") {
      prompt += `[INST] ${msg.content} [/INST]`;
    } else if (msg.role === "user") {
      prompt += `[INST] ${msg.content} [/INST]`;
    } else if (msg.role === "assistant") {
      prompt += msg.content;
      if (msg.tool_calls) {
        prompt += `[TOOL_CALLS] ${JSON.stringify(msg.tool_calls)}[/TOOL_CALLS]`;
      }
    }
  }

  return prompt;
}

// Parse HF response to extract function calls
function parseHFResponse(text: string): {
  content: string;
  functionCalls: HFFunctionCall[];
} {
  const functionCalls: HFFunctionCall[] = [];
  let content = text;

  // Check for tool calls in the response
  // Mistral format: [TOOL_CALLS] [{"name": "...", "arguments": {...}}]
  const toolCallMatch = text.match(
    /\[TOOL_CALLS?\]\s*(\[[\s\S]*?\])\s*\[?\/TOOL_CALLS?\]?/i,
  );

  if (toolCallMatch) {
    try {
      const toolCalls = JSON.parse(toolCallMatch[1]);
      for (const call of toolCalls) {
        if (call.name || call.function?.name) {
          const name = call.name || call.function?.name;
          const args =
            typeof call.arguments === "string"
              ? JSON.parse(call.arguments)
              : call.arguments || call.function?.arguments || {};

          functionCalls.push({ name, args });
        }
      }
      // Remove the tool call part from content
      content = text.replace(toolCallMatch[0], "").trim();
    } catch (e) {
      console.error("Failed to parse tool calls:", e);
    }
  }

  // Also check for JSON function calls in the text
  // Some models output: {"name": "search_clubs", "arguments": {...}}
  const jsonMatch = text.match(
    /\{[\s\S]*?"name"[\s\S]*?:[\s\S]*?"(search_clubs|search_coaches|resolve_location)"[\s\S]*?\}/,
  );

  if (jsonMatch && functionCalls.length === 0) {
    try {
      const call = JSON.parse(jsonMatch[0]);
      if (call.name) {
        const args =
          typeof call.arguments === "string"
            ? JSON.parse(call.arguments)
            : call.arguments || {};
        functionCalls.push({ name: call.name, args });
        content = text.replace(jsonMatch[0], "").trim();
      }
    } catch (e) {
      // Not valid JSON, ignore
    }
  }

  return { content: content || text, functionCalls };
}

// Send function results back to the model
export async function sendFunctionResults(
  messages: HFMessage[],
  functionName: string,
  results: string,
  promptTranslations?: PromptTranslations,
): Promise<string> {
  // Add the function result as a message
  const updatedMessages: HFMessage[] = [
    ...messages,
    {
      role: "user",
      content: `[TOOL_RESULTS] {"name": "${functionName}", "content": ${JSON.stringify(results)}}[/TOOL_RESULTS]\n\nBased on these results, please provide a helpful response to the user in their language.`,
    },
  ];

  const { content } = await callHuggingFace(
    toHFMessages(
      updatedMessages.filter((m) => m.role !== "system"),
      promptTranslations,
    ),
    false, // Don't include tools for the summary
  );

  return content;
}
