import { getTranslations } from "next-intl/server";

import { getUserById } from "@/server/api/routers/users";
import FormProfile from "./formProfile";

export default async function Profile({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const myUserId = (Array.isArray(userId) ? userId[0] : userId) || "";

  const userData = await getUserById(myUserId, {
    withImage: false,
    withMemberData: false,
  });
  const t = await getTranslations("auth");

  return (
    <div
      // title={t("profile.your-profile")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <h1>{t("profile.your-profile")}</h1>
      <FormProfile userData={userData} />
    </div>
  );
}
