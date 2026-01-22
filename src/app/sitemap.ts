import { createTrpcCaller } from "@/lib/trpc/caller";
import { isCUID } from "@/lib/utils";
import type { MetadataRoute } from "next";

// Revalidate sitemap periodically (ISR for metadata route)
export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const caller = await createTrpcCaller();
  if (!caller) return [];

  const [clubParams, coachParams] = await Promise.all([
    caller.pages.listPublicClubPresentationParams(),
    caller.pages.listPublicCoachPresentationParams(),
  ]);

  const clubs = (clubParams ?? [])
    .filter((p) => p && isCUID(p.clubId) && isCUID(p.pageId))
    .map((p) => ({
      url: `/presentation-page/club/${p.clubId}/${p.pageId}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const coaches = (coachParams ?? [])
    .filter((p) => p && Boolean(p.coachId) && isCUID(p.pageId))
    .map((p) => ({
      url: `/presentation-page/coach/${p.coachId}/${p.pageId}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...clubs, ...coaches];
}
