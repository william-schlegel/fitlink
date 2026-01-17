"use client";

import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  KeyboardEvent,
} from "react";
import { Send, MapPin, Loader2, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { Textarea } from "@/components/ui/shadcn/textarea";
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
        // Reset textarea height
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
          // Send a message with the actual coordinates
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

    // Auto-resize textarea
    const handleTextareaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessage(e.target.value);
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    };

    return (
      <div className="border-t bg-background p-4">
        <InputGroup>
          <InputGroupTextarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t("input-placeholder")}
            disabled={disabled}
            rows={2}
          />

          <InputGroupAddon align="block-end">
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
            <InputGroupButton
              variant="default"
              className="ml-auto rounded-full"
              size="icon-xs"
              onClick={handleSend}
              disabled={disabled || !message.trim()}
            >
              <ArrowUpIcon />
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {/* <div className="flex items-end gap-2">
         

          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || t("input-placeholder")}
              disabled={disabled}
              rows={1}
              className="min-h-[44px] max-h-[120px] resize-none pr-12 py-3"
            />
            <Button
              type="button"
              size="icon"
             
              className="absolute right-2 bottom-2 h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div> */}
      </div>
    );
  },
);
