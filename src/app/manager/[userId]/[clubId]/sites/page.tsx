import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { getSitesForClub } from "@/server/api/routers/sites";
import { CreateSite } from "@/components/modals/manageSite";
import createLink, { createHref } from "@/lib/createLink";
import { getUserById } from "@/server/api/routers/users";
import LockedButton from "@/components/ui/lockedButton";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getHref } from "@/lib/getHref";
import SiteContent from "./siteContent";

export default async function ManageSites({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string; userId: string }>;
  searchParams: Promise<{ siteId: string }>;
}) {
  const { clubId, userId } = await params;
  const { siteId } = await searchParams;
  const user = await getUserById(userId, { withFeatures: true });
  if (!user) redirect("/", RedirectType.replace);
  const t = await getTranslations("club");
  const href = await getHref();
  if (
    user.internalRole !== "MANAGER" &&
    user.internalRole !== "MANAGER_COACH" &&
    user.internalRole !== "ADMIN"
  )
    return <div>{t("manager-only")}</div>;

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const clubQuery = await caller.clubs.getClubById({ clubId, userId: user.id });
  const siteQuery = await getSitesForClub(clubId, user.id);
  if (siteQuery.length && !siteId)
    redirect(createLink({ siteId: siteQuery[0]?.id }, href), RedirectType.push);

  const siteList = siteQuery.map((site) => ({
    id: site.id,
    name: site.name,
    link: createLink({ siteId: site.id }, href),
  }));

  return (
    <LayoutPage
      preTitle={clubQuery?.name}
      title={t("site.manage-my-sites", {
        count: siteQuery.length,
      })}
      titleComponents={
        <div className="flex items-center gap-4 justify-between">
          {user.features.includes("MANAGER_MULTI_SITE") ||
          !siteQuery?.length ? (
            <CreateSite clubId={clubId} />
          ) : (
            <LockedButton label={t("site.create")} limited />
          )}
          <Link
            className="btn-outline btn btn-primary"
            href={createHref(href, ["manager", userId, "clubs"], { clubId })}
          >
            {t("site.back-to-clubs")}
          </Link>
        </div>
      }
    >
      <LayoutPage.Main>
        <LayoutPage.List
          list={siteList}
          itemId={siteId}
          noItemsText={t("site.no-sites")}
        />

        {siteId === "" ? null : (
          <SiteContent userId={userId} clubId={clubId} siteId={siteId} />
        )}
      </LayoutPage.Main>
    </LayoutPage>
  );
}
