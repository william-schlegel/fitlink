"use client";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  CalendarCheck,
  Gift,
  Hourglass,
  Search,
  User,
  Webcam,
} from "lucide-react";

import ActivitySearch from "@/components/ui/activitySearch";
import AddressSearch from "@/components/ui/addressSearch";
import CollapsableGroup from "@/components/ui/collapsableGroup";
import Rating from "@/components/ui/rating";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui/shadcn";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { formatMoney } from "@/lib/formatNumber";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

type SearchFormValues = {
  activity: string;
  location: string;
  longitude: number;
  latitude: number;
  range: number;
  priceMin: number;
  priceMax: number;
};

const defaultValues: SearchFormValues = {
  activity: "",
  location: "",
  longitude: LONGITUDE,
  latitude: LATITUDE,
  range: 25,
  priceMax: 1000,
  priceMin: 0,
};

export default function CoachPage() {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SearchFormValues>({
    defaultValues,
  });
  const fields = useWatch({
    control,
    defaultValue: defaultValues,
  });
  const offerQuery = trpc.coachs.getOffersForCompanies.useQuery(
    {
      activityName: fields.activity,
      locationLat: fields.latitude,
      locationLng: fields.longitude,
      priceMin: fields.priceMin,
      priceMax: fields.priceMax,
      range: fields.range,
    },
    { enabled: false, refetchOnWindowFocus: false },
  );
  const { data } = offerQuery;

  useEffect(() => {
    offerQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.activity, fields.latitude, fields.longitude]);

  function onValid() {
    offerQuery.refetch();
  }

  return (
    <div>
      <section className="bg-background">
        <div className="container mx-auto">
          <h1 className="text-center">{t("home.company-title")}</h1>
          <p className="py-6 text-lg text-center">{t("home.company-text")}</p>
          <form onSubmit={handleSubmit(onValid)}>
            <Card className="mx-auto w-fit p-4">
              <CardHeader>
                <CardTitle>{t("home.company-search")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex justify-around">
                  <CollapsableGroup
                    groupName={`${t("home.price-range")} (${formatMoney(
                      fields.priceMax,
                    )})`}
                    className="w-fit"
                  >
                    <Input
                      type="range"
                      min="0"
                      max="5000"
                      {...register("priceMax", { valueAsNumber: true })}
                      className="range range-primary flex-1"
                    />
                  </CollapsableGroup>
                  <CollapsableGroup
                    groupName={`${t(
                      "home.distance-range",
                    )} (${fields.range?.toFixed(0)}km)`}
                    className="w-fit"
                  >
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      {...register("range", { valueAsNumber: true })}
                      className="range range-primary flex-1"
                    />
                  </CollapsableGroup>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Controller
                    control={control}
                    name="activity"
                    render={({ field }) => (
                      <ActivitySearch
                        initialActivity={field.value}
                        onSearch={(activity) => {
                          field.onChange(activity.name);
                          offerQuery.refetch();
                        }}
                        onActivityChange={(value) => field.onChange(value)}
                        className="w-[clamp(24rem,25vw,100%)]"
                        required
                        error={
                          errors.activity ? t("common.enter-activity") : ""
                        }
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="location"
                    render={({ field }) => (
                      <AddressSearch
                        onSearch={(adr) => {
                          field.onChange(adr.address);
                          offerQuery.refetch();
                        }}
                        className="w-[clamp(24rem,25vw,100%)]"
                        required
                        error={
                          errors.location ? t("common.enter-location") : ""
                        }
                      />
                    )}
                  />
                </div>
              </CardContent>
              <CardAction className="flex justify-center w-full pt-4 border-t border-border">
                <Button type="submit">
                  {t("home.search-coach")}
                  <Search />
                </Button>
              </CardAction>
            </Card>
          </form>
          <div className="flex flex-wrap gap-8 py-12">
            {data?.map((offer) => (
              <OfferCard
                key={offer.CoachingPrice.id}
                id={offer.CoachingPrice.id}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OfferCard({ id }: { id: string }) {
  const t = useTranslations();
  const offer = trpc.coachs.getOfferWithDetails.useQuery(
    { offerId: id },
    {
      enabled: isCUID(id),
    },
  );

  const locale = useLocale();
  if (offer.isLoading) return <Spinner />;
  const listFormatter = new Intl.ListFormat(locale, {
    style: "short",
  });
  const options: string[] = [];
  const prices: {
    type: "WEBCAM" | "PHYSICAL";
    unit: "H" | "D";
    price: number;
  }[] = [];
  if (offer.data?.physical) {
    options.push(t("coach.offer.physical"));
    if (offer.data.perHourPhysical)
      prices.push({
        type: "PHYSICAL",
        unit: "H",
        price: offer.data.perHourPhysical,
      });
    if (offer.data.perDayPhysical)
      prices.push({
        type: "PHYSICAL",
        unit: "D",
        price: offer.data.perDayPhysical,
      });
  }
  if (offer.data?.webcam) {
    options.push(t("coach.offer.webcam"));
    if (offer.data.perHourWebcam)
      prices.push({
        type: "WEBCAM",
        unit: "H",
        price: offer.data.perHourWebcam,
      });
    if (offer.data.perDayWebcam)
      prices.push({
        type: "WEBCAM",
        unit: "D",
        price: offer.data.perDayWebcam,
      });
  }
  if (offer.data?.inHouse) options.push(t("coach.offer.in-house"));

  return (
    <Card className="relative w-96">
      <Image
        src={offer.data?.imageUrl ?? "/images/dummy.jpg"}
        alt={offer.data?.coach?.user.name ?? ""}
        width={300}
        height={300}
        className="object-cover object-top aspect-square w-full"
      />
      <CardHeader>
        <CardTitle>{offer.data?.coach?.publicName}</CardTitle>
        <CardDescription className="space-x-2">
          {offer.data?.coach?.searchAddress},
          {listFormatter.format(options).toLocaleLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Rating note={offer.data?.coach?.rating ?? 5} />
        <h2 className="card-title">{offer.data?.name}</h2>
        <p>{offer.data?.description}</p>
        <div className="flex flex-wrap gap-2">
          {prices.map((price, idx) => (
            <Badge key={`PRICE-${idx}`} variant="info" size="lg">
              {price.type === "PHYSICAL" ? <User /> : <Webcam />}

              {formatMoney(price.price)}

              {price.unit === "H" ? <Hourglass /> : <CalendarCheck />}
            </Badge>
          ))}
          {offer.data?.freeHours ? (
            <Badge variant="info" size="lg">
              <Gift />
              <span>{t("coach.offer.free-hours")}</span>
            </Badge>
          ) : null}
        </div>
        <CardAction>
          <Button variant="default" asChild className="w-full">
            <Link href={`/company/${id}`}>{t("home.offer-details")}</Link>
          </Button>
        </CardAction>
      </CardContent>
    </Card>
  );
}
