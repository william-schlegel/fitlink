import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getActualUser } from "@/lib/auth/server";
import Title from "@/components/title";

export default async function Chat() {
  const t = await getTranslations("dashboard");
  const user = await getActualUser();
  if (!user) redirect("/", RedirectType.replace);

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("my-chat")} />
      <h1>{t("my-chat")}</h1>
      {user?.name}
    </div>
  );
}
