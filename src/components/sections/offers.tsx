"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";

import { InferSelectModel } from "drizzle-orm";

import { Pencil, Trash } from "lucide-react";

import { toast } from "sonner";

import Image from "next/image";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { pageSectionElement } from "@/db/schema/page";
import { useUser } from "@/lib/auth/client";
import { formatMoney } from "@/lib/formatNumber";
import { trpc } from "@/lib/trpc/client";
import { useDisplaySubscriptionInfo } from "@/lib/useDisplaySubscription";
import { cn, isCUID } from "@/lib/utils";
import ThemeSelector, { TThemes } from "../themeSelector";
import Confirmation from "../ui/confirmation";
import DeleteButton from "../ui/deleteButton";
import Modal from "../ui/modal";
import { PageButton } from "../ui/page/button";
import { PageCard, PageCardAction, PageCardContent } from "../ui/page/card";
import PageContainer from "../ui/page/container";
import PageText from "../ui/page/text";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "../ui/shadcn";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/shadcn/field";
import { Input } from "../ui/shadcn/input";
import { Textarea } from "../ui/shadcn/textarea";
import { UploadButton } from "../uploadthing";

type OfferCreationProps = {
  clubId: string;
  pageId: string;
};

type OfferFormValues = {
  imageUrls?: string[];
  title: string;
  subTitle: string;
  description: string;
  offerId: string;
};

