import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";

import { Plus } from "lucide-react";

import Title from "@/components/title";
import { Button } from "@/components/ui/shadcn";
import { UserId } from "@/db/types";
import { getActualUser } from "@/lib/auth/server";
import { createTrpcCaller } from "@/lib/trpc/caller";
import PlanningAndReservations from "./reservations";
import Subscription from "./subscription";

/***
 *
 *  Member dashboard
 *
 */

export default async function MemberDashboard({
  params,
}: {
  params: Promise<{ userId: UserId }>;
}) {
  const user = await getActualUser();
  const userId = (await params).userId;
  if (
    !user ||
    (user.internalRole !== "MEMBER" && user.internalRole !== "ADMIN")
  ) {
    redirect("/", RedirectType.replace);
  }
  const t = await getTranslations("dashboard");
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const queryUser = await caller.users.getUserById({
    id: userId,
    options: {
      withMemberData: true,
    },
  });

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("member.dashboard")} />
      <h1 className="flex gap-4">
        {t("member.dashboard")}
        <Button asChild>
          <Link href={`/member/${user.id}/subscribe`}>
            <Plus />
            {t("member.new-subscription")}
          </Link>
        </Button>
      </h1>
      <h2>
        {t("member.my-subscription", {
          count: queryUser?.memberData?.subscriptions?.length ?? 0,
        })}
      </h2>
      <section className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(20rem,30rem))] justify-center gap-4">
        {queryUser?.memberData?.subscriptions?.map((sub) => (
          <Subscription
            key={sub.subscriptionId}
            subscription={sub.subscription}
          />
        ))}
      </section>
      <section className="grid auto-rows-auto gap-2 lg:grid-cols-2">
        <PlanningAndReservations userId={userId} />
      </section>
    </div>
  );
}
