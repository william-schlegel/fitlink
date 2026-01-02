"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";

import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";
import ButtonIcon from "@/components/ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import { useAction } from "convex/react";

type UserSearchProps = {
  currentUserId: string;
  onClose: () => void;
};

export function UserSearch({ currentUserId, onClose }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const t = useTranslations("message");
  const router = useRouter();
  const createDirectRoom = useAction(api.actions.createDirectMessageRoom);

  // Search users via tRPC
  const { data: searchResults, isLoading } = trpc.users.searchUsers.useQuery(
    {
      query: searchQuery,
      limit: 20,
    },
    {
      enabled: isSearching && searchQuery.length > 0,
    },
  );

  const handleSearch = () => {
    setIsSearching(true);
  };

  const handleStartConversation = async (otherUserId: string) => {
    try {
      const roomId = await createDirectRoom({
        userId1: currentUserId,
        userId2: otherUserId,
      });
      router.push(`/chat?roomId=${roomId}`);
      onClose();
    } catch (error) {
      console.error("Error creating direct room:", error);
      alert("Failed to start conversation");
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{t("search-users")}</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={t("search-placeholder")}
            className="input input-bordered flex-1"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="btn btn-primary"
            disabled={!searchQuery.trim()}
          >
            <i className="bx bx-search" />
          </button>
        </div>

        {isSearching && isLoading && (
          <div className="loading loading-spinner mx-auto"></div>
        )}

        {isSearching && searchResults && (
          <div className="max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-center text-[hsl(var(--foreground)/0.6)]">
                {t("no-users-found")}
              </p>
            ) : (
              <ul className="menu">
                {searchResults
                  .filter((user) => user.id !== currentUserId)
                  .map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleStartConversation(user.id)}
                        className="flex items-center gap-3 p-3 hover:bg-shadcn-muted rounded-lg"
                      >
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full">
                            <Image
                              src={user.image ?? "/images/dummy.jpg"}
                              alt={user.name ?? ""}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold">{user.name}</div>
                          {user.email && (
                            <div className="text-sm text-[hsl(var(--foreground)/0.6)]">
                              {user.email}
                            </div>
                          )}
                        </div>
                        <i className="bx bx-message-rounded-add text-xl" />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        <div className="modal-action">
          <button type="button" onClick={onClose} className="btn">
            {t("close")}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
