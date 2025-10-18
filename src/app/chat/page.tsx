import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { createHref } from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import ChatContent from "./chatContent";
import { isCUID } from "@/lib/utils";

const Chat = async ({
  searchParams,
}: {
  searchParams: Promise<{ channelId: string }>;
}) => {
  const t = await getTranslations("message");
  const user = await getActualUser();
  const { channelId } = await searchParams;
  const userId = user?.id ?? "";

  if (!user) redirect("/", RedirectType.replace);

  const caller = await createTrpcCaller();
  if (!caller) return null;

  const channels = await caller.chat.getChannelsForUser({ userId });

  const href = await getHref();
  if (!isCUID(channelId) && channels?.length)
    redirect(
      createHref(href, ["chat"], { channelId: channels[0].id }),
      RedirectType.replace,
    );

  const messages = isCUID(channelId)
    ? await caller.chat.getMessagesForChannel({ channelId })
    : [];

  const listChannels = channels?.map((channel) => ({
    id: channel.id,
    name: channel.name,
    link: createHref(href, ["chat"], { channelId: channel.id }),
  }));

  return (
    <LayoutPage title={t("my-chat")}>
      <LayoutPage.Main>
        <LayoutPage.List
          list={listChannels}
          itemId={channelId}
          noItemsText={t("no-channel")}
        />

        {channelId === "" ? null : (
          <ChatContent
            userId={userId}
            channelId={channelId}
            messages={messages}
          />
        )}
      </LayoutPage.Main>
    </LayoutPage>
  );
};

export default Chat;
