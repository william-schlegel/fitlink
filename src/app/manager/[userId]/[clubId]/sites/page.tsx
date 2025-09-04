import { CreateSite } from "@/components/modals/manageSite";
import Title from "@/components/title";
import LockedButton from "@/components/ui/lockedButton";
import createLink, { createHref } from "@/lib/createLink";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";
import SiteContent from "./siteContent";
import { getClubById } from "@/server/api/routers/clubs";
import { getUserById } from "@/server/api/routers/users";
import { getSitesForClub } from "@/server/api/routers/sites";
import { headers } from "next/headers";
import { twMerge } from "tailwind-merge";

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
  const headerList = await headers();
  const href = headerList.get("x-current-href");
  if (
    user.internalRole !== "MANAGER" &&
    user.internalRole !== "MANAGER_COACH" &&
    user.internalRole !== "ADMIN"
  )
    return <div>{t("manager-only")}</div>;

  const clubQuery = await getClubById(clubId, user.id);
  const siteQuery = await getSitesForClub(clubId, user.id);
  if (siteQuery.length && !siteId)
    redirect(createLink({ siteId: siteQuery[0]?.id }, href), RedirectType.push);

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title
        title={t("site.manage-my-sites", {
          count: siteQuery.length,
        })}
      />
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-4">
            {t("site.manage-my-sites", { count: siteQuery?.length ?? 0 })}
            <span className="text-secondary">{clubQuery?.name}</span>
          </h1>
          {user.features.includes("MANAGER_MULTI_SITE") ||
          !siteQuery?.length ? (
            <CreateSite clubId={clubId} />
          ) : (
            <LockedButton label={t("site.create")} limited />
          )}
        </div>
        <Link
          className="btn-outline btn btn-primary ml-4"
          href={createHref(href, ["manager", userId, "clubs"], {
            clubId: clubId,
          })}
        >
          {t("site.back-to-clubs")}
        </Link>
      </div>
      <div className="flex gap-4">
        <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
          {siteQuery?.map((site) => (
            <li key={site.id}>
              <Link
                href={createLink({ siteId: site.id }, href)}
                className={twMerge(
                  "w-full text-center",
                  siteId === site.id && "badge badge-primary"
                )}
              >
                {site.name}
              </Link>
            </li>
          ))}
        </ul>

        {siteId === "" ? null : (
          <SiteContent userId={userId} clubId={clubId} siteId={siteId} />
        )}
      </div>
    </div>
  );
}
