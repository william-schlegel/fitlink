"use client";

import Link from "next/link";

import { useTranslations } from "next-intl";

import { LayoutPage } from "../../components/layoutPage";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";

type RoomListProps = {
  userId: string;
  currentRoomId?: string;
};

export function RoomList({ userId, currentRoomId }: RoomListProps) {
  const rooms = useQuery(api.messages.getRoomsForUser, { userId });
  const t = useTranslations("message");

  if (!rooms) {
    return <div className="loading loading-spinner"></div>;
  }

  if (rooms.length === 0) {
    return <div className="p-4">No chat rooms available</div>;
  }
  const roomList = rooms.map((room) => ({
    id: room._id,
    name: room.name,
    link: `/chat?roomId=${room._id}`,
    badgeText: room.unreadCount > 0 ? room.unreadCount.toString() : undefined,
    badgeColor: room.unreadCount > 0 ? "badge-primary" : undefined,
    badgeIcon: room._id === currentRoomId ? "bx bx-check-circle" : undefined,
  }));

  return (
    // <ul className="menu bg-base-100 w-full p-2">
    //   {rooms.map((room) => (
    //     <li key={room._id}>
    //       <Link
    //         href={`/chat?roomId=${room._id}`}
    //         className={currentRoomId === room._id ? "active" : ""}
    //       >
    //         <div className="flex items-center justify-between w-full">
    //           <span>{room.name || "Direct Message"}</span>
    //           {room.unreadCount > 0 && (
    //             <span className="badge badge-primary badge-sm">
    //               {room.unreadCount}
    //             </span>
    //           )}
    //         </div>
    //       </Link>
    //     </li>
    //   ))}
    // </ul>
    <LayoutPage.List
      list={roomList}
      itemId={currentRoomId}
      noItemsText={t("no-channel")}
    />
  );
}
