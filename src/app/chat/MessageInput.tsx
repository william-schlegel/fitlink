"use client";

import { useMutation } from "convex/react";
import { ImagePlus, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/shadcn/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { UploadButton } from "@/components/uploadthing";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

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
  const t = useTranslations("message");

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
        <div className="flex items-center justify-between rounded-md bg-info/10 border border-info p-2 text-sm">
          <span>Replying to message</span>
          {onReplyCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReplyCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
      <InputGroup>
        <InputGroupInput
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("message-placeholder")}
          className="flex-1"
        />
        <InputGroupAddon align="inline-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton type="submit">
                  <Send />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("send")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton type="button">
                      <ImagePlus />
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("image-upload")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-max p-2">
              <UploadButton
                buttonText={t("image-upload")}
                endpoint="messageAttachment"
                onClientUploadComplete={(res) => {
                  if (res) {
                    setImageUrls((prev) => [
                      ...prev,
                      ...res.map((file) => file.url),
                    ]);
                  }
                }}
                onUploadError={(error) => {
                  console.error("Upload error:", error);
                  alert("Failed to upload image");
                }}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
      </InputGroup>
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
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() =>
                  setImageUrls((prev) => prev.filter((_, i) => i !== idx))
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
