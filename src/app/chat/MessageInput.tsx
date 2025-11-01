"use client";

import { useState } from "react";

import Image from "next/image";

import { Id } from "../../../convex/_generated/dataModel";
import { UploadButton } from "@/components/uploadthing";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";

type MessageInputProps = {
  roomId: Id<"chatRooms">;
  userId: string;
  replyToMessageId?: Id<"messages"> | null;
  onReplyCancel?: () => void;
};

export function MessageInput({
  roomId,
  userId,
  replyToMessageId,
  onReplyCancel,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imageUrls.length === 0) return;

    try {
      await sendMessage({
        roomId,
        userId,
        content: content.trim() || undefined,
        imageUrls,
        replyToMessageId: replyToMessageId ?? undefined,
      });
      setContent("");
      setImageUrls([]);
      if (onReplyCancel) onReplyCancel();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
      {replyToMessageId && (
        <div className="alert alert-info">
          <span>Replying to message</span>
          {onReplyCancel && (
            <button
              type="button"
              onClick={onReplyCancel}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="input input-bordered flex-1"
        />
        <UploadButton
          endpoint="messageAttachment"
          onClientUploadComplete={(res) => {
            if (res) {
              setImageUrls((prev) => [...prev, ...res.map((file) => file.url)]);
            }
          }}
          onUploadError={(error) => {
            console.error("Upload error:", error);
            alert("Failed to upload image");
          }}
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </div>
      {imageUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {imageUrls.map((url, idx) => (
            <div key={idx} className="relative">
              <Image
                src={url}
                alt={`Preview ${idx + 1}`}
                width={100}
                height={100}
                className="rounded-lg"
              />
              <button
                type="button"
                onClick={() =>
                  setImageUrls((prev) => prev.filter((_, i) => i !== idx))
                }
                className="btn btn-xs btn-circle btn-error absolute top-0 right-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
