"use client";

import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  KeyboardEvent,
  useCallback,
} from "react";
import {
  MapPin,
  Loader2,
  ArrowUpIcon,
  Mic,
  MicOff,
  Square,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "../ui/shadcn/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { Button } from "@/components/ui/shadcn/button";

type ChatInputProps = {
  onSend: (message: string) => void;
  onLocationShare?: (lat: number, lng: number) => void;
  disabled?: boolean;
  placeholder?: string;
};

export type ChatInputHandle = {
  focus: () => void;
};

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput(
    { onSend, onLocationShare, disabled = false, placeholder },
    ref,
  ) {
    const t = useTranslations("assistant");
    const [message, setMessage] = useState("");
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Handle transcript from voice input
    const handleTranscript = useCallback((text: string) => {
      setMessage((prev) => {
        const newMessage = prev + (prev ? " " : "") + text;
        return newMessage;
      });
    }, []);

    // Voice input hook
    const voice = useVoiceInput({
      onTranscript: handleTranscript,
      errorMessages: {
        microphone: t("voice.error-microphone"),
        recording: t("voice.error-recording"),
        transcription: t("voice.error-transcription"),
        recognition: t("voice.error-recognition"),
      },
    });

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const handleSend = () => {
      if (message.trim() && !disabled) {
        onSend(message.trim());
        setMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleLocationShare = () => {
      if (!navigator.geolocation || !onLocationShare) return;

      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationShare(latitude, longitude);
          setIsGettingLocation(false);
          onSend(
            `${t("location-shared")} (Coordonnées GPS: latitude ${latitude.toFixed(6)}, longitude ${longitude.toFixed(6)})`,
          );
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    };

    const handleTextareaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessage(e.target.value);
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    };

    // Determine the status text and color for the recording indicator
    const getRecordingStatus = () => {
      if (voice.isTranscribing) {
        return {
          text: t("voice.transcribing"),
          bgClass: "bg-blue-50 dark:bg-blue-950/30",
          textClass: "text-blue-600 dark:text-blue-400",
          dotClass: "bg-blue-500",
          pingClass: "bg-blue-400",
        };
      }
      if (voice.isListening) {
        return {
          text:
            voice.voiceMode === "fallback"
              ? `${t("voice.recording")} ${voice.formatDuration(voice.recordingDuration)}`
              : t("voice.listening"),
          bgClass: "bg-red-50 dark:bg-red-950/30",
          textClass: "text-red-600 dark:text-red-400",
          dotClass: "bg-red-500",
          pingClass: "bg-red-400",
        };
      }
      return null;
    };

    const recordingStatus = getRecordingStatus();

    return (
      <div className="border-t bg-background p-4">
        {/* Voice error message */}
        {voice.error && (
          <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {voice.error}
          </div>
        )}

        {/* Voice recording/transcribing indicator */}
        {recordingStatus && (
          <div
            className={cn(
              "mb-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2",
              recordingStatus.bgClass,
            )}
          >
            <span className="relative flex h-3 w-3">
              {voice.isTranscribing ? (
                <Loader2
                  className={cn(
                    "h-3 w-3 animate-spin",
                    recordingStatus.textClass,
                  )}
                />
              ) : (
                <>
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                      recordingStatus.pingClass,
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex h-3 w-3 rounded-full",
                      recordingStatus.dotClass,
                    )}
                  />
                </>
              )}
            </span>
            <span
              className={cn("text-sm font-medium", recordingStatus.textClass)}
            >
              {recordingStatus.text}
            </span>
            {voice.interimTranscript && (
              <span className="ml-2 max-w-[200px] truncate text-sm italic text-muted-foreground">
                {voice.interimTranscript}
              </span>
            )}
          </div>
        )}

        <InputGroup>
          <InputGroupTextarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              voice.isListening
                ? t("voice.speak-now")
                : voice.isTranscribing
                  ? t("voice.transcribing")
                  : placeholder || t("input-placeholder")
            }
            disabled={disabled || voice.isTranscribing}
            rows={2}
            className={cn(
              voice.isListening &&
                "border-red-300 ring-2 ring-red-200 dark:border-red-700 dark:ring-red-900",
              voice.isTranscribing &&
                "border-blue-300 ring-2 ring-blue-200 dark:border-blue-700 dark:ring-blue-900",
            )}
          />

          <InputGroupAddon align="block-end">
            {/* Voice input button */}
            {voice.voiceMode !== "none" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={voice.isListening ? "destructive" : "ghost"}
                    size="icon"
                    onClick={voice.toggle}
                    disabled={disabled || voice.isTranscribing}
                    className={cn(
                      "shrink-0 transition-all duration-200",
                      voice.isListening && "animate-pulse",
                    )}
                    aria-label={
                      voice.isListening ? t("voice.stop") : t("voice.start")
                    }
                  >
                    {voice.isTranscribing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : voice.isListening ? (
                      voice.voiceMode === "fallback" ? (
                        <Square className="h-4 w-4 fill-current" />
                      ) : (
                        <MicOff className="h-5 w-5" />
                      )
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {voice.isTranscribing
                    ? t("voice.transcribing")
                    : voice.isListening
                      ? t("voice.stop")
                      : t("voice.start")}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Location share button */}
            {onLocationShare && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleLocationShare}
                    disabled={disabled || isGettingLocation}
                    className="shrink-0"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("share-location")}</TooltipContent>
              </Tooltip>
            )}

            {/* Send button */}
            <InputGroupButton
              variant="default"
              className="ml-auto rounded-full"
              size="icon-xs"
              onClick={handleSend}
              disabled={disabled || voice.isTranscribing || !message.trim()}
            >
              <ArrowUpIcon />
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    );
  },
);
