import Title from "@/components/title";
import { env } from "@/env";
import { getActualUser } from "@/lib/auth/server";
import { getTranslations } from "next-intl/server";
import { redirect, RedirectType } from "next/navigation";
import { StreamChat } from "stream-chat";

const client = StreamChat.getInstance(env.NEXT_PUBLIC_STREAMCHAT_API_KEY);

export default async function Chat() {
  const t = await getTranslations("dashboard");
  const user = await getActualUser();
  if (!user) redirect("/", RedirectType.replace);
  if (user.id && user.chatToken) {
    const token = user.chatToken;
    await client.connectUser(
      {
        id: user.id,
        name: user.name ?? "",
        image: user.image ?? "",
      },
      token
    );
  }

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("my-chat")} />
      <h1>{t("my-chat")}</h1>
      {user?.name}
    </div>
  );
}
