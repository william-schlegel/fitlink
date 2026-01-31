import { notFound } from "next/navigation";

import { CoachDisplay } from "@/components/sections/coach";
import { PageId, UserId } from "@/db/types";
import { createTrpcCaller, createTrpcCallerStatic } from "@/lib/trpc/caller";
import { isCUID } from "@/lib/utils";
import { Metadata } from "next";
// Revalidate this page periodically (ISR) so statically generated pages stay fresh.
// Adjust as needed.
export const revalidate = 86400; // 24 hours

export async function generateStaticParams() {
  const caller = await createTrpcCallerStatic();
  if (!caller) return [] as Array<{ userId: string; pageId: string }>;

  // Expected to return pairs for routes like /presentation-page/coach/[userId]/[pageId]
  const params = await caller.pages.listPublicCoachPresentationParams();
  return (params ?? [])
    .map((p) => ({ userId: p.coachUserId, pageId: p.pageId }))
    .filter((p) => p && isCUID(p.userId) && isCUID(p.pageId));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: UserId; pageId: string }>;
}): Promise<Metadata> {
  const { userId, pageId } = await params;

  // If IDs are invalid, treat as not found (noindex by default for 404s)
  if (!Boolean(userId) || !isCUID(pageId)) return {};

  const caller = await createTrpcCallerStatic();
  if (!caller) return {};

  const queryPage = await caller.pages.getPageForCoach({ userId });

  // If the page doesn't exist or isn't visible/public, ensure it's not indexable.
  // Prefer returning 404 in the page component; this metadata is a safety net.
  if (!queryPage) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const title = queryPage?.coach?.publicName
    ? `${queryPage.coach.publicName}`
    : "Coach";

  return {
    title,
    alternates: {
      canonical: `/presentation-page/coach/${userId}/${pageId}`,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      url: `/presentation-page/coach/${userId}/${pageId}`,
    },
  };
}

export default async function CoachPresentation({
  params,
}: {
  params: Promise<{ userId: UserId; pageId: PageId }>;
}) {
  const paramsValue = await params;
  const userId = paramsValue.userId;
  const pageId = paramsValue.pageId;

  if (!Boolean(userId) || !isCUID(pageId)) return notFound();
  const caller = await createTrpcCaller();
  if (!caller) return null;

  const queryPage = await caller.pages.getPageForCoach({ userId });

  if (!queryPage) return notFound();
  return <CoachDisplay pageId={pageId} />;
}
