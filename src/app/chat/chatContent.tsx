"use client";

import { FormEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import Image from "next/image";
import Link from "next/link";

import { inferProcedureOutput } from "@trpc/server";

import { REACTIONS, useChannel } from "@/components/modals/manageChat";
import { ChannelTypeEnum, ReactionTypeEnum } from "@/db/schema/enums";
import { useHover, useOnClickOutside } from "@/lib/useHover";
import { formatDifference } from "@/lib/dates/difference";
import { AppRouter } from "@/server/api/root";
import createLink from "@/lib/createLink";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

type MessageProps = {
  messageId: string;
  from: string;
  messageDate: Date;
  message: string;
  reactions: ReactionTypeEnum[];
  myMessage: boolean;
  userId: string;
  channelId: string;
  replyId: string | null;
  onReply: (id: string, message: string) => void;
};

type ChatContentProps = {
  messages: inferProcedureOutput<AppRouter["chat"]["getMessagesForChannel"]>;
  userId: string;
  channelId: string;
};

export default function ChatContent({
  messages,
  userId,
  channelId,
}: ChatContentProps) {
  const t = useTranslations("message");
  const [message, setMessage] = useState("");
  const [replyData, setReplyData] = useState({ id: "", message: "" });

  const createMessage = trpc.chat.sendMessageToChannel.useMutation();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (message) {
      createMessage.mutate({
        channelId,
        userId,
        content: message,
        replyToMessageId: replyData.id !== "" ? replyData.id : undefined,
      });
    }
    setMessage("");
    setReplyData({ id: "", message: "" });
  }

  return (
    <div className="grid max-h-[80vh] grid-rows-[1fr,auto] overflow-hidden border border-primary">
      <div className="flex flex-col-reverse gap-3 p-4">
        {messages.length ? null : (
          <span className="mb-auto">{t("no-message-yet")}</span>
        )}
        {messages.map((message) => (
          <Message
            key={message.id}
            messageId={message.id}
            from={message.author?.name ?? ""}
            message={message.content ?? ""}
            myMessage={message.author?.id === userId}
            reactions={message.reactions.map((r) => r.type)}
            userId={userId}
            channelId={channelId}
            messageDate={message.createdAt}
            replyId={message.replies[0]?.id ?? null}
            onReply={(id, message) => setReplyData({ id, message })}
          />
        ))}
      </div>
      <form
        onSubmit={(e) => onSubmit(e)}
        className="mt-auto border-t border-primary bg-base-100 p-2"
      >
        {replyData.id ? (
          <div className="space-x-2">
            <span className="text-primary">{t("reply-to")}</span>
            <span className="truncate">{replyData.message}</span>
          </div>
        ) : null}
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-transparent px-4 py-2"
          placeholder={t("new-message") ?? ""}
        />
      </form>
    </div>
  );
}

