"use client";

import { Home, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/shadcn/item";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  BadgeVariant,
} from "@/components/ui/shadcn";
import { LayoutPageLists } from "../../components/layoutPage";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { trpc } from "@/lib/trpc/client";
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
    <Item>
      <ItemMedia>
        <Avatar>
          <AvatarImage
            src={otherUser?.profileImageUrl}
            width={50}
            height={50}
          />
          <AvatarFallback>
            <UserIcon className="size-4" />
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-1">
          {otherUser?.name ?? "..."}
        </ItemTitle>
        {conv.lastMessage && (
          <ItemDescription className="line-clamp-1">
            {conv.lastMessage.content}
          </ItemDescription>
        )}
      </ItemContent>
    </Item>
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
    <Item>
      <ItemMedia>
        <Avatar>
          <AvatarImage src={club?.logoUrl ?? ""} />
          <AvatarFallback>
            <Home className="size-4" />
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="truncate">{club?.name ?? "..."}</ItemTitle>
      </ItemContent>
    </Item>
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
      badgeVariant: (room.unreadCount > 0
        ? "default"
        : undefined) as BadgeVariant,
    }));

  if (directConversations.length === 0 && roomList.length === 0) {
    return <div className="p-4">{t("no-channel")}</div>;
  }

  const directList = directConversations.map((conv) => ({
    id: conv.roomId,
    name: <DirectConversationItem conv={conv} />,
    link: `/chat?roomId=${conv.roomId}`,
    badgeText: conv.unreadCount > 0 ? conv.unreadCount.toString() : undefined,
    badgeVariant: (conv.unreadCount > 0
      ? "default"
      : undefined) as BadgeVariant,
  }));

  return (
    <LayoutPageLists
      itemId={currentRoomId}
      lists={[
        { name: t("direct-messages"), items: directList },
        { name: t("group-rooms"), items: roomList },
      ]}
      noItemsText={t("no-channel")}
    />
  );
}
