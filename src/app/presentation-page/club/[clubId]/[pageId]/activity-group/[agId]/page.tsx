import { notFound } from "next/navigation";

import { ActivityGroupDisplayElement } from "@/components/sections/activities";
import { ActivityDisplayCard } from "@/components/sections/activity";
import PageNavigation from "@/components/sections/pageNavigation";
import { createTrpcCaller } from "@/lib/trpc/caller";
import Title from "@/components/title";
import { isCUID } from "@/lib/utils";

export default async function ActivityGroup({
  params,
}: {
  params: Promise<{ clubId: string; pageId: string; agId: string }>;
}) {
  const { clubId, pageId, agId } = await params;
  const caller = await createTrpcCaller();
  if (!caller) return null;
  if (!isCUID(clubId) || !isCUID(pageId) || !isCUID(agId)) return notFound();
  const queryClub = await caller.clubs.getClubPagesForNavByClubId(clubId);
  const queryPage = await caller.pages.getClubPage(pageId);

  return (
    <div data-theme={queryPage?.theme ?? "light"}>
      <Title title={queryPage?.clubName ?? ""} />
      <PageNavigation
        clubId={clubId}
        logoUrl={queryClub?.logoUrl ?? ""}
        pages={queryClub?.pages ?? []}
      />
      <section className="min-h-screen w-full bg-base-200 p-4">
        <ActivityGroupDisplayElement elementId={agId} />
        <ActivityDisplayCard pageId={pageId} groupId={agId} />
      </section>
    </div>
  );
}
