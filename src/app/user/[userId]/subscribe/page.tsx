import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { isCUID } from "@/lib/utils";
import OfferCard from "./offerCard";
import OfferForm from "./offerForm";

export default async function Subscribe({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ clubId: string; offerId: string }>;
}) {
  const { userId } = await params;
  const { clubId, offerId } = await searchParams;
  const myClubId = (Array.isArray(clubId) ? clubId[0] : clubId) || "";
  const myOfferId = (Array.isArray(offerId) ? offerId[0] : offerId) || "";

  if (!isCUID(myOfferId) || !isCUID(myClubId)) return notFound();

  const caller = await createTrpcCaller();
  if (!caller) return null;

  const offerQuery = await caller.subscriptions.getSubscriptionById(myOfferId);
  const clubQuery = await caller.clubs.getClubById({
    clubId: myClubId,
    userId,
  });

  if (!offerQuery || !clubQuery) return notFound();

  const t = await getTranslations("club");

  return (
    <LayoutPage title={t("subscription.new-subscription")}>
      <OfferCard offer={offerQuery} clubName={clubQuery.name} />
      <OfferForm offer={offerQuery} userId={userId} />
    </LayoutPage>
  );
}
