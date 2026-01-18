import { env } from "@/env";

import {
  isHuggingFaceConfigured,
  callHuggingFace,
  toHFMessages,
  sendFunctionResults as hfSendFunctionResults,
  type HFFunctionCall,
} from "./huggingface";
import {
  isGeminiConfigured,
  getAssistantModel,
  toGeminiContent,
  type PromptTranslations,
  type FunctionCallResult,
  type Part,
} from "./gemini";

export type LLMProvider = "gemini" | "huggingface";

// Get the configured provider
export function getConfiguredProvider(): LLMProvider {
  const configuredProvider = env.LLM_PROVIDER || "gemini";

  // Check if the configured provider is available
  if (configuredProvider === "gemini" && isGeminiConfigured()) {
    return "gemini";
  }

  if (configuredProvider === "huggingface" && isHuggingFaceConfigured()) {
    return "huggingface";
  }

  // Fallback: try the other provider if the configured one isn't available
  if (isGeminiConfigured()) {
    console.warn(
      `Configured provider ${configuredProvider} not available, falling back to Gemini`,
    );
    return "gemini";
  }

  if (isHuggingFaceConfigured()) {
    console.warn(
      `Configured provider ${configuredProvider} not available, falling back to Hugging Face`,
    );
    return "huggingface";
  }

  // No provider available
  throw new Error("No LLM provider configured");
}

// Check if any LLM is configured
export function isLLMConfigured(): boolean {
  return isGeminiConfigured() || isHuggingFaceConfigured();
}

// Unified message type
export type LLMMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Unified function call type
export type LLMFunctionCall = {
  name: string;
  args: Record<string, unknown>;
};

// Unified response type
export type LLMResponse = {
  content: string;
  functionCalls: LLMFunctionCall[];
};

// Process a chat message with the configured provider
export async function processWithLLM(
  messages: LLMMessage[],
  promptTranslations?: PromptTranslations,
): Promise<LLMResponse> {
  const provider = getConfiguredProvider();

  console.log(`[LLM] Using provider: ${provider}`);

  if (provider === "huggingface") {
    return processWithHuggingFace(messages, promptTranslations);
  }

  return processWithGemini(messages, promptTranslations);
}

// Process with Gemini
async function processWithGemini(
  messages: LLMMessage[],
  promptTranslations?: PromptTranslations,
): Promise<LLMResponse> {
  const model = getAssistantModel(promptTranslations);
  if (!model) {
    throw new Error("Gemini model not available");
  }

  // Convert messages to Gemini format
  const geminiMessages = toGeminiContent(messages);

  // Start a chat session
  const chat = model.startChat({
    // Cast to any to work around SDK type differences
    history: geminiMessages.slice(0, -1) as any,
  });

  // Send the last message
  const lastMessage = geminiMessages[geminiMessages.length - 1];
  const userText =
    lastMessage?.parts
      .filter((p): p is Part & { text: string } => "text" in p)
      .map((p) => p.text)
      .join("") || "";

  const response = await chat.sendMessage(userText);

  // Extract function calls
  const candidate = response.response.candidates?.[0];
  const functionCalls: LLMFunctionCall[] = [];

  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if ("functionCall" in part && part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args as Record<string, unknown>,
        });
      }
    }
  }

  const content = response.response.text() || "";

  return { content, functionCalls };
}

// Process with Hugging Face
async function processWithHuggingFace(
  messages: LLMMessage[],
  promptTranslations?: PromptTranslations,
): Promise<LLMResponse> {
  const hfMessages = toHFMessages(messages, promptTranslations);
  const { content, functionCalls } = await callHuggingFace(hfMessages, true);

  return {
    content,
    functionCalls: functionCalls.map((fc: HFFunctionCall) => ({
      name: fc.name,
      args: fc.args,
    })),
  };
}

// Send function results back to the LLM for summarization
export async function sendFunctionResultsToLLM(
  messages: LLMMessage[],
  functionName: string,
  resultsText: string,
  promptTranslations?: PromptTranslations,
): Promise<string> {
  const provider = getConfiguredProvider();

  if (provider === "huggingface") {
    const hfMessages = toHFMessages(messages, promptTranslations);
    return hfSendFunctionResults(
      hfMessages,
      functionName,
      resultsText,
      promptTranslations,
    );
  }

  // For Gemini, we need to use the chat continuation
  const model = getAssistantModel(promptTranslations);
  if (!model) {
    throw new Error("Gemini model not available");
  }

  const geminiMessages = toGeminiContent(messages);

  const chat = model.startChat({
    history: geminiMessages as any,
  });

  // Send function response in Gemini format
  const functionResponseParts = [
    {
      functionResponse: {
        name: functionName,
        response: { result: resultsText },
      },
    },
  ];

  const summaryResponse = await chat.sendMessage(functionResponseParts);
  return summaryResponse.response.text() || "";
}
