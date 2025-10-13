"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useCoachingLevel } from "@/lib/offers/useOffers";
import { formatMoney } from "@/lib/formatNumber";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import Rating from "../ui/rating";

type CoachOfferPageProps = {
  offerId: string;
  condensed?: boolean;
};

export function CoachOfferPage({ offerId, condensed }: CoachOfferPageProps) {
  const t = useTranslations("coach");
  const offerQuery = trpc.coachs.getOfferWithDetails.useQuery(offerId, {
    enabled: isCUID(offerId),
  });
  const { getName: getNameLevel } = useCoachingLevel();
  const locale = useLocale();

  const listFormatter = new Intl.ListFormat(locale);
  const router = useRouter();

  if (offerQuery.isLoading) return <Spinner />;
  return (
    <div
      className={`container mx-auto flex flex-col-reverse ${
        condensed ? "gap-2" : "gap-8"
      } px-8 xl:grid xl:grid-cols-[3fr_1fr]`}
    >
      <div className={condensed ? undefined : "space-y-8"}>
        <section className={`flex ${condensed ? "gap-2" : "gap-8 "}`}>
          {offerQuery.data?.coach?.coachingActivities.map((activity) => (
            <span className="pill px-4" key={activity.id}>
              {activity.name}
            </span>
          ))}
        </section>

        <section>
          {condensed ? (
            <h2>{offerQuery.data?.name}</h2>
          ) : (
            <h1>{offerQuery.data?.name}</h1>
          )}
          <p>{offerQuery.data?.description}</p>
        </section>

        <section>
          <h2>{offerQuery.data?.coach?.description}</h2>
        </section>
        <section>
          <h3>{t("offer.where")}</h3>
          <div className="flex flex-wrap gap-2">
            {offerQuery.data?.physical && offerQuery.data?.myPlace ? (
              <OfferBadge
                variant="My-Place"
                publicName={offerQuery.data.coach?.publicName}
                searchAddress={offerQuery.data.coach?.searchAddress}
              />
            ) : null}
            {offerQuery.data?.physical && offerQuery.data?.inHouse ? (
              <OfferBadge
                variant="In-House"
                travelLimit={offerQuery.data.travelLimit}
                searchAddress={offerQuery.data.coach?.searchAddress}
              />
            ) : null}
            {offerQuery.data?.physical && offerQuery.data?.publicPlace ? (
              <OfferBadge
                variant="Public-Place"
                travelLimit={offerQuery.data.travelLimit}
                searchAddress={offerQuery.data.coach?.searchAddress}
              />
            ) : null}
            {offerQuery.data?.webcam ? <OfferBadge variant="Webcam" /> : null}
          </div>
        </section>
        <section>
          <h3>{t("offer.course-description")}</h3>
          <div className="pill w-fit px-4">
            <i className="bx bx-rocket bx-sm" />
            {t("offer.levels")}
            {" : "}
            {listFormatter.format(
              offerQuery.data?.coachingLevel?.map((l) =>
                getNameLevel(l.level),
              ) ?? [],
            )}
          </div>
          <p className="my-4">{offerQuery.data?.coach?.aboutMe}</p>
        </section>
        {offerQuery.data?.packs?.length ? (
          <section>
            <h3>{t("offer.packs")}</h3>
            <div className="flex flex-wrap gap-4">
              {offerQuery.data.packs.map((pack) => (
                <div key={pack.id} className="pill px-4">
                  <span className="font-semibold text-primary">
                    {pack.nbHours}h
                  </span>
                  <span>{formatMoney(pack.packPrice)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <div className="card w-full place-self-start bg-base-100 shadow-xl max-xl:card-side">
        <figure
          className="w-[40%] max-w-[16rem] shrink-0 xl:h-64 xl:w-full xl:max-w-full"
          style={{
            backgroundImage: `url(${offerQuery.data?.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mt-auto h-fit bg-black/20 px-4 py-2 text-accent xl:w-full">
            <h3 className="text-center text-accent">
              {offerQuery.data?.coach?.publicName}
            </h3>
          </div>
        </figure>
        <div className="card-body justify-center">
          <Rating
            note={offerQuery.data?.coach?.rating ?? 5}
            className="justify-center"
          />
          <div className="space-y-2">
            <Tarif
              value={offerQuery.data?.perHourPhysical ?? 0}
              icon="bx-user"
              unit={t("offer.per-hour")}
            />
            <Tarif
              value={offerQuery.data?.perDayPhysical ?? 0}
              icon="bx-user"
              unit={t("offer.per-day")}
            />
            <Tarif
              value={offerQuery.data?.perHourWebcam ?? 0}
              icon="bx-webcam"
              unit={t("offer.per-hour")}
            />
            <Tarif
              value={offerQuery.data?.perDayWebcam ?? 0}
              icon="bx-webcam"
              unit={t("offer.per-day")}
            />
            <Tarif
              value={offerQuery.data?.travelFee ?? 0}
              icon="bx-car"
              unit=""
            />
            <Tarif
              value={offerQuery.data?.freeHours ?? 0}
              icon="bx-gift"
              unit={"h"}
              money={false}
              className="rounded bg-primary/10 outline outline-primary"
              label={t("offer.free-hours") ?? ""}
            />
            {condensed ? null : (
              <button
                className="btn-primary btn-block btn col-span-2 mt-8"
                onClick={() => router.back()}
              >
                {t("offer.back-to-my-page")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type OfferBadgeProps = {
  variant: "My-Place" | "In-House" | "Public-Place" | "Webcam";
  publicName?: string | null;
  searchAddress?: string | null;
  travelLimit?: number | null;
};

export function OfferBadge({
  variant,
  publicName,
  searchAddress,
  travelLimit,
}: OfferBadgeProps) {
  const t = useTranslations("coach");
  let icon = "";
  let name = "";
  const restriction = travelLimit
    ? t("offer.in-limit", {
        limit: travelLimit,
        address: searchAddress ?? "",
      })
    : "";

  if (variant === "My-Place") {
    icon = "bx-map-pin";
    name = `${t("offer.home", {
      name: publicName ?? "",
    })} : ${searchAddress}`;
  }
  if (variant === "In-House") {
    icon = "bx-home";
    name = t("offer.your-place");
  }
  if (variant === "Public-Place") {
    icon = "bx-map-alt";
    name = t("offer.public-place");
  }
  if (variant === "Webcam") {
    icon = "bx-webcam";
    name = t("offer.webcam");
  }

  return (
    <div className="pill w-fit px-4">
      {icon ? <i className={`bx ${icon} bx-sm`} /> : null}
      <span>{name}</span>
      {restriction ? (
        <span className="text-sm text-secondary">{restriction}</span>
      ) : null}
    </div>
  );
}

type TarifProps = {
  value: number | undefined;
  icon: string;
  unit: string;
  money?: boolean;
  className?: string;
  label?: string;
};

function Tarif({
  value,
  icon,
  unit,
  money = true,
  className = "",
  label = "",
}: TarifProps) {
  if (!value) return null;
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <label>
        <i className={`bx ${icon} bx-sm mr-2`} />
      </label>
      {label ? <span>{label}</span> : null}
      <span>
        {money ? formatMoney(value) : value.toFixed(0)}
        {unit}
      </span>
    </div>
  );
}
