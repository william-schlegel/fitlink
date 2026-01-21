import { notFound } from "next/navigation";

import { ActivityGroupDisplayCard } from "@/components/sections/activities";
import { HeroDisplay } from "@/components/sections/hero";
import { OfferDisplayCard } from "@/components/sections/offers";
import PageNavigation from "@/components/sections/pageNavigation";
import { PlanningDisplayCard } from "@/components/sections/planning";
import { TitleDisplay } from "@/components/sections/title";
import { TThemes } from "@/components/themeSelector";
import Title from "@/components/title";
import PageContainer from "@/components/ui/page/container";
import { createTrpcCaller } from "@/lib/trpc/caller";
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
    <PageContainer theme={queryPage?.theme as TThemes}>
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
    </PageContainer>
  );
}
