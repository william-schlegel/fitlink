"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { LayoutPage, LayoutPageMain } from "@/components/layoutPage";
import { Id } from "../../../convex/_generated/dataModel";

import { useUser } from "@/lib/auth/client";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { RoomList } from "./RoomList";
import { UserSearch } from "./UserSearch";

export default function ConvexChat() {
  const searchParams = useSearchParams();
  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const isAdmin = user?.internalRole === "ADMIN";
  const roomIdParam = searchParams.get("roomId");
  const [replyToMessageId, setReplyToMessageId] =
    useState<Id<"messages"> | null>(null);
  const t = useTranslations("message");
  const roomId = roomIdParam as Id<"chatRooms"> | null;

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64 text-[hsl(var(--foreground)/0.6)]">
        {t("login-to-use-chat")}
      </div>
    );
  }

  return (
    <LayoutPage title={t("my-chat")}>
      <LayoutPageMain className="min-h-[calc(100vh-15rem)]">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{t("conversations")}</h2>
            <UserSearch currentUserId={userId} />
          </div>
          <RoomList
            userId={userId}
            currentRoomId={roomId ?? undefined}
            isAdmin={isAdmin}
          />
        </div>
        <div className="flex flex-col flex-1">
          {roomId ? (
            <>
              <div className="flex-1 overflow-y-auto">
                <MessageList
                  roomId={roomId}
                  userId={userId}
                  isAdmin={isAdmin}
                />
              </div>
              <div className="border-t border-shadcn">
                <MessageInput
                  roomId={roomId}
                  userId={userId}
                  replyToMessageId={replyToMessageId}
                  onReplyCancel={() => setReplyToMessageId(null)}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[hsl(var(--foreground)/0.6)]">
              {t("no-room-selected")}
            </div>
          )}
        </div>
      </LayoutPageMain>
    </LayoutPage>
  );
}
