"use client";

import { Maximize2, Minimize2, Sparkles, Trash, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import Confirmation from "@/components/ui/confirmation";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "../ui/shadcn";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/shadcn/item";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { ChatMessageList, type Message } from "./ChatMessageList";

type FloatingChatWidgetProps = {
  className?: string;
};

export function FloatingChatWidget({ className }: FloatingChatWidgetProps) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatInputRef = useRef<ChatInputHandle>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem("assistant_session_id");
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadMessages(savedSessionId);
    }
  }, []);

  const loadMessages = async (sessId: string) => {
    try {
      const response = await fetch(`/api/assistant?sessionId=${sessId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message immediately
      const userMessage: Message = {
        role: "user",
        content,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            message: content,
            locale,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("API error:", data);
          throw new Error(
            data.details || data.error || "Failed to send message",
          );
        }

        // Save session ID if new
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem("assistant_session_id", data.sessionId);
        }

        // Add assistant response
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message.content,
          results: data.message.results,
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Failed to send message:", error);
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("error-message"),
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
        // Focus input after response
        setTimeout(() => {
          chatInputRef.current?.focus();
        }, 100);
      }
    },
    [sessionId, t, locale],
  );

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem("assistant_session_id");
  };

  const handleDeleteConversation = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/assistant?sessionId=${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessages([]);
        setSessionId(null);
        localStorage.removeItem("assistant_session_id");
      } else {
        console.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  }, [sessionId]);

  const toggleOpen = () => {
    const wasOpen = isOpen;
    setIsOpen(!isOpen);
    if (!wasOpen) {
      setIsMinimized(false);
      // Focus input when opening
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  };

  const toggleMinimize = () => {
    const wasMinimized = isMinimized;
    setIsMinimized(!isMinimized);
    // Focus input when un-minimizing
    if (wasMinimized) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleOpen}
              size="icon"
              className={cn(
                "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
                "bg-linear-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                "transition-all duration-300 hover:scale-110",
                className,
              )}
            >
              <Sparkles className="h-6 w-6" />
              <span className="sr-only">{t("open-assistant")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t("open-assistant")}</TooltipContent>
        </Tooltip>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border bg-background shadow-2xl transition-all duration-300 overflow-hidden",
            isMinimized
              ? "h-auto w-80"
              : "h-[600px] w-[450px] max-h-[80vh] max-w-[95vw]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 rounded-t-2xl bg-linear-to-r from-primary/10 to-primary/5">
            <Item>
              <ItemMedia variant="icon">
                <Avatar>
                  <AvatarImage src="/images/fitlink-light.png" alt="Fitlink" />
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{t("title")}</ItemTitle>
                {!isMinimized && (
                  <ItemDescription>{t("subtitle")}</ItemDescription>
                )}
              </ItemContent>
            </Item>
            <div className="flex items-center gap-1">
              {!isMinimized && messages.length > 0 && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNewChat}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("new-chat")}</TooltipContent>
                  </Tooltip>
                  {sessionId && (
                    <Confirmation
                      title={t("delete-chat")}
                      message={t("delete-confirm")}
                      onConfirm={handleDeleteConversation}
                      buttonIcon={<Trash />}
                      variant="destructive"
                      textConfirmation={t("delete-chat")}
                      buttonSize="icon"
                    />
                  )}
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMinimize}
                    className="h-8 w-8"
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMinimized ? t("maximize") : t("minimize")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleOpen}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("close")}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              <ChatMessageList messages={messages} isLoading={isLoading} />
              <ChatInput
                ref={chatInputRef}
                onSend={sendMessage}
                onLocationShare={() => {}}
                disabled={isLoading}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