export const OfferCreation = ({ clubId, pageId }: OfferCreationProps) => {
  const t = useTranslations("pages");
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");

  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "OFFERS", createIfNone: true },
    {
      enabled: isCUID(pageId),
      refetchOnWindowFocus: false,
    },
  );

  const updatePageStyle = trpc.pages.updatePageStyleForClub.useMutation({
    onSuccess() {
      toast.success(t("style-saved"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full auto-rows-auto gap-2 lg:grid-cols-2">
      <div className="space-y-2">
        <h3>{t("offer.offer-section")}</h3>
        {querySection.data?.id ? (
          <>
            <div className="flex flex-wrap gap-2">
              {querySection.data.elements.map((offer) => (
                <Card key={offer.id}>
                  <CardContent>
                    <h4>{offer.title}</h4>
                    <Separator />
                    <div className="flex items-center justify-center gap-2">
                      <UpdateOffer
                        clubId={clubId}
                        pageId={pageId}
                        offerId={offer.id}
                      />
                      <DeleteOffer
                        clubId={clubId}
                        pageId={pageId}
                        offerId={offer.id}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AddOffer
              clubId={clubId}
              pageId={pageId}
              sectionId={querySection.data.id}
            />
          </>
        ) : null}
      </div>
      <div className={`space-y-2`}>
        <h3 className="flex flex-wrap items-center justify-between">
          <span>{t("preview")}</span>
          <ThemeSelector
            onSelect={(t) => setPreviewTheme(t)}
            onSave={(t) => updatePageStyle.mutate({ clubId, pageStyle: t })}
          />
        </h3>
        <PageContainer theme={previewTheme as TThemes}>
          <div className="grid grid-cols-2 gap-4 p-4">
            {querySection.data?.elements.map((card) => (
              <OfferContentCard
                key={card.id}
                offer={card}
                clubId={clubId}
                preview
              />
            ))}
          </div>
        </PageContainer>
      </div>
    </div>
  );
};

type OfferProps = {
  pageId: string;
  sectionId: string;
  clubId: string;
};

function AddOffer({ clubId, pageId, sectionId }: OfferProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);

  const createOffer = trpc.pages.createPageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "OFFERS",
      });
      toast.success(t("offer.offer-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: OfferFormValues) {
    createOffer.mutate({
      pageId,
      sectionId,
      elementType: "CARD",
      title: data.title,
      subTitle: data.subTitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: data.offerId,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("offer.new-offer")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      className="w-11/12 max-w-2xl"
    >
      <h3>
        <span>{t("offer.new-offer")}</span>
      </h3>
      <OfferForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        pageId={pageId}
        clubId={clubId}
      />
    </Modal>
  );
}

type UpdateOfferProps = {
  pageId: string;
  offerId: string;
  clubId: string;
};

function UpdateOffer({ clubId, pageId, offerId }: UpdateOfferProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);
  const [initialData, setInitialData] = useState<OfferFormValues | undefined>();
  const queryOffer = trpc.pages.getPageSectionElementById.useQuery(
    { sectionElementId: offerId },
    {
      enabled: isCUID(offerId),
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (queryOffer.data) {
      const data = queryOffer.data;
      startTransition(() => {
        setInitialData({
          title: data.title ?? "",
          subTitle: data.subTitle ?? "",
          description: data.content ?? "",
          imageUrls: data.images ?? [],
          offerId: data.optionValue ?? "",
        });
      });
    }
  }, [queryOffer.data, setInitialData]);

  const updateAG = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess: (data) => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "OFFERS",
      });
      toast.success(t("offer.offer-updated"));
      setInitialData({
        title: data[0].title ?? "",
        subTitle: data[0].subTitle ?? "",
        description: data[0].content ?? "",
        imageUrls: data[0].imageUrls ?? [],
        offerId: data[0].optionValue ?? "",
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: OfferFormValues) {
    updateAG.mutate({
      id: offerId,
      pageId,
      title: data.title,
      subTitle: data.subTitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: data.offerId,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("offer.update-offer")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      variant="outline"
      buttonIcon={<Pencil />}
      buttonSize="icon"
      className="w-11/12 max-w-2xl"
    >
      <h3>
        <span>{t("offer.update-offer")}</span>
      </h3>
      <OfferForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        initialValues={initialData}
        initialImageUrl={queryOffer.data?.images?.[0]}
        pageId={pageId}
        clubId={clubId}
      />
    </Modal>
  );
}

function DeleteOffer({ pageId, offerId }: UpdateOfferProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");

  const deleteOffer = trpc.pages.deletePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "OFFERS",
      });
      toast.success(t("offer.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("offer.deletion-message")}
      title={t("offer.deletion")}
      buttonIcon={<Trash />}
      onConfirm={() => {
        deleteOffer.mutate({ sectionElementId: offerId });
      }}
      variant="destructive"
      buttonSize="icon"
    />
  );
}

type OfferFormProps = {
  onSubmit: (data: OfferFormValues) => void;
  initialValues?: OfferFormValues;
  initialImageUrl?: string;
  onCancel: () => void;
  update?: boolean;
  pageId: string;
  clubId: string;
};

function OfferForm({
  onSubmit,
  initialValues,
  onCancel,
  clubId,
}: OfferFormProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("pages");

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<OfferFormValues>({
    defaultValues: {
      title: initialValues?.title ?? "",
      subTitle: initialValues?.subTitle ?? "",
      description: initialValues?.description ?? "",
      imageUrls: initialValues?.imageUrls ?? [],
      offerId: initialValues?.offerId ?? "",
    },
  });

  const imageUrls = useWatch({ control, name: "imageUrls" });

  const offers = trpc.subscriptions.getSubscriptionsForClub.useQuery(clubId, {
    enabled: isCUID(clubId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const handleDeleteImage = () => {
    setValue("imageUrls", []);
  };

  const onSuccess: SubmitHandler<OfferFormValues> = (data) => {
    onSubmit({ ...data });
    reset({
      title: data.title,
      subTitle: data.subTitle,
      description: data.description,
      imageUrls: data.imageUrls,
      offerId: data.offerId,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSuccess)}>
      <div className="space-y-2">
        <UploadButton
          endpoint="imageAttachment"
          onClientUploadComplete={(result) =>
            setValue(
              "imageUrls",
              result.map((r) => r.ufsUrl),
            )
          }
          buttonText={t("offer.image")}
          className="col-span-2"
        />

        {imageUrls && imageUrls.length > 0 ? (
          <div className="relative col-span-full flex gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[0]}
              alt=""
              className="max-h-40 w-full object-contain"
            />
            <DeleteButton
              label={t("offer.delete-image")}
              icon
              onClick={handleDeleteImage}
              className="absolute right-2 bottom-2"
            />
          </div>
        ) : null}

        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="offer-title">{t("offer.title")}</FieldLabel>
              <Input
                id="offer-title"
                {...register("title", {
                  required: t("offer.title-mandatory") ?? true,
                })}
              />
              {errors?.title?.message && (
                <FieldError>{errors.title.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-subtitle">
                {t("offer.subtitle")}
              </FieldLabel>
              <Input id="offer-subtitle" {...register("subTitle")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-description">
                {t("offer.description")}
              </FieldLabel>
              <Textarea
                id="offer-description"
                {...register("description")}
                rows={4}
              />
            </Field>
          </FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="offer-offer">{t("offer.offer")}</FieldLabel>
            <Controller
              control={control}
              name="offerId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("offer.offer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {offers.data?.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldSet>
      </div>
      <Separator className="my-4" />
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            reset();
            onCancel();
          }}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}

type OfferDisplayProps = {
  pageId: string;
  clubId: string;
};

export const OfferDisplayCard = ({ pageId, clubId }: OfferDisplayProps) => {
  const querySection = trpc.pages.getPageSection.useQuery(
    {
      pageId,
      section: "OFFERS",
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  if (querySection.isLoading) return <Spinner />;
  if (!querySection.data) return <div>Offers section unavailable</div>;

  return (
    <div className="grid grid-flow-col justify-center gap-4 bg-muted p-4">
      {querySection.data?.elements
        .filter((e) => e.elementType === "CARD")
        .map((e) => (
          <OfferContentCard key={e.id} offer={e} clubId={clubId} />
        ))}
    </div>
  );
};

type OffersContentCardProps = {
  preview?: boolean;
  offer: InferSelectModel<typeof pageSectionElement>;
  clubId: string;
};

type OfferContentElement = InferSelectModel<typeof pageSectionElement>;

function OfferContentCard({
  preview = false,
  offer,
  clubId,
}: OffersContentCardProps) {
  const user = useUser();
  const offerQuery = trpc.subscriptions.getSubscriptionById.useQuery(
    offer.optionValue ?? "",
    { enabled: isCUID(offer.optionValue) },
  );
  const { shortInfo, sites, rooms, activityGroups, activities } =
    useDisplaySubscriptionInfo(
      offerQuery.data?.mode ?? undefined,
      offerQuery.data?.restriction ?? undefined,
      offerQuery.data?.activityGroups ?? [],
      offerQuery.data?.activities ?? [],
      offerQuery.data?.sites ?? [],
      offerQuery.data?.rooms ?? [],
    );
  const t = useTranslations();

  return (
    <PageCard className={cn(preview ? "w-full" : "w-96")}>
      <Image
        src={offer.imageUrls?.[0] ?? ""}
        alt={offer.title ?? ""}
        width={400}
        height={400}
        className="w-full h-full object-cover"
      />
      <PageCardContent>
        <div className="grid grid-cols-[auto,1fr] items-center gap-2">
          {offerQuery.data?.monthly ? (
            <>
              <PageText level="label">
                {t("club.subscription.monthly")}
              </PageText>
              <PageText level="span">
                {formatMoney(offerQuery.data?.monthly)}
              </PageText>
            </>
          ) : null}
          {offerQuery.data?.yearly ? (
            <>
              <PageText level="label">{t("club.subscription.yearly")}</PageText>
              <PageText level="span">
                {formatMoney(offerQuery.data?.yearly)}
              </PageText>
            </>
          ) : null}
          {offerQuery.data?.inscriptionFee ? (
            <>
              <PageText level="label">
                {t("club.subscription.inscription-fee")}
              </PageText>
              <PageText level="span">
                {formatMoney(offerQuery.data?.inscriptionFee)}
              </PageText>
            </>
          ) : null}
          {offerQuery.data?.cancelationFee ? (
            <>
              <PageText level="label">
                {t("club.subscription.cancelation-fee")}
              </PageText>
              <PageText level="span">
                {formatMoney(offerQuery.data?.cancelationFee)}
              </PageText>
            </>
          ) : null}
        </div>
        <PageCardAction className="mt-2">
          {preview ? (
            <PageButton className="w-full">
              {t("pages.offer.select")}
            </PageButton>
          ) : user?.data?.id ? (
            <PageButton variant="primary" asChild>
              <Link
                href={`/user/${user.data.id}/subscribe?clubId=${clubId}&offerId=${offer.optionValue}`}
              >
                {t("pages.offer.select")}
              </Link>
            </PageButton>
          ) : (
            <PageButton variant="primary" asChild>
              <Link href="/user/signin" className="w-full">
                {t("pages.offer.connect-to-subscribe")}
              </Link>
            </PageButton>
          )}
        </PageCardAction>
      </PageCardContent>
    </PageCard>
  );
}
