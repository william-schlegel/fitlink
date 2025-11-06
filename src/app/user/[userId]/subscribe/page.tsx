import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { createTrpcCaller } from "@/lib/trpc/caller";
import Title from "@/components/title";
import { isCUID } from "@/lib/utils";
import OfferForm from "./offerForm";
import OfferCard from "./offerCard";

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
  const userQuery = await caller.users.getUserById({ id: userId });

  const offerQuery = await caller.subscriptions.getSubscriptionById(myOfferId);
  const clubQuery = await caller.clubs.getClubById({
    clubId: myClubId,
    userId,
  });

  if (!offerQuery || !clubQuery) return notFound();

  const t = await getTranslations("club");

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("subscription.new-subscription")} />

      <h1>{t("subscription.new-subscription")}</h1>
      <OfferCard offer={offerQuery} clubName={clubQuery.name} />
      <OfferForm offer={offerQuery} userId={userId} />
    </div>
  );
}
