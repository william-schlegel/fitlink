"use client";

import { useTranslations } from "next-intl";
import React, { useRef } from "react";

import ButtonIcon from "@/components/ui/buttonIcon";

import Image from "next/image";

import { createPortal } from "react-dom";

import { Id } from "../../../convex/_generated/dataModel";
import Confirmation from "@/components/ui/confirmation";
import { api } from "../../../convex/_generated/api";
import Spinner from "@/components/ui/spinner";
import { useMutation } from "convex/react";
import { trpc } from "@/lib/trpc/client";

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
      className={`chat ${isMyMessage ? "chat-end" : "chat-start"} relative`}
      onMouseEnter={() => setShowReactionPicker(true)}
      onMouseLeave={() => setShowReactionPicker(false)}
    >
      <div className="chat-header">
        <span className="text-xs opacity-50">
          {userInfo.isLoading ? <Spinner size={12} /> : userInfo.data?.name}
        </span>
        <time className="text-xs opacity-50">
          {userInfo.isLoading ? (
            <Spinner />
          ) : (
            new Date(message.createdAt).toLocaleTimeString()
          )}
        </time>
      </div>
      <div
        className="chat-bubble bg-base-300 text-base-content relative"
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
      </div>
      {message.reactions.length > 0 && (
        <div className="flex gap-1 mt-1 absolute -bottom-3 right-6">
          {message.reactions.map((reaction) => (
            <span key={reaction._id} className="text-sm">
              {reaction.emoji}
            </span>
          ))}
        </div>
      )}
      {showReactionPicker && (
        <EmojiPicker handleReaction={handleReaction} msgRef={msgRef} />
      )}
      {isMyMessage && (
        <div className="absolute -right-3 bottom-3 z-10">
          <Confirmation
            message={t("deleted-message-message")}
            title={t("deleted-message")}
            onConfirm={handleDelete}
            buttonIcon={<i className="bx bx-trash" />}
            variant="Icon-Only-Secondary"
            buttonSize="xs"
          />
        </div>
      )}
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
  if (!msgRef.current) return null;
  const portalTarget = msgRef.current.getBoundingClientRect();

  return createPortal(
    <div
      className="absolute mb-2 flex gap-1 bg-base-100 p-2 rounded-lg shadow-lg z-10"
      style={{ top: portalTarget.bottom, left: portalTarget.left }}
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
    </div>,
    document.body,
  );
};