function Message({
  userId,
  channelId,
  messageId,
  from,
  message,
  reactions,
  myMessage,
  messageDate,
  replyId,
  onReply,
}: MessageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hovered = useHover(ref);
  const [showReactions, setShowReactions] = useState(false);
  const utils = trpc.useUtils();
  useOnClickOutside(ref, () => setShowReactions(false));
  const t = useTranslations("message");

  const addReaction = trpc.chat.addReactionToMessage.useMutation({
    onSuccess() {
      utils.chat.getMessagesForChannel.invalidate({
        channelId,
      });
    },
  });
  const reply = trpc.chat.getMessageById.useQuery(
    { messageId: replyId ?? "" },
    {
      enabled: isCUID(replyId),
    },
  );

  function onClickReaction(reaction: ReactionTypeEnum) {
    addReaction.mutate({
      userId,
      messageId,
      reaction,
    });
    setShowReactions(false);
  }

  return (
    <div ref={ref} className={`chat ${myMessage ? "chat-end" : "chat-start"}`}>
      {myMessage ? (
        <div className="chat-header space-x-2">
          <span className="text-xs text-primary">
            {formatDifference(messageDate)}
          </span>
        </div>
      ) : (
        <div className="chat-header space-x-2">
          <span>{from}</span>
          <span className="text-xs text-primary">
            {formatDifference(messageDate)}
          </span>
        </div>
      )}
      <div
        className={`chat-bubble relative ${
          myMessage ? "chat-bubble-secondary" : "chat-bubble-primary"
        }`}
      >
        {reply?.data?.content ? (
          <div
            className={`${
              myMessage
                ? "bg-primary text-primary-content"
                : "bg-secondary text-secondary-content"
            } truncate rounded-lg p-2 text-sm`}
          >
            <p className={`text-xs text-gray-500`}>
              {reply.data?.author?.name}
            </p>
            <p>{reply.data?.content}</p>
          </div>
        ) : null}
        {message}
        {reactions.length ? (
          <Reactions reactions={reactions} myMessage={myMessage} />
        ) : null}
        <div
          className={`absolute ${hovered ? "flex" : "hidden"} ${
            myMessage ? "-left-16 flex-row-reverse" : "-right-16"
          } top-1/2 -translate-y-1/2`}
        >
          <button onClick={() => onReply(messageId, message)}>
            <div className="tooltip" data-tip={t("reply")}>
              <i className="bx bx-reply bx-sm" />
            </div>
          </button>
          <button onClick={() => setShowReactions(true)}>
            <div className="tooltip" data-tip={t("react")}>
              <i className="bx bx-happy bx-sm" />
            </div>
          </button>
        </div>
        {showReactions ? (
          <ul
            className={`absolute rounded-full border bg-base-100 p-1 px-2 text-lg ${
              myMessage
                ? "-left-32 border-secondary"
                : "-right-32 border-primary"
            }`}
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.value}
                onClick={() => onClickReaction(reaction.value)}
              >
                <div
                  className="tooltip"
                  data-tip={t(`reaction.${reaction.value}`)}
                >
                  {reaction.label}
                </div>
              </button>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

type ReactionsProps = {
  reactions: ReactionTypeEnum[];
  myMessage: boolean;
};

function Reactions({ reactions, myMessage }: ReactionsProps) {
  const { getReaction } = useChannel();
  const reacts = reactions.reduce((acc, r) => {
    acc.set(r, (acc.get(r) ?? 0) + 1);
    return acc;
  }, new Map<ReactionTypeEnum, number>());

  return (
    <div
      className={`absolute ${
        myMessage ? "right-4" : "left-4"
      } -bottom-4 flex rounded-full border ${
        myMessage ? "border-secondary" : "border-primary"
      } bg-base-100 p-1 px-2 text-xs`}
    >
      {Array.from(reacts).map((reaction, idx) => (
        <span
          key={idx}
          className="tooltip tooltip-left cursor-pointer"
          data-tip={reaction[1]}
        >
          {getReaction(reaction[0])}
        </span>
      ))}
    </div>
  );
}

type ChannelProps = {
  id: string;
  name: string;
  groupImage: string;
  selected: boolean;
  type: ChannelTypeEnum;
  owner: boolean;
};

export function Channel({
  id,
  name,
  groupImage,
  selected,
  type,
  owner,
}: ChannelProps) {
  const { getChannelName } = useChannel();
  return (
    <Link
      href={createLink({ channelId: id })}
      className={`flex w-full flex-col items-center gap-4 p-2 lg:flex-row lg:p-4 ${
        selected
          ? "bg-secondary text-secondary-content"
          : "bg-base-100 text-base-content"
      }`}
    >
      <Image
        src={groupImage}
        alt=""
        className={`aspect-square w-12 rounded-full outline outline-offset-2 ${
          owner ? "outline-accent" : "outline-primary"
        }`}
      />
      <div className="text-sm lg:text-xl lg:font-semibold">{name}</div>
      <div className="hidden lg:ml-auto lg:badge-primary lg:badge">
        {getChannelName(type)}
      </div>
    </Link>
  );
}
