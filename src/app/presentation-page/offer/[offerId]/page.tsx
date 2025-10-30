import { notFound } from "next/navigation";
import Head from "next/head";

import { CoachOfferPage } from "@/components/sections/coachOffer";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { isCUID } from "@/lib/utils";

export default async function Offer({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const offerId = (await params).offerId;
  if (!isCUID(offerId)) return notFound();
  const offerData = await caller.coachs.getOfferWithDetails(offerId);

  return (
    <div
      data-theme={offerData?.coach?.pageStyle ?? "light"}
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <Head>
        <title>{offerData?.coach?.publicName ?? ""}</title>
      </Head>
      <CoachOfferPage offerId={offerId} />
    </div>
  );
}
