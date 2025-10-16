import { getTranslations } from "next-intl/server";

import FindClub from "@/components/sections/findClub";
import { createTrpcCaller } from "@/lib/trpc/caller";
import Title from "@/components/title";

export default async function Subscribe({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const t = await getTranslations("auth");

  const userId = (await params).userId;
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const userQuery = await caller.users.getUserById({ id: userId });

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("new-subscription")} />
      <h1 className="flex justify-between">{t("new-subscription")}</h1>
      <h2>{t("find-club")}</h2>
      <p>{t("how-to-subscribe")}</p>
      <FindClub address={userQuery?.address ?? ""} />
    </div>
  );
}
