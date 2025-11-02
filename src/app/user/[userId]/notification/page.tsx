import { getTranslations } from "next-intl/server";
import Title from "@/components/title";
import { NotificationPageClient } from "./NotificationPageClient";

export default async function ManageNotifications({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const t = await getTranslations("auth");

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("notification.my-notification", { count: 0 })} />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("notification.my-notification", { count: 0 })}</h1>
      </div>
      <NotificationPageClient userId={userId} />
    </div>
  );
}
