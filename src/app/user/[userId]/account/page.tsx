import { getTranslations } from "next-intl/server";

import { createTrpcCaller } from "@/lib/trpc/caller";
import FormAccount from "./formAccount";
import Title from "@/components/title";

export default async function Account({
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
      withImage: true,
      withMemberData: true,
      withPricing: true,
    },
  });
  console.log(userData);
  const t = await getTranslations("auth");

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("account.your-account")} />
      <h1>{t("account.your-account")}</h1>
      <FormAccount userData={userData} />
    </div>
  );
}
