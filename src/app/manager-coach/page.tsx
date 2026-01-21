import { notFound } from "next/navigation";

import { getTranslations } from "next-intl/server";

import Title from "@/components/title";
import SelectCoachManager from "./selectCoachManager";

export default async function ManagerCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ userId: string }>;
}) {
  const { userId } = await searchParams;
  if (!userId) notFound();
  const t = await getTranslations("dashboard");
  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("manager-coach.dashboard")} />
      <h1>{t("manager-coach.dashboard")}</h1>
      <SelectCoachManager
        hrefCoach={`/coach/${userId}`}
        hrefManager={`/manager/${userId}`}
      />
    </div>
  );
}
