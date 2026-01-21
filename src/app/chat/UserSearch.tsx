"use client";

import { useAction } from "convex/react";
import { MessageCirclePlus, Search, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Field,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/shadcn/input-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/shadcn/item";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { tryCatch } from "@/lib/errors/utils";
import { trpc } from "@/lib/trpc/client";
import { api } from "../../../convex/_generated/api";

type UserSearchProps = {
  currentUserId: string;
};

export function UserSearch({ currentUserId }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
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
    const result = await tryCatch(
      createDirectRoom({
        userId1: currentUserId,
        userId2: otherUserId,
      }),
    );

    if (result.success) {
      router.push(`/chat?roomId=${result.data}`);
      setOpen(false);
    } else {
      console.error("Error creating direct room:", result.error);
      alert("Failed to start conversation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <DialogTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Search />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("search-users")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>

      <DialogContent size="sm">
        <DialogTitle>{t("search-users")}</DialogTitle>
        <Field>
          <InputGroup>
            <InputGroupInput
              placeholder={t("search-placeholder")}
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
            <InputGroupAddon>
              <InputGroupButton onClick={handleSearch}>
                <Search />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <ScrollArea className="h-96">
          {searchResults && searchResults.length === 0 ? (
            <p className="text-center text-muted-foreground">
              {t("no-users-found")}
            </p>
          ) : (
            searchResults &&
            searchResults.length > 0 &&
            searchResults
              .filter((user) => user.id !== currentUserId)
              .map((user) => (
                <Button
                  key={user.id}
                  onClick={() => handleStartConversation(user.id)}
                  asChild
                  variant="ghost"
                  className="w-full h-full"
                >
                  <Item>
                    <ItemMedia>
                      <Avatar>
                        <AvatarImage src={user.image ?? "/images/dummy.jpg"} />
                        <AvatarFallback>
                          <UserIcon className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="font-semibold">
                        {user.name}
                      </ItemTitle>
                      {user.email && (
                        <ItemDescription>{user.email}</ItemDescription>
                      )}
                    </ItemContent>
                    <MessageCirclePlus />
                  </Item>
                </Button>
              ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
