import { notFound } from "next/navigation";

import { ActivityGroupDisplayCard } from "@/components/sections/activities";
import { PlanningDisplayCard } from "@/components/sections/planning";
import PageNavigation from "@/components/sections/pageNavigation";
import { OfferDisplayCard } from "@/components/sections/offers";
import { TitleDisplay } from "@/components/sections/title";
import { HeroDisplay } from "@/components/sections/hero";
import { createTrpcCaller } from "@/lib/trpc/caller";
import Title from "@/components/title";
import { isCUID } from "@/lib/utils";

export default async function ClubPresentation({
  params,
}: {
  params: Promise<{ clubId: string; pageId: string }>;
}) {
  const { clubId, pageId } = await params;
  const caller = await createTrpcCaller();
  if (!caller) return null;
  if (!isCUID(clubId) || !isCUID(pageId)) return notFound();
  const queryPage = await caller.pages.getClubPage(pageId);

  const queryClub = await caller.clubs.getClubPagesForNavByClubId(clubId);

  return (
    <div data-theme={queryPage?.theme ?? "light"}>
      <Title title={queryPage?.clubName ?? ""} />
      <PageNavigation
        clubId={clubId}
        logoUrl={queryClub?.logoUrl ?? ""}
        pages={queryClub?.pages ?? []}
      />
      {queryPage?.sections.map((section) =>
        section.model === "HERO" ? (
          <HeroDisplay
            key={section.id}
            clubId={queryPage.clubId}
            pageId={pageId}
          />
        ) : section.model === "ACTIVITY_GROUPS" ? (
          <ActivityGroupDisplayCard key={section.id} pageId={pageId} />
        ) : section.model === "TITLE" ? (
          <TitleDisplay
            key={section.id}
            clubId={queryPage.clubId}
            pageId={pageId}
          />
        ) : section.model === "PLANNINGS" ? (
          <PlanningDisplayCard key={section.id} pageId={pageId} />
        ) : section.model === "OFFERS" ? (
          <OfferDisplayCard key={section.id} pageId={pageId} clubId={clubId} />
        ) : null,
      )}
    </div>
  );
}
