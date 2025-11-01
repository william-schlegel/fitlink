"use client";

import Image from "next/image";

import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";

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

  // Get user info for message author
  // Note: In a real implementation, you'd fetch user data from your database
  // For now, we'll just show the userId

  const handleReaction = async (emoji: string) => {
    await addReaction({
      messageId: message._id,
      userId,
      emoji,
    });
    setShowReactionPicker(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage({
        messageId: message._id,
        userId,
        isAdmin: false, // Should check actual admin status
      });
    }
  };

  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  return (
    <div
      className={`chat ${isMyMessage ? "chat-end" : "chat-start"} relative`}
      onMouseEnter={() => setShowReactionPicker(true)}
      onMouseLeave={() => setShowReactionPicker(false)}
    >
      <div className="chat-header">
        <span className="text-xs opacity-50">
          User {message.userId.slice(0, 8)}
        </span>
        <time className="text-xs opacity-50">
          {new Date(message.createdAt).toLocaleTimeString()}
        </time>
      </div>
      <div className="chat-bubble bg-base-300 text-base-content relative">
        {message.replyToMessageId && (
          <div className="text-xs opacity-70 mb-1 border-l-2 pl-2">
            Replying to message
          </div>
        )}
        {message.content && <p>{message.content}</p>}
        {message.imageUrls.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {message.imageUrls.map((url, idx) => (
              <Image
                key={idx}
                src={url}
                alt={`Message image ${idx + 1}`}
                width={300}
                height={300}
                className="rounded-lg"
              />
            ))}
          </div>
        )}
        {message.editedAt && (
          <span className="text-xs opacity-50 italic">(edited)</span>
        )}
      </div>
      {message.reactions.length > 0 && (
        <div className="flex gap-1 mt-1">
          {message.reactions.map((reaction) => (
            <span key={reaction._id} className="text-sm">
              {reaction.emoji}
            </span>
          ))}
        </div>
      )}
      {showReactionPicker && (
        <div className="absolute bottom-full mb-2 left-0 flex gap-1 bg-base-100 p-2 rounded-lg shadow-lg z-10">
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
        </div>
      )}
      {isMyMessage && (
        <button onClick={handleDelete} className="btn btn-ghost btn-xs mt-1">
          Delete
        </button>
      )}
    </div>
  );
}

import React from "react";
