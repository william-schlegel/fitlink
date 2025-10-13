import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { headers } from "next/headers";
import Link from "next/link";

import { CreateSubscription } from "@/components/modals/manageSubscription";
import { getSubscriptionsForClub } from "@/server/api/routers/subscription";
import createLink, { createHref } from "@/lib/createLink";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { SubscriptionContent } from "./pageContent";
import { getActualUser } from "@/lib/auth/server";
import Title from "@/components/title";

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
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const clubQuery = await caller.clubs.getClubById({ clubId, userId });
  const siteQuery = await getSubscriptionsForClub(clubId);
  const headerList = await headers();
  const href = headerList.get("x-current-href");
  if (siteQuery.length && !subscriptionId)
    redirect(createLink({ subscriptionId: siteQuery[0]?.id }, href));

  const listSubscriptions = siteQuery?.map((site) => ({
    id: site.id,
    name: site.name,
    link: createLink({ subscriptionId: site.id }, href),
  }));

  return (
    <LayoutPage
      title={t("subscription.manage-my-subscriptions", {
        count: siteQuery?.length ?? 0,
      })}
      titleComponents={
        <div className="flex items-center gap-4 justify-between">
          <CreateSubscription clubId={clubId} />
          <Link
            className="btn-outline btn btn-primary"
            href={createHref(href, ["manager", userId, "clubs"], {
              clubId: clubId,
            })}
          >
            {t("subscription.back-to-clubs")}
          </Link>
        </div>
      }
    >
      <LayoutPage.Main>
        <LayoutPage.List
          list={listSubscriptions}
          itemId={subscriptionId}
          noItemsText={t("subscription.no-subscription")}
        />

        {subscriptionId === "" ? null : (
          <SubscriptionContent
            userId={userId}
            clubId={clubId}
            subscriptionId={subscriptionId}
          />
        )}
      </LayoutPage.Main>
    </LayoutPage>
  );
}
