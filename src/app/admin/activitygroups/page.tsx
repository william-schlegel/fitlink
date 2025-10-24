import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { NewGroup } from "@/components/modals/manageActivity";
import { LayoutPage } from "@/components/layoutPage";
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
    badgeColor: ag.default ? "badge-primary" : "badge-secondary",
    badgeText: ag.default ? undefined : ag.coach?.user.name,
    badgeIcon: ag.default ? "bx bxs-star bx-xs text-accent" : undefined,
  }));

  if (!agId && agQuery[0]?.id)
    redirect(
      `/admin/activitygroups?agId=${agQuery[0]?.id || ""}`,
      RedirectType.replace,
    );

  return (
    <LayoutPage title={t("ag.manage-ag")} titleComponents={<NewGroup />}>
      <LayoutPage.Main>
        <LayoutPage.List
          list={agList}
          itemId={agId}
          noItemsText={t("ag.no-groups")}
        >
          <h3>{t("ag.groups")}</h3>
        </LayoutPage.List>
        {agId ? <AGContent agId={agId} /> : null}
      </LayoutPage.Main>
    </LayoutPage>
  );
}
