import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChevronLeft } from "lucide-react";

import {
  LayoutPage,
  LayoutPageList,
  LayoutPageMain,
} from "@/components/layoutPage";
import { CreateSubscription } from "@/components/modals/manageSubscription";
import { Button } from "@/components/ui/shadcn";
import { ClubId, SubscriptionId, UserId } from "@/db/types";
import { getActualUser } from "@/lib/auth/server";
import createLink, { createHref } from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getSubscriptionsForClub } from "@/server/api/routers/subscription";
import { SubscriptionContent } from "./pageContent";

export default async function ManageSubscriptions({
  params,
  searchParams,
}: {
  params: Promise<{
    userId: UserId;
    clubId: ClubId;
  }>;
  searchParams: Promise<{
    subscriptionId: SubscriptionId;
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
  const siteQuery = await getSubscriptionsForClub(clubId);
  const href = await getHref();
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
          <Button asChild variant="outline" size="lg">
            <Link
              href={createHref(href, ["manager", userId, "clubs"], {
                clubId: clubId,
              })}
            >
              <ChevronLeft />
              {t("subscription.back-to-clubs")}
            </Link>
          </Button>
        </div>
      }
    >
      <LayoutPageMain>
        <LayoutPageList
          list={listSubscriptions}
          itemId={subscriptionId}
          noItemsText={t("subscription.no-subscription")}
        />

        {Boolean(subscriptionId) ? (
          <SubscriptionContent
            userId={userId}
            clubId={clubId}
            subscriptionId={subscriptionId}
          />
        ) : null}
      </LayoutPageMain>
    </LayoutPage>
  );
}
