import { getTranslations } from "next-intl/server";

import { createTrpcCaller } from "@/lib/trpc/caller";
import FormProfile from "./formProfile";
import Title from "@/components/title";

export default async function Profile({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const userData = await caller.users.getUserById({
    id: userId,
    options: {
      withImage: false,
      withMemberData: false,
    },
  });
  const t = await getTranslations("auth");

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("profile.your-profile")} />
      <h1>{t("profile.your-profile")}</h1>
      <FormProfile userData={userData} />
    </div>
  );
}
