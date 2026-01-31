import type { Metadata } from "next";
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
import { ClubId, PageId } from "@/db/types";
import { createTrpcCaller, createTrpcCallerStatic } from "@/lib/trpc/caller";
import { isCUID } from "@/lib/utils";

// Revalidate this page periodically (ISR) so statically generated pages stay fresh.
// Adjust as needed.
export const revalidate = 86400; // 24 hours

export async function generateStaticParams() {
  const caller = await createTrpcCallerStatic();
  if (!caller) return [] as Array<{ clubId: string; pageId: string }>;

  // Expected to return pairs for routes like /presentation-page/club/[clubId]/[pageId]
  const params = await caller.pages.listPublicClubPresentationParams();
  return (params ?? []).filter(
    (p) => p && isCUID(p.clubId) && isCUID(p.pageId),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubId: ClubId; pageId: PageId }>;
}): Promise<Metadata> {
  const { clubId, pageId } = await params;

  // If IDs are invalid, treat as not found (noindex by default for 404s)
  if (!isCUID(clubId) || !isCUID(pageId)) return {};

  const caller = await createTrpcCallerStatic();
  if (!caller) return {};

  const queryPage = await caller.pages.getClubPage({ pageId });

  // If the page doesn't exist or isn't visible/public, ensure it's not indexable.
  // Prefer returning 404 in the page component; this metadata is a safety net.
  if (!queryPage) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const title = queryPage?.clubName ? `${queryPage.clubName}` : "Club";

  return {
    title,
    alternates: {
      canonical: `/presentation-page/club/${clubId}/${pageId}`,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      url: `/presentation-page/club/${clubId}/${pageId}`,
    },
  };
}

export default async function ClubPresentation({
  params,
}: {
  params: Promise<{ clubId: ClubId; pageId: PageId }>;
}) {
  const { clubId, pageId } = await params;
  const caller = await createTrpcCaller();
  if (!caller) return null;
  if (!isCUID(clubId) || !isCUID(pageId)) return notFound();
  const queryPage = await caller.pages.getClubPage({ pageId });

  // If the page doesn't exist (or the server chooses not to return it when not public), 404.
  if (!queryPage) return notFound();

  const queryClub = await caller.clubs.getClubPagesForNavByClubId(clubId);

  return (
    <PageContainer theme={queryPage.theme as TThemes}>
      <Title title={queryPage.clubName ?? ""} />
      <PageNavigation
        clubId={clubId}
        logoUrl={queryClub?.logoUrl ?? ""}
        pages={queryClub?.pages ?? []}
      />
      {queryPage.sections.map((section) =>
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
