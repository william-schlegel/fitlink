"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useTranslations } from "next-intl";

import { Id } from "../../../convex/_generated/dataModel";
import { LayoutPage } from "@/components/layoutPage";
import { MessageInput } from "./MessageInput";
import { useUser } from "@/lib/auth/client";
import { MessageList } from "./MessageList";
import { RoomList } from "./RoomList";

export default function ConvexChat() {
  const searchParams = useSearchParams();
  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const roomIdParam = searchParams.get("roomId");
  const [replyToMessageId, setReplyToMessageId] =
    useState<Id<"messages"> | null>(null);
  const t = useTranslations("message");
  const roomId = roomIdParam as Id<"chatRooms"> | null;

  if (!userId) {
    return <div>Please log in to use chat</div>;
  }

  return (
    <LayoutPage title={t("my-chat")}>
      <LayoutPage.Main className="min-h-[calc(100vh-15rem)]">
        <RoomList userId={userId} currentRoomId={roomId ?? undefined} />
        <div className="flex flex-col">
          {roomId ? (
            <>
              <div className="flex-1 overflow-y-auto">
                <MessageList roomId={roomId} userId={userId} />
              </div>
              <div className="border-t border-base-300">
                <MessageInput
                  roomId={roomId}
                  userId={userId}
                  replyToMessageId={replyToMessageId}
                  onReplyCancel={() => setReplyToMessageId(null)}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-base-content/60">
              Select a room to start chatting
            </div>
          )}
        </div>
      </LayoutPage.Main>
    </LayoutPage>
  );
}
