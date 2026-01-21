"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Voice input modes
export type VoiceMode = "none" | "native" | "fallback";

export type VoiceInputState = {
  /** Whether the microphone is currently listening/recording */
  isListening: boolean;
  /** Whether audio is being transcribed (fallback mode only) */
  isTranscribing: boolean;
  /** The detected voice input mode */
  voiceMode: VoiceMode;
  /** Real-time interim transcript (native mode only) */
  interimTranscript: string;
  /** Recording duration in seconds (fallback mode only) */
  recordingDuration: number;
  /** Current error message, if any */
  error: string | null;
};

export type VoiceInputActions = {
  /** Toggle voice recording on/off */
  toggle: () => void;
  /** Clear any error message */
  clearError: () => void;
  /** Format duration as MM:SS */
  formatDuration: (seconds: number) => string;
};

export type UseVoiceInputOptions = {
  /** Callback when transcribed text is received */
  onTranscript: (text: string) => void;
  /** Language for speech recognition (default: document lang or "fr-FR") */
  lang?: string;
  /** Error messages for localization */
  errorMessages?: {
    microphone?: string;
    recording?: string;
    transcription?: string;
    recognition?: string;
  };
};

const DEFAULT_ERROR_MESSAGES = {
  microphone: "Could not access microphone. Please check permissions.",
  recording: "Recording failed. Please try again.",
  transcription: "Transcription failed. Please try again.",
  recognition: "Voice recognition failed. Please try again.",
};

export function useVoiceInput(
  options: UseVoiceInputOptions,
): VoiceInputState & VoiceInputActions {
  const { onTranscript, lang, errorMessages = {} } = options;
  const messages = { ...DEFAULT_ERROR_MESSAGES, ...errorMessages };

  // State
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("none");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedSupport = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback ref updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Check for voice input support on mount
  useEffect(() => {
    if (hasCheckedSupport.current) return;
    hasCheckedSupport.current = true;

    requestAnimationFrame(() => {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        setVoiceMode("native");
      } else if (
        typeof navigator !== "undefined" &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === "function"
      ) {
        setVoiceMode("fallback");
      } else {
        setVoiceMode("none");
      }
    });
  }, []);

  // Initialize native speech recognition
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang || document.documentElement.lang || "fr-FR";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        onTranscriptRef.current(finalTranscript);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setInterimTranscript("");
      setError(messages.recognition);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    return recognition;
  }, [lang, messages.recognition]);

  // Transcribe audio using server API with retry for model loading
  const transcribeAudio = useCallback(
    async (audioBlob: Blob, retryCount = 0) => {
      const MAX_RETRIES = 2;
      const RETRY_DELAY = 5000; // 5 seconds

      setIsTranscribing(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        // Handle model loading (cold start) with retry
        if (
          response.status === 503 &&
          data.retryAfter &&
          retryCount < MAX_RETRIES
        ) {
          console.log(
            `Model is loading, retrying in ${RETRY_DELAY / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return transcribeAudio(audioBlob, retryCount + 1);
        }

        if (!response.ok) {
          throw new Error(data.error || "Transcription failed");
        }

        if (data.text) {
          onTranscriptRef.current(data.text);
        }
      } catch (err) {
        console.error("Transcription error:", err);
        setError(messages.transcription);
      } finally {
        setIsTranscribing(false);
      }
    },
    [messages.transcription],
  );

  // Start MediaRecorder for fallback mode
  const startMediaRecorder = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingDuration(0);

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorder.onerror = () => {
        console.error("MediaRecorder error");
        setIsListening(false);
        setError(messages.recording);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsListening(true);

      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(messages.microphone);
    }
  }, [messages.microphone, messages.recording, transcribeAudio]);

  // Stop MediaRecorder
  const stopMediaRecorder = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  // Toggle voice recording
  const toggle = useCallback(() => {
    setError(null);

    if (isListening) {
      if (voiceMode === "native") {
        recognitionRef.current?.stop();
        setIsListening(false);
        setInterimTranscript("");
      } else {
        stopMediaRecorder();
      }
    } else {
      if (voiceMode === "native") {
        if (!recognitionRef.current) {
          recognitionRef.current = initSpeechRecognition();
        }
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (err) {
            console.error("Failed to start speech recognition:", err);
            setError(messages.recognition);
          }
        }
      } else if (voiceMode === "fallback") {
        startMediaRecorder();
      }
    }
  }, [
    isListening,
    voiceMode,
    initSpeechRecognition,
    startMediaRecorder,
    stopMediaRecorder,
    messages.recognition,
  ]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    isListening,
    isTranscribing,
    voiceMode,
    interimTranscript,
    recordingDuration,
    error,
    // Actions
    toggle,
    clearError,
    formatDuration,
  };
}
