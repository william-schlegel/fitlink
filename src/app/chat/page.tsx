"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useTranslations } from "next-intl";

import { Id } from "../../../convex/_generated/dataModel";
import { LayoutPage } from "@/components/layoutPage";
import ButtonIcon from "@/components/ui/buttonIcon";
import { MessageInput } from "./MessageInput";
import { useUser } from "@/lib/auth/client";
import { MessageList } from "./MessageList";
import { UserSearch } from "./UserSearch";
import { RoomList } from "./RoomList";

export default function ConvexChat() {
  const searchParams = useSearchParams();
  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const isAdmin = user?.internalRole === "ADMIN";
  const roomIdParam = searchParams.get("roomId");
  const [replyToMessageId, setReplyToMessageId] =
    useState<Id<"messages"> | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const t = useTranslations("message");
  const roomId = roomIdParam as Id<"chatRooms"> | null;

  if (!userId) {
    return <div>{t("login-to-use-chat")}</div>;
  }

  return (
    <LayoutPage title={t("my-chat")}>
      <LayoutPage.Main className="min-h-[calc(100vh-15rem)]">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{t("conversations")}</h2>
            <button
              type="button"
              onClick={() => setShowUserSearch(true)}
              // className="btn btn-sm btn-primary"
              title={t("search-users")}
            >
              <ButtonIcon
                iconComponent={<i className="bx bx-search" />}
                title={t("search-users")}
              />
            </button>
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
              {t("no-room-selected")}
            </div>
          )}
        </div>
      </LayoutPage.Main>
      {showUserSearch && (
        <UserSearch
          currentUserId={userId}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </LayoutPage>
  );
}
