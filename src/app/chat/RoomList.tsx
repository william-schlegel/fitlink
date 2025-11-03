"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { Id } from "../../../convex/_generated/dataModel";
import { LayoutPage } from "../../components/layoutPage";
import { api } from "../../../convex/_generated/api";
import { trpc } from "@/lib/trpc/client";
import { useQuery } from "convex/react";
import { isCUID } from "@/lib/utils";

type RoomListProps = {
  userId: string;
  currentRoomId?: string;
  isAdmin?: boolean;
};

type DirectConversationItemProps = {
  conv: {
    roomId: Id<"chatRooms">;
    otherUserId: string;
    lastMessage: {
      content?: string;
      createdAt: number;
      userId: string;
    } | null;
    unreadCount: number;
  };
  currentRoomId?: string;
};

function DirectConversationItem({ conv }: DirectConversationItemProps) {
  const { data: otherUser } = trpc.users.getUserById.useQuery({
    id: conv.otherUserId,
    options: { withImage: true },
  });

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="avatar">
        <div className="w-8 h-8 rounded-full">
          <Image
            src={otherUser?.profileImageUrl ?? "/images/dummy.jpg"}
            alt={otherUser?.name ?? ""}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold truncate">
          {otherUser?.name ?? "..."}
        </span>
        {conv.lastMessage && (
          <span className="text-xs text-base-content/60 truncate">
            {conv.lastMessage.content}
          </span>
        )}
      </div>
    </div>
  );
}
function RoomItem({ clubId, userId }: { clubId: string; userId: string }) {
  const { data: club } = trpc.clubs.getClubById.useQuery(
    {
      clubId: clubId,
      userId: userId,
    },
    { enabled: isCUID(clubId) && Boolean(userId) },
  );

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="avatar">
        <div className="w-8 h-8 rounded-full">
          <Image
            src={club?.logoUrl ?? "/images/dummy.jpg"}
            alt={club?.name ?? ""}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      </div>
      <span className="font-semibold truncate">{club?.name ?? "..."}</span>
    </div>
  );
}
export function RoomList({
  userId,
  currentRoomId,
  isAdmin = false,
}: RoomListProps) {
  const rooms = useQuery(api.messages.getRoomsForUser, { userId, isAdmin });
  const directConversations = useQuery(api.messages.getDirectConversations, {
    userId,
    isAdmin,
  });
  const t = useTranslations("message");

  if (!rooms || !directConversations) {
    return <div className="loading loading-spinner"></div>;
  }

  // Create room list items for group rooms
  const roomList = rooms
    .filter((room) => room.type !== "DIRECT")
    .map((room) => ({
      id: room._id,
      name: <RoomItem clubId={room.clubId!} userId={userId} />,
      link: `/chat?roomId=${room._id}`,
      badgeText: room.unreadCount > 0 ? room.unreadCount.toString() : undefined,
      badgeColor: room.unreadCount > 0 ? "badge-primary" : undefined,
      badgeIcon: room._id === currentRoomId ? "bx bx-check-circle" : undefined,
    }));

  if (directConversations.length === 0 && roomList.length === 0) {
    return <div className="p-4">{t("no-channel")}</div>;
  }

  const directList = directConversations.map((conv) => ({
    id: conv.roomId,
    name: (
      <>
        <DirectConversationItem conv={conv} />
      </>
    ),
    link: `/chat?roomId=${conv.roomId}`,
    badgeText: conv.unreadCount > 0 ? conv.unreadCount.toString() : undefined,
    badgeColor: conv.unreadCount > 0 ? "badge-primary" : undefined,
    badgeIcon: conv.roomId === currentRoomId ? "bx bx-check-circle" : undefined,
  }));

  return (
    <LayoutPage.Lists
      lists={[
        { name: t("direct-messages"), items: directList },
        { name: t("group-rooms"), items: roomList },
      ]}
      noItemsText={t("no-channel")}
    />
  );
}
