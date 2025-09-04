import {
  CreateOffer,
  DeleteOffer,
  UpdateOffer,
} from "@/components/modals/manageCoach";
import Title from "@/components/title";
import { getActualUser } from "@/lib/auth/server";
import createLink from "@/lib/createLink";
import { isCUID } from "@/lib/utils";
import { getOfferName } from "@/lib/offers/serverOffer";
import { getCoachOffers, getOfferById } from "@/server/api/routers/coachs";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";

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
  const headerList = await headers();
  const href = headerList.get("x-current-href");
  const offerQuery = await getCoachOffers(userId);

  if (!offerId && offerQuery.length > 0)
    redirect(createLink({ offerId: offerQuery[0]?.id }, href));

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("offer.my-offer", { count: offerQuery?.length ?? 0 })} />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("offer.my-offer", { count: offerQuery?.length ?? 0 })}</h1>
        <CreateOffer userId={userId} />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <ul className="menu rounded bg-base-100 lg:w-1/4">
          {offerQuery?.map((offer) => (
            <li key={offer.id}>
              <Link
                href={createLink({ offerId: offer.id })}
                className={twMerge(
                  "flex w-full justify-between",
                  offerId === offer.id && "badge badge-primary"
                )}
              >
                <span>{offer.name}</span>
                <span className="badge-secondary badge">
                  {getOfferName(offer.target ?? "INDIVIDUAL")}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {offerId === "" ? null : (
          <OfferContent userId={userId} offerId={offerId} />
        )}
      </div>
    </div>
  );
}
type OfferContentProps = {
  userId: string;
  offerId: string;
};

async function OfferContent({ userId, offerId }: OfferContentProps) {
  const t = await getTranslations("coach");
  const offerQuery = await getOfferById(offerId);
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
      {/* <CoachOfferPage offerId={offerId} condensed /> */}
    </div>
  );
}
