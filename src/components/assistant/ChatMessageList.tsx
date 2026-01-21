"use client";

import { Bot, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";
import {
  ClubResultCard,
  CoachResultCard,
  CompanyOfferResultCard,
} from "./ResultCard";

import type {
  ClubResult,
  CoachResult,
  CompanyOfferResult,
} from "@/lib/llm/assistant";

export type Message = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  results?: {
    clubs?: ClubResult[];
    coaches?: CoachResult[];
    companyOffers?: CompanyOfferResult[];
  };
  createdAt?: number;
};

type ChatMessageListProps = {
  messages: Message[];
  isLoading?: boolean;
};

export function ChatMessageList({
  messages,
  isLoading = false,
}: ChatMessageListProps) {
  const t = useTranslations("assistant");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
          <Bot className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">{t("welcome-message")}</p>
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble key={message.id || index} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-150">.</span>
            <span className="animate-bounce delay-300">.</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const hasResults =
    (message.results?.clubs && message.results.clubs.length > 0) ||
    (message.results?.coaches && message.results.coaches.length > 0) ||
    (message.results?.companyOffers &&
      message.results.companyOffers.length > 0);

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn("flex flex-col gap-2 max-w-[85%]", isUser && "items-end")}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md text-sm"
              : "bg-muted rounded-bl-md chat-markdown",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                // Custom link component for internal navigation
                a: ({ href, children }) => {
                  if (href?.startsWith("/")) {
                    return (
                      <Link href={href} className="font-medium">
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Results section */}
        {hasResults && (
          <div className="w-full space-y-2 mt-2">
            {message.results?.clubs && message.results.clubs.length > 0 && (
              <div className="grid gap-2">
                {message.results.clubs.slice(0, 5).map((club) => (
                  <ClubResultCard key={club.siteId} club={club} />
                ))}
              </div>
            )}
            {message.results?.coaches && message.results.coaches.length > 0 && (
              <div className="grid gap-2">
                {message.results.coaches.slice(0, 5).map((coach) => (
                  <CoachResultCard key={coach.id} coach={coach} />
                ))}
              </div>
            )}
            {message.results?.companyOffers &&
              message.results.companyOffers.length > 0 && (
                <div className="grid gap-2">
                  {message.results.companyOffers.slice(0, 5).map((offer) => (
                    <CompanyOfferResultCard key={offer.id} offer={offer} />
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
