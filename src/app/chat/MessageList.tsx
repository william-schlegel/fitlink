"use client";
import React from "react";

import { useTranslations } from "next-intl";

import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { MessageItem } from "./MessageItem";

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
    <div className="flex flex-col gap-2 p-4 overflow-y-auto">
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
