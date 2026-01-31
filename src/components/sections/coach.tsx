"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import MapComponent, { Layer, Source } from "react-map-gl/mapbox";

import { Info, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { PageId } from "@/db/types";
import { env } from "@/env";
import { cssVarToHex } from "@/lib/colorConversion";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { trpc } from "@/lib/trpc/client";
import { cn, isCUID } from "@/lib/utils";
import { CoachDataOfferType } from "@/server/api/routers/users";
import ThemeSelector, { TThemes } from "../themeSelector";
import Title from "../title";
import DeleteButton from "../ui/deleteButton";
import { PageBadge } from "../ui/page/badge";
import { PageButton } from "../ui/page/button";
import {
  PageCard,
  PageCardAction,
  PageCardHeader,
  PageCardTitle,
} from "../ui/page/card";
import PageContainer from "../ui/page/container";
import PageText from "../ui/page/text";
import {
  Button,
  Checkbox,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/shadcn";
import { Field, FieldLabel } from "../ui/shadcn/field";
import { Input } from "../ui/shadcn/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/shadcn/input-group";
import { Textarea } from "../ui/shadcn/textarea";
import { UploadButton } from "../uploadthing";
import { OfferBadge } from "./coachOffer";
import generateCircle from "./utils";

type CoachCreationProps = {
  userId: string;
  pageId: string;
};

type CoachCreationForm = {
  imageUrl?: string;
  subtitle: string;
  description: string;
  withCertifications: boolean;
  withActivities: boolean;
};

export const CoachCreation = ({ userId, pageId }: CoachCreationProps) => {
  const t = useTranslations("pages");
  const form = useForm<CoachCreationForm>();
  const queryCoach = trpc.users.getUserById.useQuery(
    { id: userId, options: { withMemberData: true } },
    {
      enabled: Boolean(userId),
      refetchOnWindowFocus: false,
    },
  );
  const queryCoachData = trpc.pages.getCoachDataForPage.useQuery(
    { coachUserId: userId },
    {
      enabled: Boolean(userId),
      refetchOnWindowFocus: false,
    },
  );
  const fields = useWatch({ control: form.control });
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");
  const updatePageStyle = trpc.pages.updatePageStyleForCoach.useMutation({
    onSuccess() {
      toast.success(t("style-saved"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const querySection = trpc.pages.getPageSection.useQuery(
    {
      pageId,
      section: "HERO",
      createIfNone: true,
      createElement: { elementType: "HERO_CONTENT", title: "Héro" },
    },
    {
      enabled: isCUID(pageId),
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (!querySection.data) return;

    const hc = querySection.data?.elements.find(
      (e) => e.elementType === "HERO_CONTENT",
    );
    const options = querySection.data?.elements.filter(
      (e) => e.elementType === "OPTION",
    );

    const resetData: CoachCreationForm = {
      description: hc?.content ?? "",
      subtitle: hc?.subTitle ?? "",
      withActivities:
        options.find((o) => o.title === "activities")?.optionValue === "yes",
      withCertifications:
        options.find((o) => o.title === "certifications")?.optionValue ===
        "yes",
      imageUrl: hc?.imageUrls?.[0] ?? undefined,
    };
    form.reset(resetData);
  }, [querySection.data, form]);

  const createSectionElement =
    trpc.pages.createPageSectionElement.useMutation();
  const updateSectionElement = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess() {
      toast.success(t("section-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<CoachCreationForm> = async (data) => {
    const hc = querySection?.data?.elements.find(
      (e) => e.elementType === "HERO_CONTENT",
    );
    if (!hc || !querySection.data) {
      toast.error("error hc");
      return;
    }
    const optionActivities = querySection?.data?.elements.find(
      (e) => e.elementType === "OPTION" && e.title === "activities",
    );
    const optionCertifications = querySection?.data?.elements.find(
      (e) => e.elementType === "OPTION" && e.title === "certifications",
    );
    await updateSectionElement.mutateAsync({
      id: hc.id!,
      subTitle: data.subtitle,
      content: data.description,
      images: data.imageUrl ? [data.imageUrl] : undefined,
    });
    if (optionCertifications?.id) {
      await updateSectionElement.mutateAsync({
        id: optionCertifications.id,
        optionValue: data.withCertifications ? "yes" : "no",
      });
    } else {
      createSectionElement.mutate({
        elementType: "OPTION",
        sectionId: querySection.data.id,
        title: "certifications",
        optionValue: data.withCertifications ? "yes" : "no",
      });
    }
    if (optionActivities?.id) {
      await updateSectionElement.mutateAsync({
        id: optionActivities.id,
        optionValue: data.withActivities ? "yes" : "no",
      });
    } else {
      createSectionElement.mutate({
        elementType: "OPTION",
        sectionId: querySection.data.id,
        title: "activities",
        optionValue: data.withActivities ? "yes" : "no",
      });
    }
  };

  const handleDeleteImage = () => {
    form.setValue("imageUrl", undefined);
  };

  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full auto-rows-auto gap-2 lg:grid-cols-2">
      <div>
        <h3>{t("updating-page")}</h3>
        <form
          className="rounded border border-primary p-2 space-y-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="col-span-2 flex items-start gap-4">
            <div className="flex-1">
              <UploadButton
                endpoint="imageAttachment"
                onClientUploadComplete={(result) => {
                  form.setValue("imageUrl", result[0].ufsUrl);
                }}
                buttonText={t("hero.image")}
              />
            </div>
            {fields.imageUrl ? (
              <div className="relative w-40 max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fields.imageUrl} alt="" />
                <DeleteButton
                  label={t("hero.delete-image")}
                  icon
                  onClick={handleDeleteImage}
                  className="absolute right-2 bottom-2 z-10"
                />
              </div>
            ) : null}
          </div>
          <Field orientation="horizontal">
            <FieldLabel>{t("coach.name")}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                disabled
                value={queryCoach.data?.coachData?.publicName ?? t("undefined")}
              />
              <InputGroupAddon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info />
                  </TooltipTrigger>
                  <TooltipContent>{t("coach.your-public-name")}</TooltipContent>
                </Tooltip>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="coach-info">{t("coach.info")}</FieldLabel>
            <Input id="coach-info" {...form.register("subtitle")} type="text" />
          </Field>
          <Field>
            <FieldLabel htmlFor="coach-description">
              {t("coach.description")}
            </FieldLabel>
            <Textarea
              id="coach-description"
              {...form.register("description")}
              rows={4}
            />
          </Field>
          <Field orientation="horizontal">
            <Controller
              name="withCertifications"
              control={form.control}
              render={({ field }) => (
                <>
                  <Checkbox
                    id="coach-with-certifications"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                  <FieldLabel htmlFor="coach-with-certifications">
                    {t("coach.with-certifications")}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("coach.certifications-from-dashboard")}
                      </TooltipContent>
                    </Tooltip>
                  </FieldLabel>
                </>
              )}
            />
          </Field>
          <Field orientation="horizontal">
            <Controller
              name="withActivities"
              control={form.control}
              render={({ field }) => (
                <>
                  <Checkbox
                    id="coach-with-activities"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                  <FieldLabel htmlFor="coach-with-certifications">
                    {t("coach.with-activities")}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("coach.activities-in-profile")}
                      </TooltipContent>
                    </Tooltip>
                  </FieldLabel>
                </>
              )}
            />
          </Field>
          <Separator />

          <Button type="submit">{t("save-section")}</Button>
        </form>
      </div>
      <div>
        <div className={`space-y-2`}>
          <h3 className="flex flex-wrap items-center justify-between">
            <span>{t("preview")}</span>
            <ThemeSelector
              onSelect={(t) => setPreviewTheme(t)}
              onSave={(t) => updatePageStyle.mutate({ userId, pageStyle: t })}
            />
          </h3>
          <PageContainer theme={previewTheme} className="pt-4">
            <PhotoSection
              imageSrc={fields.imageUrl}
              userName={queryCoach.data?.coachData?.publicName}
              info={fields.subtitle}
              description={fields.description}
              email={queryCoach.data?.email}
              phone={queryCoach.data?.phone}
              preview
            />
            <CertificationsAndActivities
              withActivities={!!fields.withActivities}
              withCertifications={!!fields.withCertifications}
              certifications={queryCoachData.data?.certifications ?? []}
              activities={queryCoachData.data?.activities ?? []}
              preview
            />
            <CoachOffers
              offers={queryCoachData.data?.offers ?? []}
              coachData={{
                publicName: queryCoach.data?.coachData?.publicName,
                searchAddress: queryCoach.data?.coachData?.searchAddress,
              }}
              preview
            />
            <MapSection
              longitude={
                queryCoach.data?.coachData?.searchAddress
                  ? queryCoach.data?.coachData?.longitude
                  : undefined
              }
              latitude={
                queryCoach.data?.coachData?.searchAddress
                  ? queryCoach.data?.coachData?.latitude
                  : undefined
              }
              range={queryCoach.data?.coachData?.range ?? 10}
              preview
              theme={previewTheme}
            />
          </PageContainer>
        </div>
      </div>
    </div>
  );
};

type CoachDisplayProps = {
  pageId: PageId;
};

export const CoachDisplay = ({ pageId }: CoachDisplayProps) => {
  const queryPage = trpc.pages.getCoachPage.useQuery({ pageId });
  const hero = queryPage.data?.hero;
  if (queryPage.isLoading) return <Spinner />;
  if (!queryPage.data) return <div>No page defined for this coach</div>;

  const options = queryPage.data?.options;
  const activities = queryPage.data?.activities;
  const certifications = queryPage.data?.certifications;
  const ca = { certifications, activities };

  return (
    <PageContainer
      theme={queryPage.data?.pageStyle as TThemes}
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <Title title={queryPage.data?.publicName ?? ""} />

      <PhotoSection
        imageSrc={hero?.imageUrls?.[0]}
        userName={queryPage.data?.publicName}
        info={hero?.subTitle}
        description={hero?.content}
        email={queryPage.data?.email}
        phone={queryPage.data?.phone}
      />
      <CertificationsAndActivities
        withActivities={options.get("activities") === "yes"}
        withCertifications={options.get("certifications") === "yes"}
        certifications={ca.certifications}
        activities={ca.activities}
      />
      <CoachOffers
        offers={queryPage.data?.offers ?? []}
        coachData={{
          publicName: queryPage.data?.publicName,
          searchAddress: queryPage.data?.searchAddress,
        }}
      />
      <MapSection
        longitude={
          queryPage.data?.searchAddress ? queryPage.data?.longitude : undefined
        }
        latitude={
          queryPage.data?.searchAddress ? queryPage.data?.latitude : undefined
        }
        theme={(queryPage.data?.pageStyle as TThemes) ?? "light"}
        range={queryPage.data?.range ?? 10}
      />
    </PageContainer>
  );
};

type PhotoSectionProps = {
  imageSrc?: string | null;
  userName?: string | null;
  phone?: string | null;
  email?: string | null;
  info?: string | null;
  description?: string | null;
  preview?: boolean;
};

function PhotoSection({
  imageSrc,
  userName,
  info,
  description,
  preview = false,
  email,
  phone,
}: PhotoSectionProps) {
  const t = useTranslations("pages");

  return (
    <section
      className={`grid grid-cols-2 place-content-center ${
        preview ? "gap-6" : "gap-16"
      } p-10`}
    >
      <div className="flex justify-end">
        {imageSrc ? (
          <Image
            src={imageSrc}
            width={preview ? 250 : 600}
            height={preview ? 250 : 600}
            alt={userName ?? "photo"}
            className="w-[clamp(250px,40vw,600px)] rounded-md shadow-md"
          />
        ) : null}
      </div>
      <div className="self-start space-y-2">
        <PageText
          level="p"
          className={`${
            preview
              ? "text-3xl"
              : "text-[clamp(2rem,5vw,5rem)] leading-[clamp(3rem,7.5vw,7.5rem)]"
          } font-bold`}
        >
          {userName ?? ""}
        </PageText>
        <PageText
          level="p"
          className={`${
            preview
              ? "text-lg"
              : "text-[clamp(1.5rem,2.5vw,3rem)] leading-[clamp(2.25rem,3.75vw,4.5rem)]"
          } font-semibold`}
        >
          {info}
        </PageText>
        <PageText level="p">{description}</PageText>
        {email ? (
          <PageButton asChild size={preview ? "sm" : "lg"} className="w-full">
            <a href={`mailto:${email}`} target="_blank" rel="noreferrer">
              {t("coach.contact-me-email")}
              <Mail />
            </a>
          </PageButton>
        ) : null}
        {phone ? (
          <PageButton asChild size={preview ? "sm" : "lg"} className="w-full">
            <a href={`tel:${phone}`} target="_blank" rel="noreferrer">
              {t("coach.contact-me-phone")}
              <Phone className={preview ? "size-4" : "size-6"} />
            </a>
          </PageButton>
        ) : null}
      </div>
    </section>
  );
}

type CertificationsAndActivitiesProps = {
  withActivities: boolean;
  withCertifications: boolean;
  certifications: { id: string; name: string }[];
  activities: { id: string; name: string }[];
  preview?: boolean;
};

function CertificationsAndActivities({
  withActivities,
  withCertifications,
  certifications,
  activities,
  preview = false,
}: CertificationsAndActivitiesProps) {
  const t = useTranslations("pages");
  return (
    <section
      className={`grid ${
        withActivities && withCertifications ? "grid-cols-2" : "grid-cols-1"
      } ${preview ? "gap-6 pb-4" : "gap-16 pb-12"} mx-auto w-fit px-10`}
    >
      {withCertifications && certifications.length ? (
        <div>
          <PageText
            level="h3"
            className={
              preview
                ? ""
                : "text-[clamp(2rem,3vw,4rem)] leading-[clamp(3.5rem,4.5vw,5.5rem)]"
            }
          >
            {t("coach.coach-certifications")}
          </PageText>
          <div className="flex flex-wrap gap-2">
            {certifications.map((certification) => (
              <PageBadge key={certification.id}>{certification.name}</PageBadge>
            ))}
          </div>
        </div>
      ) : null}
      {withActivities && activities.length ? (
        <div>
          <PageText
            level="h3"
            className={
              preview
                ? ""
                : "text-[clamp(2rem,3vw,4rem)] leading-[clamp(3.5rem,4.5vw,5.5rem)]"
            }
          >
            {t("coach.coach-activities")}
          </PageText>
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => (
              <PageBadge key={activity.id}>{activity.name}</PageBadge>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

type MapSectionProps = {
  longitude?: number | null;
  latitude?: number | null;
  preview?: boolean;
  theme?: TThemes;
  range: number;
};

function MapSection({
  longitude,
  latitude,
  preview = false,
  range,
  theme = "cupcake",
}: MapSectionProps) {
  const t = useTranslations("pages");

  if (!longitude || !latitude) return null;

  const circle = generateCircle(longitude, latitude, range);

  return (
    <section className={`${preview ? "pt-4" : "pt-24"} w-full bg-muted`}>
      <div className={`mx-auto max-w-4xl ${preview ? "p-8" : "p-24"}`}>
        <h2
          className={`w-full text-center ${
            preview
              ? ""
              : "text-[clamp(2rem,3vw,4rem)] leading-[clamp(3.5rem,4.5vw,5.5rem)]"
          }`}
        >
          {t("coach.where-to-find-me")}
        </h2>
        <div className="col-span-2 w-full border border-primary">
          <MapComponent
            initialViewState={{
              longitude: LONGITUDE,
              latitude: LATITUDE,
              zoom: 7,
            }}
            style={{ width: "100%", height: preview ? "20rem" : "50vh" }}
            mapStyle="mapbox://styles/mapbox/streets-v9"
            mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
            attributionControl={false}
            longitude={longitude}
            latitude={latitude}
          >
            <Source type="geojson" data={circle}>
              <Layer
                type="fill"
                paint={{
                  "fill-color": cssVarToHex("var(--primary)"),
                  "fill-opacity": 0.2,
                }}
              />
              <Layer
                type="line"
                paint={{
                  "line-color": cssVarToHex("var(--primary)"),
                  "line-opacity": 1,
                  "line-width": 2,
                }}
              />
            </Source>
          </MapComponent>
        </div>
      </div>
    </section>
  );
}

type CoachOffersProps = {
  offers: CoachDataOfferType[];
  preview?: boolean;
  coachData: { publicName?: string | null; searchAddress?: string | null };
};

function CoachOffers({ offers, preview, coachData }: CoachOffersProps) {
  const t = useTranslations("pages");
  if (!offers.length) return null;
  return (
    <section
      className={`${preview ? "py-4" : "py-12"} w-full bg-(--page-color-base-300)`}
    >
      <div className={`container mx-auto ${preview ? "py-2 px-8" : "p-8"}`}>
        <PageText level="h3">{t("coach.coach-offers")}</PageText>
        <div className="flex flex-wrap gap-2">
          {offers.map((offer) => (
            <PageCard
              key={offer.id}
              className={cn(
                "flex-1 bg-(--page-color-primary) text-(--page-color-primary-content)",
                preview && "p-2",
              )}
            >
              <PageCardHeader>
                <PageCardTitle className="text-(--page-color-base-content) text-center">
                  {offer.name}
                </PageCardTitle>
              </PageCardHeader>
              {offer?.physical && offer?.myPlace ? (
                <OfferBadge
                  variant="My-Place"
                  publicName={coachData.publicName}
                  searchAddress={coachData.searchAddress}
                  preview={preview}
                  page
                />
              ) : null}
              {offer?.physical && offer?.inHouse ? (
                <OfferBadge
                  variant="In-House"
                  travelLimit={offer.travelLimit}
                  searchAddress={coachData.searchAddress}
                  preview={preview}
                  page
                />
              ) : null}
              {offer?.physical && offer?.publicPlace ? (
                <OfferBadge
                  variant="Public-Place"
                  travelLimit={offer.travelLimit}
                  searchAddress={coachData.searchAddress}
                  preview={preview}
                  page
                />
              ) : null}
              {offer?.webcam ? <OfferBadge variant="Webcam" /> : null}
              <PageText
                level="p"
                className={
                  preview
                    ? "max-h-10 overflow-hidden text-ellipsis text-xs"
                    : "text-base"
                }
              >
                {offer.description}
              </PageText>
              <PageCardAction className="w-full">
                {preview ? (
                  <PageButton size="sm" variant="secondary" className="w-full">
                    {t("coach.offer-details")}
                  </PageButton>
                ) : (
                  <PageButton asChild variant="secondary" className="w-full">
                    <Link href={`/presentation-page/offer/${offer.id}`}>
                      {t("coach.offer-details")}
                    </Link>
                  </PageButton>
                )}
              </PageCardAction>
            </PageCard>
          ))}
        </div>
      </div>
    </section>
  );
}
