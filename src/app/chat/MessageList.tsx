"use client";
import React, { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { useQuery, useMutation } from "convex/react";
import { createPortal } from "react-dom";
import { Trash } from "lucide-react";
import Image from "next/image";

import { Id } from "../../../convex/_generated/dataModel";
import { Spinner } from "@/components/ui/shadcn/spinner";
import Confirmation from "@/components/ui/confirmation";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/shadcn";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type MessageListProps = {
  roomId: Id<"chatRooms">;
  userId: string;
  isAdmin?: boolean;
};

export function MessageList({
  roomId,
  userId,
  isAdmin = false,
}: MessageListProps) {
  const messages = useQuery(api.messages.getMessages, { roomId });
  const membershipInfo = useQuery(api.messages.hasRoomMembership, {
    roomId,
    userId,
  });
  const markAsRead = useMutation(api.messages.markAsRead);
  const t = useTranslations("message");
  // Mark as read when component mounts or roomId changes
  // For admin users: only mark as read if they have membership OR it's a direct message to them
  React.useEffect(() => {
    if (roomId && membershipInfo) {
      const shouldMarkAsRead = isAdmin
        ? membershipInfo.hasMembership || membershipInfo.isDirectMessageToUser
        : membershipInfo.hasMembership;

      if (shouldMarkAsRead) {
        markAsRead({ roomId, userId }).catch(console.error);
      }
    }
  }, [roomId, userId, markAsRead, membershipInfo, isAdmin]);

  if (!messages) {
    return <div className="loading loading-spinner mx-auto"></div>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[hsl(var(--foreground)/0.6)]">
        {t("no-messages")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-8">
      {messages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          userId={userId}
          roomId={roomId}
        />
      ))}
    </div>
  );
}

type MessageItemProps = {
  message: {
    _id: Id<"messages">;
    userId: string;
    content?: string;
    imageUrls: string[];
    replyToMessageId?: Id<"messages">;
    createdAt: number;
    editedAt?: number;
    reactions: Array<{
      _id: Id<"messageReactions">;
      userId: string;
      emoji: string;
    }>;
  };
  userId: string;
  roomId: Id<"chatRooms">;
};

export function MessageItem({ message, userId }: MessageItemProps) {
  const isMyMessage = message.userId === userId;
  const [showReactionPicker, setShowReactionPicker] = React.useState(false);

  const addReaction = useMutation(api.messages.addReaction);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const msgRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("message");

  const userInfo = trpc.users.getUserById.useQuery({ id: message.userId });

  const handleReaction = async (emoji: string) => {
    await addReaction({
      messageId: message._id,
      userId,
      emoji,
    });
    setShowReactionPicker(false);
  };

  const handleDelete = async () => {
    await deleteMessage({
      messageId: message._id,
      userId,
      isAdmin: false, // Should check actual admin status
    });
  };

  return (
    <div
      className={`flex flex-col gap-1 ${isMyMessage ? "items-end" : "items-start"} relative`}
      onMouseEnter={() => setShowReactionPicker(true)}
      onMouseLeave={() => setShowReactionPicker(false)}
    >
      <div className="text-muted-foreground text-xs space-x-4">
        <span>
          {userInfo.isLoading ? <Spinner size="sm" /> : userInfo.data?.name}
        </span>
        <time>
          {userInfo.isLoading ? (
            <Spinner />
          ) : (
            new Date(message.createdAt).toLocaleTimeString()
          )}
        </time>
      </div>
      <div className="flex gap-2 items-end max-w-[80%]">
        {isMyMessage && (
          <Confirmation
            message={t("deleted-message-message")}
            title={t("deleted-message")}
            onConfirm={handleDelete}
            buttonIcon={<Trash />}
            variant="destructive"
            buttonSize="icon"
          />
        )}
        <div
          className={cn(
            "px-4 py-2 rounded-lg shadow relative",
            isMyMessage
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground",
          )}
          ref={msgRef}
        >
          {message.content && <p>{message.content}</p>}
          {message.imageUrls.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {userInfo.isLoading ? (
                <Spinner />
              ) : (
                message.imageUrls.map((url, idx) => (
                  <Image
                    key={idx}
                    src={url}
                    alt={`Message image ${idx + 1}`}
                    width={300}
                    height={300}
                    className="rounded-lg"
                  />
                ))
              )}
            </div>
          )}
          {message.editedAt && (
            <span className="text-xs opacity-50 italic">(edited)</span>
          )}
          {message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1 absolute -bottom-3 left-3">
              {message.reactions.map((reaction) => (
                <span key={reaction._id} className="text-sm">
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}
        </div>
        {showReactionPicker && (
          <EmojiPicker handleReaction={handleReaction} msgRef={msgRef} />
        )}
      </div>
    </div>
  );
}

const EmojiPicker = ({
  msgRef,
  handleReaction,
}: {
  msgRef: React.RefObject<HTMLDivElement | null>;
  handleReaction: (emoji: string) => void;
}) => {
  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const element = msgRef.current;
    if (!element) return;

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.bottom,
        left: rect.left - 100,
      });
    };

    updatePosition();

    // Update position on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [msgRef]);

  if (!position) return null;

  return createPortal(
    <Card
      className="absolute flex flex-row gap-2 p-2 z-10 bg-background border border-primary"
      style={{ top: position.top, left: position.left }}
    >
      {commonEmojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleReaction(emoji)}
          className="hover:scale-125 transition-transform text-lg"
        >
          {emoji}
        </button>
      ))}
    </Card>,
    document.body,
  );
};
