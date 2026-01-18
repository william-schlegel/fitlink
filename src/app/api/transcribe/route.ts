import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";

// Hugging Face Inference API for Whisper
// Using whisper-large-v3-turbo for better speed/quality balance
// Alternative models: openai/whisper-large-v3, openai/whisper-medium, openai/whisper-small
const HF_WHISPER_URL =
  "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo";

export async function POST(request: NextRequest) {
  try {
    const apiKey = env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      console.error("HUGGINGFACE_API_KEY is not configured");
      return NextResponse.json(
        { error: "Transcription service not configured" },
        { status: 503 },
      );
    }

    // Get the audio data from the request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Convert File to ArrayBuffer then to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    // Determine the language from the request or default to auto-detect
    const lang = request.headers.get("Accept-Language")?.split(",")[0] || "";
    const language = lang.startsWith("fr")
      ? "french"
      : lang.startsWith("en")
        ? "english"
        : undefined;

    // Build the request payload with proper parameters
    // return_timestamps is REQUIRED for audio longer than 30 seconds
    const payload = {
      inputs: base64Audio,
      parameters: {
        return_timestamps: true, // Required for long audio
        ...(language && { language }), // Optional: specify language for better accuracy
      },
    };

    // Send to Hugging Face Whisper API
    const response = await fetch(HF_WHISPER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Hugging Face Whisper API error:",
        response.status,
        errorText,
      );

      // Check if model is loading (cold start)
      if (response.status === 503) {
        try {
          const errorData = JSON.parse(errorText);
          if (
            errorData.error?.includes("loading") ||
            errorData.error?.includes("currently loading")
          ) {
            return NextResponse.json(
              {
                error:
                  "Transcription model is loading, please try again in a few seconds",
                retryAfter: errorData.estimated_time || 20,
              },
              { status: 503 },
            );
          }
        } catch {
          // Not JSON, continue with generic error
        }
      }

      // Model might not exist or other issues
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Transcription model not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: `Transcription failed: ${response.status}` },
        { status: response.status },
      );
    }

    const result = await response.json();

    // Hugging Face Whisper returns { text: "transcribed text" }
    // or { text: "...", chunks: [...] } with timestamps
    const transcribedText = result.text || "";

    if (!transcribedText) {
      console.warn("Empty transcription result:", result);
      return NextResponse.json(
        { error: "No speech detected in the audio" },
        { status: 400 },
      );
    }

    return NextResponse.json({ text: transcribedText.trim() });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "An error occurred during transcription" },
      { status: 500 },
    );
  }
}
