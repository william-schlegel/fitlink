import { notFound } from "next/navigation";

import { CoachDisplay } from "@/components/sections/coach";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { isCUID } from "@/lib/utils";

export default async function CoachPresentation({
  params,
}: {
  params: Promise<{ userId: string; pageId: string }>;
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
