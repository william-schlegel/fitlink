import { getClubById } from "@/server/api/routers/clubs";
import { redirect } from "next/navigation";
import createLink, { createHref } from "@/lib/createLink";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getActualUser } from "@/lib/auth/server";
import Title from "@/components/title";
import Link from "next/link";
import { SubscriptionContent } from "./pageContent";
import { getSubscriptionsForClub } from "@/server/api/routers/subscription";
import { CreateSubscription } from "@/components/modals/manageSubscription";
import { twMerge } from "tailwind-merge";

export default async function ManageSubscriptions({
  params,
  searchParams,
}: {
  params: Promise<{
    userId: string;
    clubId: string;
  }>;
  searchParams: Promise<{
    subscriptionId: string;
  }>;
}) {
  const { userId, clubId } = await params;
  const t = await getTranslations("club");
  const user = await getActualUser();

  if (
    user?.internalRole !== "MANAGER" &&
    user?.internalRole !== "MANAGER_COACH" &&
    user?.internalRole !== "ADMIN"
  )
    return <div>{t("manager-only")}</div>;
  const { subscriptionId } = await searchParams;
  const clubQuery = await getClubById(clubId, userId);
  const siteQuery = await getSubscriptionsForClub(clubId);
  const headerList = await headers();
  const href = headerList.get("x-current-href");
  if (siteQuery.length && !subscriptionId)
    redirect(createLink({ subscriptionId: siteQuery[0]?.id }, href));

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title
        title={t("subscription.manage-my-subscriptions", {
          count: siteQuery?.length ?? 0,
        })}
      />
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-4">
            {t("subscription.manage-my-subscriptions", {
              count: siteQuery?.length ?? 0,
            })}
            <span className="text-secondary">{clubQuery?.name}</span>
          </h1>
          <CreateSubscription clubId={clubId} />
        </div>
        <Link
          className="btn-outline btn btn-primary"
          href={createHref(href, ["manager", userId, "clubs"], {
            clubId: clubId,
          })}
        >
          {t("subscription.back-to-clubs")}
        </Link>
      </div>
      <div className="flex gap-4">
        <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
          {siteQuery?.map((site) => (
            <li key={site.id}>
              <Link
                href={createLink({ subscriptionId: site.id }, href)}
                className={twMerge(
                  "w-full text-center",
                  subscriptionId === site.id && "badge badge-primary"
                )}
              >
                {site.name}
              </Link>
            </li>
          ))}
        </ul>

        {subscriptionId === "" ? null : (
          <SubscriptionContent
            userId={userId}
            clubId={clubId}
            subscriptionId={subscriptionId}
          />
        )}
      </div>
    </div>
  );
}
