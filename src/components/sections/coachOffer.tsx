"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import Link from "next/link";

import {
  Car,
  Gift,
  Home,
  Landmark,
  Mail,
  MapPin,
  Rocket,
  User,
  Webcam,
} from "lucide-react";

import Image from "next/image";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { useUser } from "@/lib/auth/client";
import { formatMoney } from "@/lib/formatNumber";
import { useCoachingLevel } from "@/lib/offers/useOffers";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import SendMessage from "../modals/sendMessage";
import { PageBadge } from "../ui/page/badge";
import Rating from "../ui/rating";
import { Badge, Button, Card, CardContent } from "../ui/shadcn";

type CoachOfferPageProps = {
  offerId: string;
  condensed?: boolean;
  withContact?: boolean;
};

export function CoachOfferPage({
  offerId,
  condensed,
  withContact,
}: CoachOfferPageProps) {
  const t = useTranslations("coach");
  const offerQuery = trpc.coachs.getOfferWithDetails.useQuery(offerId, {
    enabled: isCUID(offerId),
  });
  const { getName: getNameLevel } = useCoachingLevel();
  const locale = useLocale();

  const listFormatter = new Intl.ListFormat(locale);
  const router = useRouter();
  const { data: user } = useUser();
  const userId = user?.id;
  if (offerQuery.isLoading) return <Spinner />;
  if (!offerQuery.data) return null;

  return (
    <div
      className={`container mx-auto flex flex-col-reverse ${
        condensed ? "gap-2" : "gap-8"
      } px-8 xl:grid xl:grid-cols-[3fr_1fr]`}
    >
      <div className={condensed ? undefined : "space-y-8"}>
        <section className={`flex ${condensed ? "gap-2" : "gap-8 "}`}>
          {offerQuery.data.coach?.coachingActivities?.map((activity, idx) => (
            <Badge variant="info" size="xl" key={idx}>
              {activity}
            </Badge>
          ))}
        </section>

        <section>
          {condensed ? (
            <h2>{offerQuery.data.name}</h2>
          ) : (
            <h1>{offerQuery.data.name}</h1>
          )}
          <p>{offerQuery.data.description}</p>
        </section>

        <section>
          <h2>{offerQuery.data.coach?.description}</h2>
        </section>
        <section>
          <h3>{t("offer.where")}</h3>
          <div className="flex flex-wrap gap-2">
            {offerQuery.data.physical && offerQuery.data.myPlace ? (
              <OfferBadge
                variant="My-Place"
                publicName={offerQuery.data.coach?.publicName}
                searchAddress={offerQuery.data.coach?.searchAddress}
              />
            ) : null}
            {offerQuery.data.physical && offerQuery.data.inHouse ? (
              <OfferBadge
                variant="In-House"
                travelLimit={offerQuery.data.travelLimit}
                searchAddress={offerQuery.data.coach?.searchAddress}
              />
            ) : null}
            {offerQuery.data.physical && offerQuery.data.publicPlace ? (
              <OfferBadge
                variant="Public-Place"
                travelLimit={offerQuery.data.travelLimit}
                searchAddress={offerQuery.data.coach?.searchAddress}
              />
            ) : null}
            {offerQuery.data.webcam ? <OfferBadge variant="Webcam" /> : null}
          </div>
        </section>
        <section>
          <h3>{t("offer.course-description")}</h3>
          <Badge variant="info" size="xl">
            <Rocket />
            {t("offer.levels")}
            {" : "}
            {listFormatter.format(
              offerQuery.data.coachingLevel?.map((l) =>
                getNameLevel(l.level),
              ) ?? [],
            )}
          </Badge>
          <p className="my-4">{offerQuery.data.coach?.aboutMe}</p>
        </section>
        {offerQuery.data.packs?.length ? (
          <section>
            <h3>{t("offer.packs")}</h3>
            <div className="flex flex-wrap gap-4">
              {offerQuery.data.packs.map((pack) => (
                <Badge variant="info" size="xl" key={pack.id}>
                  <span className="font-semibold text-primary">
                    {pack.nbHours}h
                  </span>
                  <span>{formatMoney(pack.packPrice)}</span>
                </Badge>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <Card className="h-fit w-fit relative">
        <Image
          width={400}
          height={400}
          className="w-max-64 w-full object-cover object-top aspect-square"
          src={offerQuery.data.imageUrl}
          alt={offerQuery.data.coach?.publicName ?? ""}
        />
        <div className="absolute top-0 left-0 w-full h-fit bg-black/30 px-4 py-2 text-accent xl:w-full">
          <h3 className="text-center text-accent">
            {offerQuery.data.coach?.publicName}
          </h3>
        </div>

        <CardContent>
          <Rating
            note={offerQuery.data.coach?.rating ?? 5}
            className="justify-center"
          />
          <div className="space-y-2">
            <Tarif
              value={offerQuery.data.perHourPhysical ?? 0}
              icon={<User />}
              unit={t("offer.per-hour")}
            />
            <Tarif
              value={offerQuery.data.perDayPhysical ?? 0}
              icon={<User />}
              unit={t("offer.per-day")}
            />
            <Tarif
              value={offerQuery.data.perHourWebcam ?? 0}
              icon={<Webcam />}
              unit={t("offer.per-hour")}
            />
            <Tarif
              value={offerQuery.data.perDayWebcam ?? 0}
              icon={<Webcam />}
              unit={t("offer.per-day")}
            />
            <Tarif
              value={offerQuery.data.travelFee ?? 0}
              icon={<Car />}
              unit=""
            />
            <Tarif
              value={offerQuery.data.freeHours ?? 0}
              icon={<Gift />}
              unit={"h"}
              money={false}
              className="rounded bg-primary/10 outline outline-primary"
              label={t("offer.free-hours") ?? ""}
            />
            {condensed ? null : withContact ? (
              <>
                {userId && offerQuery.data.coach?.userId ? (
                  <SendMessage
                    toUserId={offerQuery.data.coach.userId}
                    fromUserId={userId}
                  />
                ) : offerQuery.data.coach?.user.email ? (
                  <Button asChild>
                    <Link
                      className="block col-span-2 w-full"
                      href={`mailto:${offerQuery.data.coach.user.email}`}
                    >
                      <Mail />
                      <span>{t("offer.contact-me")}</span>
                    </Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <Button
                className="block col-span-2 mt-8"
                onClick={() => router.back()}
              >
                {t("offer.back-to-my-page")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type OfferBadgeProps = {
  variant: "My-Place" | "In-House" | "Public-Place" | "Webcam";
  publicName?: string | null;
  searchAddress?: string | null;
  travelLimit?: number | null;
  page?: boolean;
  preview?: boolean;
};

export function OfferBadge({
  variant,
  publicName,
  searchAddress,
  travelLimit,
  page = false,
  preview = false,
}: OfferBadgeProps) {
  const t = useTranslations("coach");
  let icon: React.ReactNode = null;
  let name = "";
  const restriction = travelLimit
    ? t("offer.in-limit", {
        limit: travelLimit,
        address: searchAddress || "chez moi",
      })
    : "";

  if (variant === "My-Place") {
    icon = <MapPin className={preview ? "size-4" : "size-8"} />;
    name = `${t("offer.home", {
      name: publicName ?? "",
    })} : ${searchAddress}`;
  }
  if (variant === "In-House") {
    icon = <Home className={preview ? "size-4" : "size-8"} />;
    name = t("offer.your-place");
  }
  if (variant === "Public-Place") {
    icon = <Landmark className={preview ? "size-4" : "size-8"} />;
    name = t("offer.public-place");
  }
  if (variant === "Webcam") {
    icon = <Webcam className={preview ? "size-4" : "size-8"} />;
    name = t("offer.webcam");
  }

  if (page) {
    return (
      <PageBadge variant="info" size={preview ? "sm" : "xl"}>
        {icon}
        <span className="flex items-center gap-[1ch] line-clamp-1 max-w-full">
          <span>{name}</span>
          {restriction ? (
            <span className={preview ? "text-xs" : "text-sm"}>
              {restriction}
            </span>
          ) : null}
        </span>
      </PageBadge>
    );
  }

  return (
    <Badge variant="info" size="xl">
      {icon}
      <span>{name}</span>
      {restriction ? (
        <span className="text-sm text-accent">{restriction}</span>
      ) : null}
    </Badge>
  );
}

type TarifProps = {
  value: number | undefined;
  icon: React.ReactNode;
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
      {icon}
      {label ? <span>{label}</span> : null}
      <span>
        {money ? formatMoney(value) : value.toFixed(0)}
        {unit}
      </span>
    </div>
  );
}
