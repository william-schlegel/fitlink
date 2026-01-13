import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Star } from "lucide-react";

import {
  LayoutPage,
  LayoutPageMain,
  LayoutPageList,
} from "@/components/layoutPage";
import { NewGroup } from "@/components/modals/manageActivity";
import { BadgeVariant } from "@/components/ui/shadcn";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { AGContent } from "./agContent";

export default async function ActivityGroupManagement({
  searchParams,
}: {
  searchParams: Promise<{ agId?: string }>;
}) {
  const user = await getActualUser();
  if (!user) redirect("/", RedirectType.replace);
  const t = await getTranslations("admin");
  const agId = (await searchParams).agId;
  if (user.internalRole !== "ADMIN") return <div>{t("admin-only")}</div>;

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const agQuery = await caller.activities.getAllActivityGroups();
  const agList = agQuery.map((ag) => ({
    id: ag.id,
    name: ag.name,
    link: `/admin/activitygroups?agId=${ag.id}`,
    badgeVariant: ag.default ? "default" : ("secondary" as BadgeVariant),
    badgeText: ag.default ? undefined : ag.coach?.user.name,
    badgeIcon: ag.default ? (
      <Star className="fill-yellow-500 size-4" />
    ) : undefined,
  }));

  if (!agId && agQuery[0]?.id)
    redirect(
      `/admin/activitygroups?agId=${agQuery[0]?.id || ""}`,
      RedirectType.replace,
    );

  return (
    <LayoutPage title={t("ag.manage-ag")} titleComponents={<NewGroup />}>
      <LayoutPageMain>
        <LayoutPageList
          list={agList}
          itemId={agId}
          noItemsText={t("ag.no-groups")}
        >
          <h3>{t("ag.groups")}</h3>
        </LayoutPageList>
        {agId ? <AGContent agId={agId} /> : null}
      </LayoutPageMain>
    </LayoutPage>
  );
}
