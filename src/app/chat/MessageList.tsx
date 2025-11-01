"use client";
import React from "react";

import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { MessageItem } from "./MessageItem";

type MessageListProps = {
  roomId: Id<"chatRooms">;
  userId: string;
};

export function MessageList({ roomId, userId }: MessageListProps) {
  const messages = useQuery(api.messages.getMessages, { roomId });
  const markAsRead = useMutation(api.messages.markAsRead);

  // Mark as read when component mounts or roomId changes
  React.useEffect(() => {
    if (roomId) {
      markAsRead({ roomId, userId }).catch(console.error);
    }
  }, [roomId, userId, markAsRead]);

  if (!messages) {
    return <div className="loading loading-spinner mx-auto"></div>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-base-content/60">
        No messages yet. Start the conversation!
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
