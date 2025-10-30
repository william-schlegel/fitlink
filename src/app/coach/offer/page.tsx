import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  CreateOffer,
  DeleteOffer,
  UpdateOffer,
} from "@/components/modals/manageCoach";
import { CoachOfferPage } from "@/components/sections/coachOffer";
import { getOfferName } from "@/lib/offers/serverOffer";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { isCUID } from "@/lib/utils";

export default async function CoachOffer({
  searchParams,
}: {
  searchParams: Promise<{ offerId: string }>;
}) {
  const user = await getActualUser();
  if (!user) redirect("/");
  const userId = user.id;
  const t = await getTranslations("coach");
  if (
    user.internalRole !== "COACH" &&
    user.internalRole !== "MANAGER_COACH" &&
    user.internalRole !== "ADMIN"
  )
    return <div>{t("coach-only")}</div>;

  const offerId = (await searchParams).offerId;
  const href = await getHref();
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const offerQuery = await caller.coachs.getCoachOffers(userId);

  if (!offerId && offerQuery.length > 0)
    redirect(createLink({ offerId: offerQuery[0]?.id }, href));

  const offerList = await Promise.all(
    offerQuery.map(async (offer) => ({
      id: offer.id,
      name: offer.name,
      link: createLink({ offerId: offer.id }, href),
      badgeColor: "primary",
      badgeText: await getOfferName(offer.target ?? "INDIVIDUAL"),
    })),
  );

  return (
    <LayoutPage
      title={t("offer.my-offer", { count: offerQuery?.length ?? 0 })}
      titleComponents={<CreateOffer userId={userId} />}
    >
      <LayoutPage.Main>
        <LayoutPage.List
          list={offerList}
          itemId={offerId}
          noItemsText={t("offer.no-offer")}
        />
        {offerId === "" ? null : (
          <OfferContent userId={userId} offerId={offerId} />
        )}
      </LayoutPage.Main>
    </LayoutPage>
  );
}
type OfferContentProps = {
  userId: string;
  offerId: string;
};

async function OfferContent({ userId, offerId }: OfferContentProps) {
  const t = await getTranslations("coach");
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const offerQuery = isCUID(offerId)
    ? await caller.coachs.getOfferById(offerId)
    : null;
  if (!offerQuery) return null;
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <h2>{offerQuery?.name}</h2>
          <Link
            className="btn btn-primary flex items-center gap-4"
            href={`/company/${offerId}`}
            target="_blank"
            rel="noreffer"
          >
            {t("offer.see-public-offer")}
            <i className="bx bx-link-external bx-xs" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <UpdateOffer userId={userId} offerId={offerId} />
          <DeleteOffer userId={userId} offerId={offerId} />
        </div>
      </div>
      {/* <CoachOfferDisplay offerId={offerId} /> */}
      <CoachOfferPage offerId={offerId} condensed />
    </div>
  );
}
